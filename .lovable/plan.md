
# Fix Order Display and Processing

## Problem Identified

Orders are not showing because the `get-orders` proxy action uses **body-signing on a GET request** (`drGreenRequestBody`). Per the Dr. Green API spec, GET requests must sign the **query string**, not a JSON body. Many HTTP layers strip bodies from GET requests, causing signature mismatches or empty responses.

## Root Cause (Line 3069 of drgreen-proxy)

```text
Current (broken):
  GET /client/{clientId}/orders  -- signs a JSON body {"clientId": "..."}

Correct:
  GET /client/{clientId}/orders  -- signs a query string like "orderBy=desc&take=50"
```

## Changes Required

### 1. Fix the `get-orders` action in `drgreen-proxy/index.ts`

Change the `get-orders` case from `drGreenRequestBody` (body-signing) to `drGreenRequestGet` (query-string signing), matching the pattern used by `get-client`.

Before:
```text
case "get-orders":
  const signBody = { clientId: body.clientId };
  response = await drGreenRequestBody(`/client/${body.clientId}/orders`, "GET", signBody);
```

After:
```text
case "get-orders":
  response = await drGreenRequestGet(
    `/dapp/clients/${body.clientId}/orders`,
    { orderBy: 'desc', take: 50, page: 1 },
    false,
    adminEnvConfig
  );
```

Key changes:
- Switch from `drGreenRequestBody` to `drGreenRequestGet` (query-string signing)
- Use `/dapp/clients/{id}/orders` path (consistent with other `/dapp/` endpoints)
- Add pagination params (`take: 50, page: 1`)
- Use `adminEnvConfig` for credential consistency (same as `get-client`)

### 2. Normalize the response envelope

Wrap the response in the standard `{ success: true, data: [...] }` format so `useOrderTracking` can parse it reliably, matching the pattern used by `get-client`.

### 3. Add fallback error handling in `useOrderTracking.ts`

Add a guard so that if `syncFromDrGreen` receives a non-array or error response, it logs a clear warning rather than silently failing.

## Technical Details

### Files Modified
- `supabase/functions/drgreen-proxy/index.ts` -- fix `get-orders` case (lines 3063-3071)
- `src/hooks/useOrderTracking.ts` -- improve error logging in `syncFromDrGreen`

### Risk Assessment
- **Low risk**: The change aligns the signing method with all other GET endpoints in the proxy
- **No schema changes**: No database modifications needed
- **Backwards compatible**: The frontend `useDrGreenApi.getOrders()` call remains unchanged

### Verification Steps
1. Deploy the updated edge function
2. Navigate to `/orders` while logged in
3. Check edge function logs for successful API responses
4. Confirm orders appear in the UI
