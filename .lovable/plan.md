

# Fix Client Authorization Error in Admin Panel

## Problem Summary

When trying to approve/verify client "Kayliegh" in the Admin Client Manager, the system returns a 404 error:

```
Cannot PATCH /api/v1/dapp/clients/47542db8-3982-4204-bd32-2f36617c5d3d/verify
```

The Dr. Green API does not have endpoints `/dapp/clients/{clientId}/verify` or `/dapp/clients/{clientId}/reject` - these endpoints don't exist.

---

## Root Cause

The current implementation assumes the Dr. Green API has:
- `PATCH /dapp/clients/{clientId}/verify` - Does NOT exist
- `PATCH /dapp/clients/{clientId}/reject` - Does NOT exist

The API returns 404 because these endpoints were incorrectly assumed to exist.

---

## Solution

Based on the API patterns observed in the codebase:
1. The API has `activate` and `deactivate` endpoints
2. Client approval likely works via a `PATCH /dapp/clients/{clientId}` with an `adminApproval` field in the body

We need to:
1. Update the edge function to use the correct API endpoint format
2. Send `adminApproval: "VERIFIED"` or `adminApproval: "REJECTED"` as the request body

---

## Implementation Details

### 1. Update Edge Function Handler

Change the `dapp-verify-client` case in `supabase/functions/drgreen-proxy/index.ts`:

```text
Current (BROKEN):
  PATCH /dapp/clients/{clientId}/verify   -> 404 Not Found
  PATCH /dapp/clients/{clientId}/reject   -> 404 Not Found

Proposed Fix:
  PATCH /dapp/clients/{clientId}
  Body: { "adminApproval": "VERIFIED" }   -> For approval
  Body: { "adminApproval": "REJECTED" }   -> For rejection
```

### 2. Map verifyAction to adminApproval Status

| verifyAction | adminApproval Value |
|--------------|---------------------|
| `"verify"`   | `"VERIFIED"`        |
| `"reject"`   | `"REJECTED"`        |

### 3. Code Change

```typescript
case "dapp-verify-client": {
  const { clientId, verifyAction } = body || {};
  if (!clientId || !verifyAction) throw new Error("clientId and verifyAction are required");
  if (!validateClientId(clientId)) throw new Error("Invalid client ID format");
  
  // Map action to adminApproval status
  const adminApproval = verifyAction === 'verify' ? 'VERIFIED' : 'REJECTED';
  
  // Use PATCH to /dapp/clients/{clientId} with adminApproval in body
  response = await drGreenRequest(
    `/dapp/clients/${clientId}`, 
    "PATCH", 
    { adminApproval }
  );
  break;
}
```

---

## Alternative: Use Activate/Deactivate Endpoints

If the `adminApproval` field approach doesn't work, the API might expect:

- `PATCH /dapp/clients/{clientId}/activate` for approval
- `PATCH /dapp/clients/{clientId}/deactivate` for rejection

This would require testing to confirm which pattern the Dr. Green API uses.

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/drgreen-proxy/index.ts` | Update `dapp-verify-client` case to use correct API endpoint and body format |

---

## Testing After Fix

1. Navigate to `/admin` -> Dashboard tab
2. Click on a client with "Pending" status (like Kayliegh)
3. Click "Approve" button
4. Verify the API call succeeds and client status changes to "VERIFIED"
5. Test the "Reject" functionality on another pending client

---

## Technical Notes

- The edge function will need to be redeployed after the change
- The frontend code (`useDrGreenApi.ts` and `AdminClientManager.tsx`) already correctly sends `verifyAction: 'verify'` or `verifyAction: 'reject'`
- No frontend changes are needed - only the edge function needs to map this to the correct API format

