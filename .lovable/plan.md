

# Fix Email Region Detection + Enhance Order Detail View

## Problem 1: Email Says "Healing Buds Portugal" for South Africa Orders

The order confirmation email shows "Healing Buds Portugal" because the country code fallback in `Checkout.tsx` (lines 295 and 357) defaults to `'PT'`:

```text
const clientCountryCode = drGreenClient.country_code || countryCode || 'PT';
```

Since `ricardo.drgreennft.com` is the South Africa site, but the client's `country_code` in the DB is likely null or not set, it falls through to the hardcoded `'PT'` fallback. This then gets passed as `region: 'PT'` to the email function, which looks up "Healing Buds Portugal" in `DOMAIN_CONFIG`.

### Fix
- **`src/pages/Checkout.tsx`** (lines 295 and 357): Change fallback from `'PT'` to `'ZA'` since this is the South Africa store. Better yet, derive a smarter default from the tenant context or shipping address country.

## Problem 2: Email "from" Domain Always Uses .co.za

The `send-order-confirmation` edge function hardcodes the "from" address to `noreply@send.healingbuds.co.za` for all regions. Each region's emails should come from their own domain.

### Fix
- **`supabase/functions/send-order-confirmation/index.ts`**: Add `sendDomain` to `DOMAIN_CONFIG` and use it in the `from:` field:
  - ZA: `send.healingbuds.co.za`
  - PT: `send.healingbuds.pt`
  - GB: `send.healingbuds.co.uk`
  - Global fallback: `send.healingbuds.co.za`
- Fix PT support email from `suporte@healingbuds.pt` to `support@healingbuds.pt`

## Problem 3: Order Detail Page Should Show Email-Level Information

When clicking "Recent Orders", the detail page should mirror the information shown in the confirmation email: status banner (e.g., "Order Queued for Processing"), product table with quantities and subtotals, shipping address, and total -- similar to the email layout.

### Fix
- **`src/pages/OrderDetail.tsx`**: Add a status banner card (amber for pending/local orders, green for confirmed) matching the email's visual treatment. The existing page already shows items, shipping, and total -- just needs the prominent status message banner added above the timeline.

## Problem 4: OrdersTable Shows Limited Info on Mobile

On mobile, most columns are hidden (`hidden md:table-cell`). When a user taps an order, they only see the date, a truncated ref, and the action button.

### Fix
- **`src/components/shop/OrdersTable.tsx`**: Show total amount and a single combined status badge on mobile (remove `hidden md:table-cell` from key columns or add a mobile-specific summary row).

---

## Technical Changes Summary

| File | Change |
|------|--------|
| `src/pages/Checkout.tsx` (2 lines) | Change `'PT'` fallback to `'ZA'` on lines 295 and 357 |
| `supabase/functions/send-order-confirmation/index.ts` | Add `sendDomain` to DOMAIN_CONFIG, use region-aware `from:`, fix PT `suporte` to `support` |
| `src/pages/OrderDetail.tsx` | Add status banner card (amber for pending/local, green for confirmed) above the timeline |
| `src/components/shop/OrdersTable.tsx` | Show total and status on mobile view |

## Implementation Order

1. Fix the country code fallback in Checkout.tsx (root cause of wrong region)
2. Update send-order-confirmation edge function with region-aware domains
3. Enhance OrderDetail.tsx with status banner
4. Improve OrdersTable mobile visibility

