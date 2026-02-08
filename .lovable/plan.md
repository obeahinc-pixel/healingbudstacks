
# Plan: Resolve API Key Permissions for Dr. Green Client Creation

## Current Situation

All 4 configured API environments (Production, Alt-Production, Staging, Railway) can **read** data (GET strains) but **cannot create clients** (POST /dapp/clients returns 401 Unauthorized).

This indicates the API keys are associated with NFTs that have read-only access, not client creation rights.

---

## Root Cause

According to the Dr. Green DApp API documentation provided:
- Clients are created **against the primary NFT selected in the dapp**
- The API key must be linked to an NFT with **client creation permissions**
- Current keys appear to be "viewer" level, not "operator" level

---

## Solution Options

### Option A: Obtain New API Keys with Write Permissions (Recommended)

**Steps:**

1. Contact Dr. Green / NFT administrator to obtain API credentials linked to an NFT with full CRUD permissions

2. The new credentials should include:
   - API Key (Base64-encoded public key)
   - Private Key (for secp256k1 signature generation)
   - Confirmation that the NFT has client creation rights

3. Update the secrets in Lovable Cloud:
   - Either replace existing `DRGREEN_API_KEY` and `DRGREEN_PRIVATE_KEY`
   - Or add new dedicated keys like `DRGREEN_WRITE_API_KEY` and `DRGREEN_WRITE_PRIVATE_KEY`

4. Update the edge function to use the write-enabled keys for client creation

---

### Option B: Fix Staging URL Configuration

Regardless of Option A, the staging environment has a URL bug:

**Current Issue:**
- `DRGREEN_STAGING_API_URL` contains trailing `/dapp/`
- Causes double path: `/api/v1/dapp//dapp/clients`

**Fix:**
- Update `DRGREEN_STAGING_API_URL` secret to: `https://stage-api.drgreennft.com/api/v1`
- Remove any trailing `/dapp/` from the URL

---

### Option C: Temporary Workaround (Local-Only Verification)

If obtaining new API keys takes time:

1. Continue using local `drgreen_clients` table with verification flags
2. Admin manually sets `is_kyc_verified: true` and `admin_approval: 'VERIFIED'`
3. Users can browse/checkout with local verification
4. Real Dr. Green sync happens later when proper keys are available

This is already partially implemented but prevents real API order placement.

---

## Technical Changes Required

### 1. Environment Configuration Update

Add support for a dedicated "write" environment:

```typescript
// In ENV_CONFIG
'production-write': {
  apiUrl: 'https://api.drgreennft.com/api/v1',
  apiKeyEnv: 'DRGREEN_WRITE_API_KEY',
  privateKeyEnv: 'DRGREEN_WRITE_PRIVATE_KEY',
  name: 'Production (Write)',
}
```

### 2. Action Routing by Permission

Route read operations to read-only keys, write operations to write-enabled keys:

```typescript
// Client creation uses write environment
case "create-client":
case "admin-reregister-client":
case "bootstrap-test-client":
  envConfig = getWriteEnvironment();
  break;

// Read operations use default
default:
  envConfig = getEnvironment(requestedEnv);
```

### 3. Secret Updates Required

Once new credentials are obtained, add these secrets:

| Secret Name | Purpose |
|-------------|---------|
| `DRGREEN_WRITE_API_KEY` | API key with client creation rights |
| `DRGREEN_WRITE_PRIVATE_KEY` | Private key for signing write requests |

---

## Verification Steps

After obtaining proper credentials:

1. Test client creation:
```bash
POST /drgreen-proxy
{
  "action": "bootstrap-test-client",
  "email": "test@example.com",
  "firstName": "Test",
  "lastName": "User",
  "countryCode": "PT",
  "environment": "production-write"
}
```

2. Verify response includes:
   - `clientId` (Dr. Green UUID)
   - `kycLink` (verification URL)
   - `isKYCVerified: false` (initial state)

3. Test with Scott and Kayleigh's actual data

---

## Summary

| Task | Priority | Owner |
|------|----------|-------|
| Obtain write-enabled API keys | High | External (Dr. Green team) |
| Fix staging URL secret | Medium | Can do immediately |
| Add write environment config | Medium | After keys obtained |
| Re-register Scott/Kayleigh | High | After keys working |

---

## Immediate Next Step

**You need to obtain API keys that have client creation permissions from your Dr. Green NFT administrator.** The current keys are read-only.

Alternatively, if you have access to the Dr. Green DApp admin portal, you may be able to:
1. Generate new API keys from an NFT with operator permissions
2. Download the public/private key pair
3. Provide them to me to configure as secrets
