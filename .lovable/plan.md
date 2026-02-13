
# Ensure Orders Are Posted to Dr. Green API

## Problem Identified

The most recent order created by `scott.k1@outlook.com` shows:
- **Status**: `PENDING_SYNC` (not synced to Dr. Green)
- **Order ID**: `LOCAL-20260210-7P0Z` (local fallback, not from Dr. Green API)
- **sync_status**: `pending`
- **Created**: 2026-02-10 (patient order placed but failed to post to Dr. Green)

This indicates the order creation flow hit an error and fell back to creating a local order record instead of posting to the Dr. Green API.

## Root Causes to Investigate

### 1. **create-order Action Implementation** (drgreen-proxy/index.ts, lines 2745-3050)
The `create-order` action in the proxy performs a 3-step atomic transaction:
- **Step 1**: PATCH client shipping address to Dr. Green (`/dapp/clients/{id}`)
- **Step 2**: POST cart items to Dr. Green (`/dapp/carts`)
- **Step 3**: POST order from cart (`/dapp/orders`)

**Potential Issues**:
- The PATCH step might be failing silently if the shipping address format is incorrect
- Cart items might not be posting correctly (format mismatch, missing fields)
- The order creation from cart might be failing due to missing/inactive client status
- Environment credential mismatches between steps (each step might need specific credentials)

### 2. **Missing Error Logging**
The checkout page shows a local fallback was created, but there's no visible error message to the user about why the Dr. Green API call failed. The edge function logs for this specific order don't exist, which suggests:
- The error might be happening in the Checkout component before it even calls the proxy
- Or the proxy error is being silently caught and not logged

### 3. **Client Verification Status**
The order was placed, but we need to verify:
- Is the client (`dfd81e64-c17d-4a1b-8111-cdf49f879e82`) still verified in Dr. Green?
- Has `isKYCVerified` and `adminApproval === "VERIFIED"` been maintained?
- Is the client active in the Dr. Green system?

## Changes Required

### 1. **Add Detailed Error Logging in Checkout** (src/pages/Checkout.tsx, lines 223-242)
Capture and log the exact error returned from `createOrder()` so we can see what Dr. Green API is returning.

### 2. **Verify the 3-Step Order Creation Flow** (supabase/functions/drgreen-proxy/index.ts, lines 2745-3050)
Ensure each step:
- Uses the correct endpoint (`/dapp/clients/{id}` for PATCH, `/dapp/carts` for POST items, `/dapp/orders` for order creation)
- Uses query-string signing for GET, body-signing for POST/PATCH
- Handles response normalization correctly
- Logs errors with specific step identifiers

### 3. **Check Client Eligibility Before Order** (Checkout.tsx)
Add a pre-order check to verify the client is still eligible (KYC verified + admin approved) before attempting order creation.

### 4. **Monitor Sync Status** (Admin Dashboard)
Add visibility to the admin dashboard to show:
- Orders with `PENDING_SYNC` status
- The `sync_error` field for debugging why orders haven't synced
- A manual "Retry Sync" button for failed orders

## Technical Details

### Files to Examine
- `src/pages/Checkout.tsx` — error handling around `createOrder()` call (lines 223-250)
- `supabase/functions/drgreen-proxy/index.ts` — `create-order` case (lines 2745-3050)
- `supabase/functions/drgreen-proxy/index.ts` — PATCH/POST/GET request helpers and signing logic

### Key Questions to Resolve
1. **What exact error is returned from the Dr. Green API during order creation?**
   - Check the `createOrder()` result in Checkout.tsx
   - Add console.log for the full error message

2. **Is the client still active and verified?**
   - Run: `SELECT is_kyc_verified, admin_approval FROM drgreen_clients WHERE user_id = 'd6f38c88-c111-4be6-a0c9-ae64b7c294a6'`
   - Verify the Dr. Green API still has this client as active

3. **Are the API endpoints being called?**
   - Check edge function logs for PATCH (shipping), POST (cart items), POST (order creation)
   - Verify which step is failing

### Risk Assessment
- **Low Risk**: Adding logging and verification checks doesn't change existing behavior
- **No Breaking Changes**: Only enhances error visibility
- **Backwards Compatible**: Existing orders aren't affected

### Verification Steps
1. Review the exact error message from the failed order creation
2. Verify client eligibility in Dr. Green (is-active, KYC verified, admin approval)
3. Check edge function logs for the 3-step order flow
4. Place a new test order and capture the complete error flow
5. Confirm the new order syncs correctly to Dr. Green (status changes from `PENDING_SYNC` to `confirmed`)
