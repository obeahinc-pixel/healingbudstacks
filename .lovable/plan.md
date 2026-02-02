
# Re-Sync Account Feature: How It Works and Fix Required

## Current Flow (What Happens When User Clicks "Re-Sync Account")

```text
Patient Dashboard (User clicks "Re-Sync Account")
       │
       ▼
useClientResync.ts (handleResyncAccount)
       │
       ├─► 1. Collect existing user data (email, name, address)
       │
       ├─► 2. Call drgreen-proxy with action: 'create-client-legacy'
       │
       ▼
drgreen-proxy Edge Function
       │
       ├─► 3. Build proper Dr. Green API payload
       │
       ├─► 4. Sign request with current credentials (healingbudscoza NFT)
       │
       ├─► 5. POST /dapp/clients → Creates NEW client under current scope
       │
       └─► 6. Return new clientId + kycLink
       
useClientResync.ts (continued)
       │
       ├─► 7. Delete OLD local drgreen_clients record
       │
       ├─► 8. Insert NEW record with new drgreen_client_id
       │
       └─► 9. Open KYC link for user to complete verification
```

## Bug Found: Payload Key Mismatch

The hook sends data under `data`, but the proxy expects it under `payload`:

**Hook sends:**
```typescript
{
  action: 'create-client-legacy',
  data: { firstName, lastName, email, ... }  // ← Wrong key
}
```

**Proxy expects:**
```typescript
const legacyPayload = body?.payload;  // ← Looks for 'payload'
```

## Fix Required

Change `useClientResync.ts` to use `payload` instead of `data`:

```typescript
const clientPayload = {
  action: 'create-client-legacy',
  payload: {  // ← Changed from 'data' to 'payload'
    firstName,
    lastName,
    email: existingClientData.email,
    // ... rest of fields
  },
};
```

---

## What Happens After Re-Sync

1. **New Client ID**: The user gets a fresh `drgreen_client_id` that is "owned" by the current API credentials
2. **KYC Required**: User must complete KYC verification again via the Dr. Green portal
3. **Admin Approval**: After KYC, the account shows as "Awaiting Admin Approval"
4. **Once Verified**: The user can place orders without 401 errors

---

## Implementation Changes

### File: `src/hooks/useClientResync.ts`

**Change 1**: Fix the payload key from `data` to `payload`

**Change 2**: Ensure the shipping address fields map correctly to the API schema (including `countryCode` as 3-letter ISO like "PRT" instead of 2-letter "PT")

**Change 3**: Add better error handling for the case where the Dr. Green API rejects the client creation (e.g., duplicate email under same NFT)

---

## Testing Steps

After the fix:
1. Log in as Kayliegh or Scott (users with 401 order issues)
2. Navigate to Patient Dashboard
3. Click "Re-Sync Account" in Quick Actions
4. Confirm in the dialog
5. Verify:
   - Toast shows "Account Re-Linked"
   - KYC link opens in new tab
   - Dashboard shows new "Complete KYC" status
6. Complete KYC on the Dr. Green portal
7. Return and refresh dashboard
8. Status should update to "Awaiting Admin Approval"
9. Once approved, try placing an order - should succeed!

---

## Edge Cases Handled

- **Duplicate Email**: If the email already exists under current NFT scope, the API will return an error (we show this to the user)
- **Missing Shipping Address**: Hook provides placeholder data for minimal registration
- **KYC Link Not Returned**: Some API responses may not include kycLink - we handle this gracefully

---

## Summary

The Re-Sync feature is **already implemented** but has a payload key mismatch bug. Once fixed:
- Kayliegh and Scott can re-register under current credentials
- They'll need to complete KYC again (one-time requirement)
- After verification, orders will work because their `clientId` will be "owned" by the healingbudscoza NFT credentials
