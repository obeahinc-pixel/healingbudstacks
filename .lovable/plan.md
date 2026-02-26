

# Fix Quantity Denominations + Country Code + Order Detail Enhancements

## 1. Restrict Quantity to 2g, 5g, 10g Only

Currently, all quantity selectors use +1/-1 increment/decrement buttons allowing any gram amount. This needs to change to fixed denomination buttons (2g, 5g, 10g) across 5 locations:

### Files to update:

**`src/components/shop/ProductCard.tsx`**
- Replace the +/- quantity stepper with three selectable denomination buttons: 2g, 5g, 10g
- Default selection: 2g
- The "Add to Cart" button adds the selected denomination

**`src/components/shop/ProductDetail.tsx`** (quick-view dialog)
- Same change: replace +/- stepper with 2g / 5g / 10g toggle buttons
- Total price updates based on selected denomination

**`src/pages/StrainDetail.tsx`** (full strain detail page)
- Same change: replace +/- stepper with 2g / 5g / 10g toggle buttons

**`src/components/shop/Cart.tsx`** (cart sidebar)
- Replace the +/- per-item controls with a denomination selector (2g / 5g / 10g)
- When user switches denomination, call `updateQuantity` with the new value

**`src/context/ShopContext.tsx`**
- The `addToCart` function currently adds quantities together. When a user adds the same strain with a different denomination, it should either replace the quantity or add as a separate line item. Replacing makes more sense for fixed denominations.

### UI Pattern
Three pill/toggle buttons in a row:
```text
[ 2g ] [ 5g ] [ 10g ]
```
Selected state uses primary color, unselected uses outline. Clean, simple, no confusion.

---

## 2. Fix Country Code Fallback (Portugal to South Africa)

**`src/pages/Checkout.tsx`** -- two lines (295 and 357):
- Change `|| 'PT'` to `|| 'ZA'`
- This fixes the email saying "Healing Buds Portugal" for South Africa store orders

---

## 3. Add Status Banner to Order Detail Page

**`src/pages/OrderDetail.tsx`**
- Add a prominent status banner card between the header and timeline, matching the email notification style:
  - Amber background for pending/local orders: "Order Queued for Processing"
  - Green background for confirmed/paid orders: "Order Confirmed"
  - Blue for processing: "Order Being Processed"
- This gives users the same immediate status feedback they see in email

---

## 4. Improve OrdersTable Mobile Visibility

**`src/components/shop/OrdersTable.tsx`**
- Remove `hidden md:table-cell` from the Total column so it always shows
- Add a compact status badge visible on mobile (combine payment + order status into one line)
- Keep Invoice, Qty, and separate status columns as desktop-only

---

## Technical Summary

| File | Change |
|------|--------|
| `src/components/shop/ProductCard.tsx` | Replace +/- stepper with 2g/5g/10g toggle buttons |
| `src/components/shop/ProductDetail.tsx` | Replace +/- stepper with 2g/5g/10g toggle buttons |
| `src/pages/StrainDetail.tsx` | Replace +/- stepper with 2g/5g/10g toggle buttons |
| `src/components/shop/Cart.tsx` | Replace +/- per-item controls with 2g/5g/10g selector |
| `src/context/ShopContext.tsx` | Update addToCart to handle fixed denominations (replace quantity) |
| `src/pages/Checkout.tsx` (lines 295, 357) | Change `'PT'` fallback to `'ZA'` |
| `src/pages/OrderDetail.tsx` | Add status banner card above timeline |
| `src/components/shop/OrdersTable.tsx` | Show total + status on mobile |

## Implementation Order

1. Fix country code fallback in Checkout.tsx (quick, high-impact)
2. Implement 2g/5g/10g denomination selector across all 4 shop components
3. Update ShopContext addToCart logic for fixed denominations
4. Add status banner to OrderDetail page
5. Fix OrdersTable mobile columns

