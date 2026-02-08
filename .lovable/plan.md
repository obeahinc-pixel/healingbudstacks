

# Fix: Dr. Green API Proxy Signing Method

## Problem Identified

The API is **online and credentials are valid** -- confirmed by the health check endpoint which successfully authenticates and returns strains data (200 OK in 497ms).

However, the main proxy function uses the **wrong signing algorithm**, causing all 5 environments to return 401 Unauthorized.

### Root Cause Analysis

Three critical mismatches exist between the working health check and the broken proxy:

1. **Signing Algorithm Mismatch**
   - Health check uses **HMAC-SHA256** (symmetric) -- this is correct per WordPress reference: "Auth Mechanism: HMAC SHA256 Signature + Public Key"
   - Proxy uses **secp256k1 ECDSA** (asymmetric DER-encoded signatures) -- this is incorrect

2. **Payload Being Signed**
   - Health check signs the **query string** for GET requests (e.g., `orderBy=desc&take=1&page=1`)
   - Proxy signs an **empty JSON object** (`"{}"`) for all GET requests

3. **API Key Header Format**
   - Health check sends the **raw API key** value as stored in the secret
   - Proxy processes the key through `extractPemBody()`, which strips PEM headers and sends only the inner Base64 body

### Why the Confusion Occurred

The `api_uses.md` documentation shows `crypto.sign(null, Buffer.from(payload), privateKeyObject)` which looks like asymmetric signing. However, the WordPress implementation (`api.md`) explicitly states "HMAC SHA256 Signature" -- and the health check proves this is the correct approach. The `crypto.sign(null, ...)` pattern may apply to POST requests only, or may be a documentation error.

## Implementation Plan

### Step 1: Add Diagnostic Endpoint to Confirm Fix
Before changing the main proxy, add a new `debug-signing-test` action that tests both signing methods against the same strains endpoint. This will definitively confirm which approach works.

The diagnostic will test:
- Method A: HMAC-SHA256 + raw apiKey + sign query string (health check approach)
- Method B: secp256k1 ECDSA + extractPemBody + sign `"{}"` (current proxy approach)

### Step 2: Fix GET Request Signing in Proxy
Update `drGreenRequestGet()` to use HMAC-SHA256 signing of the query string instead of secp256k1 ECDSA signing of `"{}"`:
- Change the signing from `signPayload("{}", secretKey)` to a new `signWithHmac(queryString, secretKey)` function
- Send the raw API key instead of processing it through `extractPemBody()`
- Keep the existing secp256k1 approach available as a fallback

### Step 3: Fix POST Request Signing in Proxy
Update `drGreenRequestBody()` to use HMAC-SHA256 signing of the JSON payload:
- Change the signing from secp256k1 ECDSA to HMAC-SHA256
- Sign the stringified JSON body
- Send the raw API key instead of `extractPemBody()` output

### Step 4: Fix Cart Remove Inconsistency
The `remove-from-cart` handler already sends the raw `apiKey` (line 2209), which is actually correct. Align all other handlers to do the same.

### Step 5: Preserve Backwards Compatibility
- Keep `generateSecp256k1Signature()` and `generatePrivateKeySignature()` functions intact (they may be needed for other API versions)
- Add a configuration flag `DRGREEN_USE_HMAC=true` (default true) so the signing method can be toggled without code changes if needed

### Step 6: Test All Environments
After deploying the fix, run the debug-compare-keys diagnostic to verify all 5 environments authenticate successfully.

## Technical Details

### New HMAC Signing Function (matching health check)
```text
function signWithHmac(data, secretKey):
  1. Base64-decode secretKey to get raw bytes (PEM text as bytes)
  2. Import as HMAC-SHA256 key via crypto.subtle.importKey("raw", ...)
  3. Sign the data string with HMAC
  4. Return Base64-encoded signature
```

### Updated GET Request Flow
```text
Before: sign("{}", secp256k1) + extractPemBody(apiKey)
After:  sign(queryString, HMAC-SHA256) + raw apiKey
```

### Updated POST Request Flow
```text
Before: sign(JSON.stringify(body), secp256k1) + extractPemBody(apiKey)
After:  sign(JSON.stringify(body), HMAC-SHA256) + raw apiKey
```

### Files to Modify
- `supabase/functions/drgreen-proxy/index.ts` -- Main proxy signing logic
- `supabase/functions/drgreen-health/index.ts` -- No changes needed (already works correctly)

### Risk Assessment
- **Low risk**: The health check already proves the HMAC approach works with current credentials
- **Rollback**: Can toggle back to ECDSA via environment variable if needed
- **No frontend changes**: Only backend proxy signing is affected

