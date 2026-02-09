

# Fix: Order Processing - Credential Scope Mismatch

## Problem

Orders are failing with "Client shipping address not found" when adding items to cart. This is NOT a signing or key formatting issue -- both signing methods authenticate correctly.

**Root cause**: The `create-order` and `add-to-cart` actions use default production credentials (`DRGREEN_API_KEY`), but clients were created with write credentials (`DRGREEN_WRITE_API_KEY`). The Dr. Green API enforces NFT-scoped access, so the production keys can READ the client but cannot WRITE to their cart or create orders.

## Evidence

| Test | Result |
|------|--------|
| `debug-signing-test` (GET /strains) | Both HMAC and secp256k1 return 200 -- signing works |
| `get-client` (production keys) | 200 -- can READ client data including shipping |
| `update-shipping-address` (production keys) | 200 response but shipping NOT included in response body |
| `add-to-cart` (production keys) | 400 "Client shipping address not found" |
| `add-to-cart` (write keys) | 400 "Client shipping address not found" (same) |
| `create-order` full flow | Step 1 (shipping PATCH) returns 200 but shipping "NOT confirmed in response (credential scope)"; Step 2 (cart POST) fails 3 times with same error |

## Fix

Route cart and order write operations through the same write-enabled credentials used for client creation.

### File: `supabase/functions/drgreen-proxy/index.ts`

**Change 1: `add-to-cart` case (~line 2761)**
- Add `getWriteEnvironment("add-to-cart", body.environment)` to get write credentials
- Pass the write `envConfig` to `drGreenRequestBody("/dapp/carts", "POST", cartPayload, false, writeEnvConfig)`

**Change 2: `create-order` case (~line 2849)**
- Add `const writeEnvConfig = getWriteEnvironment("create-order", body.environment)` at the start of the case
- Pass `writeEnvConfig` to all three steps:
  - Step 1: `drGreenRequestBody(/dapp/clients/${clientId}, "PATCH", shippingPayload, false, writeEnvConfig)`
  - Step 2: `drGreenRequestBody("/dapp/carts", "POST", cartPayload, false, writeEnvConfig)`
  - Step 3: `drGreenRequestBody("/dapp/orders", "POST", orderPayload, false, writeEnvConfig)`

**Change 3: `place-order` case (~line 2826)**
- Add `getWriteEnvironment` and pass write credentials to `drGreenRequest("/dapp/orders", "POST", ...)`

**Change 4: `empty-cart` case (~line 2812)**
- Route through write credentials as well

**Change 5: Ensure `WRITE_ACTIONS` array includes these actions**
- Verify that `add-to-cart`, `create-order`, `place-order`, `empty-cart`, `remove-from-cart` are listed in the `WRITE_ACTIONS` array so `getWriteEnvironment` recognizes them

### Verification After Fix

After deploying, re-run these tests in order:
1. `add-to-cart` with write credentials -- should return 200
2. `create-order` full flow -- should complete all 3 steps
3. Check `drgreen_orders` table for non-LOCAL order IDs

## Risk Assessment

- Low risk: only routing existing operations through a different credential set
- No signing logic changes needed
- No payload format changes needed
- Rollback: revert the `envConfig` parameter additions

