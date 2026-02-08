

# Route Admin Dashboard Reads Through Production-Write Environment

## Problem
Admin dashboard dApp endpoints (`dashboard-summary`, `sales-summary`, `get-clients-summary`, `dapp-clients`, etc.) return **401 Unauthorized** because they use the default `production` credentials (`DRGREEN_API_KEY`), which lack dApp admin permissions. The `production-write` credentials (`DRGREEN_WRITE_API_KEY`) have full access but are currently only auto-routed for client creation (write) actions.

## Root Cause
In the `drgreen-proxy` edge function:
- Line 1884: `envConfig = getEnvironment(requestedEnv)` resolves to `production` by default
- Admin read endpoints (lines 2263-2308, 3956) call `drGreenRequestQuery(...)` **without passing `envConfig`**, so they fall back to hardcoded `production` credentials
- The `WRITE_ACTIONS` list (line 354) only includes `create-client`, `create-client-legacy`, `admin-reregister-client`, `bootstrap-test-client` -- no admin read actions

## Solution

### 1. Edge Function: Add dApp Admin Read Actions to Auto-Route List (drgreen-proxy)

Create a new `DAPP_ADMIN_READ_ACTIONS` array alongside `WRITE_ACTIONS`:

```text
DAPP_ADMIN_READ_ACTIONS = [
  'dashboard-summary',
  'dashboard-analytics',
  'sales-summary',
  'dapp-clients',
  'dapp-client-details',
  'dapp-clients-list',
  'dapp-orders',
  'dapp-order-details',
  'dapp-carts',
  'dapp-nfts',
  'dapp-strains',
  'get-clients-summary',
  'get-sales-summary',
  'admin-list-all-clients',
]
```

### 2. Edge Function: Update Environment Resolution Logic

Modify `getWriteEnvironment` to also check `DAPP_ADMIN_READ_ACTIONS`, so both write actions AND admin read actions automatically route to `production-write` when those credentials are configured.

### 3. Edge Function: Use Resolved envConfig in All Admin Endpoints

Update every admin case in the switch statement to pass `envConfig` (or the auto-resolved write config) to `drGreenRequestQuery` and `drGreenRequestBody`:

Before:
```typescript
case "dashboard-summary":
  response = await drGreenRequestQuery("/dapp/dashboard/summary", {});
```

After:
```typescript
case "dashboard-summary":
  response = await drGreenRequestQuery("/dapp/dashboard/summary", {}, false, adminEnvConfig);
```

Same pattern for `sales-summary`, `dapp-clients`, `dashboard-analytics`, `get-clients-summary`, `dapp-orders`, and all other dApp admin endpoints.

### 4. Main Handler: Resolve Admin Environment Early

After line 1884 where `envConfig` is resolved, add logic to detect admin actions and resolve to write credentials:

```typescript
const requestedEnv = body?.env as string | undefined;
const envConfig = getEnvironment(requestedEnv);
// Auto-route dApp admin reads to production-write credentials
const adminEnvConfig = getWriteEnvironment(action, requestedEnv);
```

This way `adminEnvConfig` will use `production-write` for both write AND admin read actions, while `envConfig` stays as-is for non-admin operations.

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/drgreen-proxy/index.ts` | Add `DAPP_ADMIN_READ_ACTIONS` list, update `getWriteEnvironment` to include admin reads, pass resolved env config to all admin endpoint calls |

## No Frontend Changes Required

The frontend (`useDrGreenApi.ts` and `AdminDashboard.tsx`) already sends the environment via `body.env`. The proxy will now correctly auto-route admin reads to the write-enabled credentials regardless of the frontend's selected environment.

## Verification Steps

After deployment:
1. Call `dashboard-summary` -- should return live data instead of 401
2. Call `sales-summary` -- should return sales stats
3. Call `get-clients-summary` -- should return client counts
4. Call `dapp-clients` -- should return paginated client list
5. Confirm that non-admin endpoints (e.g., `get-strains`) continue to use standard production credentials

