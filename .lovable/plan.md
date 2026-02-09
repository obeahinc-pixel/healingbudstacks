

# Use Production Credentials for All API Calls

## Problem
The `drgreen-proxy` edge function routes many actions (client reads, cart, orders, etc.) to the `production-write` credentials (`DRGREEN_WRITE_API_KEY` / `DRGREEN_WRITE_PRIVATE_KEY`), which are returning `401 Unauthorized`. The user wants all calls to use the standard production credentials (`DRGREEN_API_KEY` / `DRGREEN_PRIVATE_KEY`) instead.

## Root Cause
The `DAPP_ADMIN_READ_ACTIONS` array (lines 365-395) contains a large list of actions that get routed to `production-write` via `getWriteEnvironment()`. This includes client reads, cart operations, orders, and more. The write credentials appear to lack the necessary permissions.

## Solution
Remove all entries from the `DAPP_ADMIN_READ_ACTIONS` array so that every action falls through to the standard `production` environment. This is a single change in one file.

## Technical Details

**File:** `supabase/functions/drgreen-proxy/index.ts`

1. **Empty the `DAPP_ADMIN_READ_ACTIONS` array** (lines 365-395) -- remove all action strings so it becomes an empty array `[]`. This stops `getWriteEnvironment()` from ever routing to `production-write`.

2. **Empty the `WRITE_ACTIONS` array** as well (if it also routes to write credentials), OR alternatively, remove the write credential check in `getWriteEnvironment()` so it always returns the standard production environment.

The net effect: every action uses `DRGREEN_API_KEY` + `DRGREEN_PRIVATE_KEY` (production), regardless of whether it's a read or write operation. The `production-write` environment remains configured but unused unless explicitly requested via the `environment` parameter.

**Deployment:** The `drgreen-proxy` edge function will be redeployed after the change.

