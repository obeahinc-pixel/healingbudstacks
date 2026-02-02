

# Fix Plan: Debug create-client-legacy 401 Error

## Problem Summary
The Re-Sync Account feature returns a 401 error. The error message `"User is not authorized"` comes from the Dr. Green API, indicating the proxy's credentials may not be authorized to create new clients.

## Investigation Findings
1. User authentication (Supabase JWT) is working correctly
2. The payload structure is correct (using `payload` key as expected)
3. No `create-client-legacy` processing logs appear in edge function logs
4. The Dr. Green API is rejecting the request with 401

## Proposed Solution

### Step 1: Add Enhanced Logging (Immediate)
Add explicit logging at the START of the `create-client-legacy` case handler to confirm the action is being reached:

**File**: `supabase/functions/drgreen-proxy/index.ts`
- Add `console.log("[create-client-legacy] ========== STARTING HANDLER ==========")` at the very beginning of the case block

### Step 2: Verify API Credentials
Check if the `DRGREEN_API_KEY` and `DRGREEN_PRIVATE_KEY` secrets are configured correctly and authorized for client creation endpoints.

### Step 3: Test with Debug Header
Temporarily test using the `x-admin-debug-key` header to bypass Supabase auth and isolate whether the issue is:
- Supabase auth verification
- Dr. Green API credential signing

## Technical Details

The `create-client-legacy` action is in `DEBUG_ACTIONS` (line 121), which allows bypassing auth with the correct debug header. If the Dr. Green API still returns 401 with debug mode, the issue is definitively with the API credentials.

## Next Steps After Fix
1. Deploy the enhanced logging
2. Re-test the Re-Sync flow
3. Check logs to see where exactly the 401 originates
4. If API credentials issue: Contact Dr. Green dApp admin to verify key permissions

