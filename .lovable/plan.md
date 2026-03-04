

# Plan: Remove Dead Exchange Rate Infrastructure

## Findings

After the previous cleanup of `ShopContext.tsx`, nothing imports `useExchangeRates` or calls `updateCachedRates` anymore. The entire exchange rate pipeline is dead code:

1. **`src/hooks/useExchangeRates.ts`** — not imported anywhere. Dead file.
2. **`supabase/functions/exchange-rates/index.ts`** — only called by `useExchangeRates`. Dead edge function.
3. **`src/lib/currency.ts`** — `updateCachedRates` and `convertPrice` are exported but never imported. The mutable `cachedRates` variable is only used by these two dead functions. `formatPrice` and `getCurrencyForCountry` are actively used by 17 files.

## Changes

### 1. Delete `src/hooks/useExchangeRates.ts`
Entire file is dead code — remove it.

### 2. Delete `supabase/functions/exchange-rates/index.ts`
No longer invoked. Remove the file and its config entry.

### 3. Remove config entry from `supabase/config.toml`
Delete the `[functions.exchange-rates]` block (lines for `exchange-rates`).

### 4. Clean up `src/lib/currency.ts`
Remove:
- `let cachedRates` variable and its fallback rates (lines 20-27)
- `updateCachedRates` function (lines 38-41)
- `convertPrice` function (lines 44-65) — never imported
- The `rates` parameter from `formatPrice` options interface (used only by `convertPrice`)
- The `convertFrom` branch inside `formatPrice` that calls `convertPrice` (lines 79-81)

Keep:
- `currencyMap`, `currencySymbols` — used by `formatPrice` and `getCurrencyForCountry`
- `getCurrencyForCountry`, `getCurrencySymbol` — actively imported
- `formatPrice` — actively imported by 17 files
- `getLocaleForCountry` — used by `formatPrice`

### 5. Remove `.lovable/plan.md` dead plan reference
The plan references the now-completed location fallback work. Clear it or leave as-is (optional, low priority).

## Impact
- Removes ~200 lines of dead code across 3 files
- Removes one edge function deployment (saves cold-start resources)
- No functional change — all active `formatPrice` calls remain untouched

