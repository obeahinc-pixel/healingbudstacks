

# Live Order Status Sync from Dr. Green DApp API

## Problem

The patient order history page (`/orders`) reads exclusively from the local `drgreen_orders` database table. When the Dr. Green DApp updates an order's status (e.g., dispatched, payment confirmed), the local table is never updated -- patients see stale data.

The `getOrders(clientId)` function already exists in `useDrGreenApi` but is never called by the patient-facing `useOrderTracking` hook.

## Solution

Modify `useOrderTracking` to fetch live order statuses from the Dr. Green API on page load and sync any changes back into the local table. This keeps the local cache accurate while always showing the latest DApp state.

```text
Current flow:
  Patient visits /orders
    -> Read local drgreen_orders table
    -> Show cached statuses (potentially stale)

New flow:
  Patient visits /orders
    -> Read local drgreen_orders table (instant UI)
    -> Fetch live orders from Dr. Green API via get-orders
    -> Compare statuses, update any that changed
    -> Sync updated statuses back to local DB
    -> Show toast notification for any changes detected
```

## Changes

### 1. Update `useOrderTracking` hook
**File: `src/hooks/useOrderTracking.ts`**

- Import and use `useDrGreenApi` (already available in the project)
- Access the `drGreenClient` from `ShopContext` to get the `drgreen_client_id` needed for the API call
- After loading local orders, call `getOrders(clientId)` to fetch live statuses from the DApp
- For each local order, compare `status` and `payment_status` against the live API response
- If any differ, update the local `drgreen_orders` row and show a toast
- This runs once on mount and can be triggered via `refreshOrders`

### 2. Add a "Last synced" indicator and manual refresh
**File: `src/pages/Orders.tsx`**

- Show a subtle "Last synced: X seconds ago" timestamp near the page header
- Add a refresh button next to it so patients can manually trigger a live sync
- Show a brief loading spinner during the sync without replacing the existing order list

### 3. Add periodic background sync
**File: `src/hooks/useOrderTracking.ts`**

- Set up a 60-second polling interval (matching the verification polling pattern already used in ShopContext)
- Only poll when the Orders page is mounted (cleanup on unmount)
- Skip polling if no orders exist or no client ID is available

## Technical Details

### API Endpoint Used
```text
GET /dapp/orders (via drgreen-proxy action: 'get-orders')
Params: { clientId: string }
Returns: Array of { orderId, status, totalAmount, createdAt, paymentStatus }
```

### Matching Logic
- Match live API orders to local orders by `drgreen_order_id === orderId`
- Only update local rows where `status` or `payment_status` has changed
- Orders that exist in the API but not locally (e.g., placed via DApp directly) will be inserted as new local records
- Local-only orders (prefixed `LOCAL-`) are skipped during sync since they have no DApp counterpart

### Status Change Notifications
When a status changes during sync:
- Toast: "Order #XXXXXXXX status updated to [new status]"
- The realtime subscription already handles future local DB changes, so the sync completes the loop

### No Breaking Changes
- The existing realtime subscription remains active for instant updates from webhook-triggered DB changes
- The local DB read happens first for instant UI, then the live sync overlays any changes
- `saveOrder` and `updateOrderStatus` remain unchanged
- The `reorder` function continues to work from local data

