

# Plan: Fix 401 Errors and Sync Dr. Green API as Source of Truth

## Problem

1. **401 errors** from the Dr. Green API on `dashboard-summary`, `sales-summary`, and `get-clients-summary` endpoints — these endpoints likely don't exist or the API key lacks permissions for them
2. **`healingbudsglobal@gmail.com` doesn't exist** as an auth user — needs to be created as admin
3. **Local database is out of sync** — only 3 clients and 1 order locally, but more exist on the Dr. Green API
4. **`scott@healingbuds.global` is admin** but shouldn't be — `healingbudsglobal@gmail.com` should be

## Root Cause of 401

The proxy calls `/dapp/dashboard/summary`, `/dapp/sales/summary`, and `/dapp/clients/summary` — these are **not documented in the Postman/API reference**. The Dr. Green API only supports:
- `GET /dapp/clients` (list clients)
- `GET /dapp/orders` (list orders)
- `GET /dapp/dashboard/sales` and `/dapp/dashboard/analytics`

The dashboard should derive stats from **real endpoints** (`dapp-clients`, `dapp-orders`) rather than calling non-existent summary endpoints.

## Steps

### 1. Create `healingbudsglobal@gmail.com` auth account
- Use `admin-update-user` Edge Function with password `12345678`, email confirmed
- The `auto_assign_admin_role` trigger will auto-assign admin role

### 2. Remove admin role from `scott@healingbuds.global`
- Delete the role record, or confirm with you first

### 3. Fix AdminDashboard to use real API endpoints
- Replace `getClientsSummary()`, `getDashboardSummary()`, `getSalesSummary()` calls (which hit non-existent endpoints causing 401s) with `getDappClients()` and existing order data
- Compute summary stats client-side from the real client/order lists
- This eliminates the 401 errors entirely

### 4. Build a proper sync mechanism
- On admin dashboard load or manual "Sync" button, fetch all clients via `GET /dapp/clients` and all orders via `GET /dapp/orders` from the Dr. Green API
- Upsert results into local `drgreen_clients` and `drgreen_orders` tables
- The Dr. Green API is the source of truth; local tables are a cache for faster UI access and RLS-based user queries

### 5. Link unlinked clients
- For Dr. Green clients whose email matches an existing auth user, auto-create the `drgreen_clients` mapping row with matching `user_id`
- For clients with no local auth account, log them as external (they'll be linked on signup)

## Files Changed

- `src/pages/AdminDashboard.tsx` — remove calls to non-existent summary endpoints, compute stats from real data
- `src/hooks/useDrGreenApi.ts` — possibly remove or deprecate `getDashboardSummary`, `getSalesSummary`, `getClientsSummary` if they only call non-existent endpoints
- `src/hooks/useDrGreenClientSync.ts` — enhance to also sync orders, not just clients
- Edge Function invocation to create the admin account

