

# Fix Order Data for Reliable Admin Sync

## The Problem

Currently, the `drgreen_orders` table stores **minimal data** - it doesn't capture the shipping address used at checkout. When an admin syncs an order:

1. The system fetches the shipping address from `drgreen_clients`
2. If the client updated their address after placing the order, **the wrong address is sent to Dr. Green API**
3. This causes delivery failures

## Solution: Store Order Context at Checkout

Capture a complete snapshot of order context when the order is placed, ensuring admin sync always uses the correct data.

---

## Database Changes

Add columns to `drgreen_orders`:

| Column | Type | Purpose |
|--------|------|---------|
| `client_id` | text | Dr. Green client ID at time of order |
| `shipping_address` | jsonb | Address snapshot at checkout |
| `customer_email` | text | Email for quick reference |
| `customer_name` | text | Name for quick reference |
| `country_code` | text | Country for regional tracking |
| `currency` | text | Currency used (EUR, ZAR, GBP) |

---

## Code Changes

### 1. Update Order Tracking Hook (`useOrderTracking.ts`)

Modify `saveOrder()` to accept and store:
- Shipping address snapshot
- Client ID
- Customer details
- Currency/country

### 2. Update Checkout Flow (`Checkout.tsx`)

Pass complete order context when saving:
- Include shipping address used
- Include client ID
- Include country/currency

### 3. Update Admin Order Sync (`useAdminOrderSync.ts`)

Prioritize order-stored data:
- Use `order.shipping_address` instead of client record
- Use `order.client_id` directly (no join needed)
- Only fallback to client record if order data missing

---

## Implementation Sequence

### Step 1: Database Migration
```sql
ALTER TABLE drgreen_orders 
  ADD COLUMN IF NOT EXISTS client_id text,
  ADD COLUMN IF NOT EXISTS shipping_address jsonb,
  ADD COLUMN IF NOT EXISTS customer_email text,
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS country_code text,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'EUR';

CREATE INDEX idx_drgreen_orders_client_id ON drgreen_orders(client_id);
```

### Step 2: Update Checkout
Store complete context when order is placed

### Step 3: Update Admin Sync
Use order-stored address instead of fetching from client

### Step 4: Backfill Existing Orders (Optional)
Script to populate missing data for old orders

---

## Technical Benefits

1. **Address Accuracy** - Orders sync with the address used at checkout, not current client address
2. **Faster Queries** - No joins needed for admin order view
3. **Audit Trail** - Complete order context preserved for compliance
4. **Regional Analytics** - Track orders by country/currency

---

## Files to Modify

| File | Change |
|------|--------|
| Database migration | Add columns |
| `src/hooks/useOrderTracking.ts` | Expand saveOrder() interface |
| `src/pages/Checkout.tsx` | Pass complete order context |
| `src/hooks/useAdminOrderSync.ts` | Use order data instead of client join |
| `src/components/admin/AdminOrdersTable.tsx` | Display captured address |

