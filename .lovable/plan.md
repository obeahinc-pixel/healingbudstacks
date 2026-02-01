
# Fix: Currency Conversion in Checkout Display

## Problem Analysis

The checkout page is displaying Euro prices (from the Dr. Green API) with the Rand symbol, instead of properly converting EUR to ZAR.

**Current behavior:** €10.00 → Displays as "R 10,00" (wrong)
**Expected behavior:** €10.00 → Displays as "R ~193,00" (correct ZAR conversion)

## Root Cause

1. The Dr. Green API returns all prices in **EUR**
2. The ProductCard correctly converts prices for display using `convertFromEUR()`
3. Cart items store the **raw EUR price** in `unit_price`
4. The Checkout page calls `formatPrice()` **without conversion** - just adding the Rand symbol

## Files to Modify

### 1. `src/pages/Checkout.tsx`

**Changes:**
- Import `useShop` to access `convertFromEUR` function
- Apply conversion when displaying individual item prices
- Apply conversion when displaying the cart total

**Before (line 409):**
```typescript
Qty: {item.quantity} × {formatPrice(item.unit_price, countryCode)}
```

**After:**
```typescript
Qty: {item.quantity} × {formatPrice(convertFromEUR(item.unit_price), countryCode)}
```

**Before (line 413):**
```typescript
{formatPrice(item.quantity * item.unit_price, countryCode)}
```

**After:**
```typescript
{formatPrice(convertFromEUR(item.quantity * item.unit_price), countryCode)}
```

**Before (line 422):**
```typescript
<span className="text-primary">{formatPrice(cartTotal, countryCode)}</span>
```

**After:**
```typescript
<span className="text-primary">{formatPrice(cartTotalConverted, countryCode)}</span>
```

Note: `cartTotalConverted` is already available from `useShop()` and correctly converts the total.

### 2. `src/components/shop/Cart.tsx`

Review and fix the cart drawer component to ensure consistent currency conversion.

**Changes:**
- Ensure cart item prices display with proper EUR→local currency conversion
- Use `convertFromEUR()` from ShopContext

## Technical Details

### Conversion Flow (Correct)
```
Dr. Green API (EUR) → convertFromEUR(amount) → formatPrice(convertedAmount, countryCode)
```

### Exchange Rate Reference
- Current rates are fetched from `exchange-rates` edge function
- ZAR base: EUR ~0.052 means 1 ZAR ≈ €0.052, or €1 ≈ R19.23
- So €10.00 should display as approximately **R 192.30**

## Testing Checklist

After implementation:
1. Add product to cart from shop page
2. Navigate to checkout
3. Verify prices show in ZAR (should be ~19x the EUR amount)
4. Verify cart drawer also shows correct ZAR prices
5. Verify total matches sum of items
6. Test with different products to ensure consistency

## Security Considerations

- No security impact - this is a display-only fix
- Payment amount (`createPayment`) already uses `getCurrencyForCountry()` to send the correct currency to the API
- The API will receive the amount in the correct currency

## Affected User Experience

- All South African users will see correct Rand pricing
- Same fix applies to other non-EUR regions (UK→GBP, Thailand→THB)
