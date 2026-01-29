

# Fix Client Approval - Use Correct Dr. Green API Endpoints

## Problem Confirmed

Testing revealed that while the current implementation no longer returns 404, it doesn't actually update the client's `adminApproval` status. The API returns HTTP 200 but the `adminApproval` field remains "PENDING".

**API Response After PATCH:**
```json
{
  "adminApproval": "PENDING",  // <-- Still PENDING, not VERIFIED
  "isKYCVerified": true,
  "updatedAt": "2026-01-29T20:55:54.415Z"  // <-- Timestamp updated
}
```

---

## Root Cause

The Dr. Green API does NOT accept `adminApproval` as a field in the PATCH `/dapp/clients/{id}` request body. The field is read-only on that endpoint.

Looking at existing patterns in the codebase:
- `PATCH /dapp/clients/{id}/activate` - Sets `isActive: true`
- `PATCH /dapp/clients/{id}/deactivate` - Sets `isActive: false`

The API likely follows the same sub-resource pattern for approval:
- `PATCH /dapp/clients/{id}/approve` - Sets `adminApproval: "VERIFIED"`
- `PATCH /dapp/clients/{id}/reject` - Sets `adminApproval: "REJECTED"`

---

## Solution

Update the `dapp-verify-client` case in the edge function to use the correct sub-resource endpoints.

**Current (Not Working):**
```typescript
// Sends adminApproval in body - API ignores it
response = await drGreenRequest(
  `/dapp/clients/${clientId}`, 
  "PATCH", 
  { adminApproval: "VERIFIED" }
);
```

**Fixed:**
```typescript
// Use correct sub-resource endpoint pattern
const endpoint = verifyAction === 'verify' 
  ? `/dapp/clients/${clientId}/approve`
  : `/dapp/clients/${clientId}/reject`;

response = await drGreenRequest(endpoint, "PATCH", {});
```

---

## Implementation Details

### File to Modify

`supabase/functions/drgreen-proxy/index.ts`

### Code Change (Lines 1871-1881)

Replace:
```typescript
case "dapp-verify-client": {
  const { clientId, verifyAction } = body || {};
  if (!clientId || !verifyAction) throw new Error("clientId and verifyAction are required");
  if (!validateClientId(clientId)) throw new Error("Invalid client ID format");
  
  // Map verifyAction to adminApproval status for the Dr. Green API
  const adminApproval = verifyAction === 'verify' ? 'VERIFIED' : 'REJECTED';
  
  // Use PATCH to /dapp/clients/{clientId} with adminApproval in body
  response = await drGreenRequest(`/dapp/clients/${clientId}`, "PATCH", { adminApproval });
  break;
}
```

With:
```typescript
case "dapp-verify-client": {
  const { clientId, verifyAction } = body || {};
  if (!clientId || !verifyAction) throw new Error("clientId and verifyAction are required");
  if (!validateClientId(clientId)) throw new Error("Invalid client ID format");
  
  // Use sub-resource endpoints for approval/rejection
  // Following the same pattern as activate/deactivate
  const endpoint = verifyAction === 'verify' 
    ? `/dapp/clients/${clientId}/approve`
    : `/dapp/clients/${clientId}/reject`;
  
  response = await drGreenRequest(endpoint, "PATCH", {});
  break;
}
```

---

## Alternative Endpoints to Try

If `/approve` and `/reject` return 404, the API might use:
- `/dapp/clients/{id}/verify` (already tried - returned 404)
- `/dapp/clients/{id}/admin-approve`
- `POST` instead of `PATCH`

We can add fallback logic to try multiple endpoint patterns:

```typescript
case "dapp-verify-client": {
  const { clientId, verifyAction } = body || {};
  if (!clientId || !verifyAction) throw new Error("clientId and verifyAction are required");
  if (!validateClientId(clientId)) throw new Error("Invalid client ID format");
  
  // Try /approve and /reject first (most likely pattern)
  const primaryEndpoint = verifyAction === 'verify' 
    ? `/dapp/clients/${clientId}/approve`
    : `/dapp/clients/${clientId}/reject`;
  
  response = await drGreenRequest(primaryEndpoint, "PATCH", {});
  
  // If 404, try alternative endpoints
  if (response.statusCode === 404) {
    logInfo("Primary endpoint not found, trying alternative", { endpoint: primaryEndpoint });
    
    // Try POST instead of PATCH
    response = await drGreenRequest(primaryEndpoint, "POST", {});
  }
  
  break;
}
```

---

## Testing After Fix

1. Deploy the updated edge function
2. Navigate to `/admin` Dashboard tab
3. Click "Approve" on Kayliegh Moutinho
4. Verify the API returns success
5. Check that:
   - Kayliegh moves from "Pending" (6) to "Verified" (1)
   - The summary counts update correctly
6. Test the "Reject" functionality on another pending client

---

## Technical Notes

- The edge function must be redeployed after changes
- No frontend changes required
- If `/approve` returns 404, we'll need to check Dr. Green API documentation for the correct endpoint
- Consider contacting Dr. Green API support if endpoint discovery fails

