

# Fix: Dr. Green API Credential Verification for Order Creation

## Problem Summary

The order creation flow is failing because the shipping address PATCH request returns `200 OK` but **does not persist** the data. The subsequent cart and order steps fail with "Client shipping address not found."

**Technical Diagnosis:**
- PATCH to `/dapp/clients/{clientId}` returns HTTP 200
- Response body does NOT contain shipping data (`shippingVerified = false`)
- This indicates the API accepted the request but the credentials lack write permissions for this client record

## Root Cause: NFT-Scoped API Access Control

The Dr. Green API enforces **NFT-scoped access control**:
- Clients are created "against the primary NFT selected in the dApp" (per API docs)
- Only API credentials tied to the NFT that created the client can modify that client's record
- The `DRGREEN_API_KEY` and `DRGREEN_PRIVATE_KEY` currently stored in secrets may not match the wallet `0x0b60d85fefcd9064a29f7df0f8cbc7901b9e6c84`

The API silently accepts the PATCH but doesn't persist changes because it's a "soft failure" - the request is syntactically valid but the credential scope doesn't authorize the modification.

---

## Solution Options

### Option A: Verify & Update API Credentials (Recommended)

**Action Required (Non-code change):**

1. Log into the Dr. Green dApp dashboard at [https://dapp.drgreennft.com](https://dapp.drgreennft.com)
2. Connect wallet `0x0b60d85fefcd9064a29f7df0f8cbc7901b9e6c84`
3. Navigate to API Settings / Credentials section
4. Generate new API Key and Private Key pair
5. Update the Lovable Cloud secrets:
   - `DRGREEN_API_KEY` → New Base64-encoded API key
   - `DRGREEN_PRIVATE_KEY` → New Base64-encoded private key (secp256k1 PKCS#8 format)
6. Re-test the checkout flow

This is a configuration change, not a code change.

---

### Option B: Add Detailed API Credential Diagnostics (Code Change)

If Option A doesn't resolve the issue, add diagnostic logging to identify exactly what the API is returning:

**File: `supabase/functions/drgreen-proxy/index.ts`**

Modify the `create-order` PATCH step to log the full response body when shipping is not verified:

```typescript
// After PATCH response
if (returnedShipping && returnedShipping.address1) {
  logInfo("Shipping address verified in response");
  shippingVerified = true;
} else {
  // Enhanced diagnostic logging
  logWarn("Shipping address NOT persisted - likely credential scope issue", {
    responseStatus: shippingResponse.status,
    responseHasData: !!responseData?.data,
    responseKeys: Object.keys(responseData?.data || {}),
    clientId: clientId,
  });
  // Log full response for debugging (temporarily)
  console.log("[DIAGNOSTIC] Full PATCH response:", JSON.stringify(responseData, null, 2));
}
```

This will provide visibility into exactly what the Dr. Green API returns when the shipping update "succeeds" but doesn't persist.

---

### Option C: Alternative Order Flow (Fallback)

If credential issues cannot be resolved, implement an alternative flow that:
1. Uses the Dr. Green Admin Portal to manually update shipping addresses
2. Stores shipping locally in Supabase and includes it in order notes
3. Contacts Dr. Green support to investigate the permission model

---

## Recommended Next Steps

1. **Immediate**: Verify the `DRGREEN_API_KEY` and `DRGREEN_PRIVATE_KEY` were generated from the wallet `0x0b60d85fefcd9064a29f7df0f8cbc7901b9e6c84`

2. **If credentials are correct**: Add diagnostic logging (Option B) to capture the full API response

3. **If credentials need updating**: Generate fresh keys from the Dr. Green dashboard while connected with the correct wallet

---

## Technical Context

| Item | Value |
|------|-------|
| Client ID | `47542db8-3982-4204-bd32-2f36617c5d3d` |
| Client Email | `kayliegh.sm@gmail.com` |
| KYC Status | `VERIFIED` |
| Admin Approval | `VERIFIED` |
| Expected Wallet | `0x0b60d85fefcd9064a29f7df0f8cbc7901b9e6c84` |
| API Endpoint | `https://api.drgreennft.com/api/v1` |

The local Supabase `drgreen_clients` record is correctly linked and verified. The issue is exclusively at the Dr. Green API credential/permission layer.

