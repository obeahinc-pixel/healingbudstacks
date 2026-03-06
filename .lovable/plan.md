

# Plan: Price Sovereignty, Commerce SDK, Navigation Fix & Export Readiness

## Current State Analysis

**Prices already come from the API.** Every component (`ProductCard`, `StrainQuickView`, `StrainDetail`, `Cart`, `Checkout`) reads `product.retailPrice` from the Dr. Green API via `useProducts`. There are zero hardcoded prices. The only math is `retailPrice × quantity` — unavoidable since the API doesn't know cart contents.

**The real vulnerability:** stale `unit_price` in `drgreen_cart` table. A user adds a strain at R10/g, the API updates to R12/g, the cart still says R10.

**`cartTotalConverted` is dead code** — it equals `cartTotal` on line 93 of `ShopContext.tsx`.

---

## Part 1: TruthProvider + Commerce SDK (`src/lib/commerce.ts`)

### New: `src/lib/commerce.ts` — The "Sovereign Truth" Library

A single utility module (not a class — keeps it simple) that encapsulates all financial logic:

```typescript
// Price cache, unit processing, cart validation
export const PriceTruth = {
  cache: new Map<string, number>(),
  setPrices(products: { id: string; retailPrice: number }[]),
  getPrice(strainId: string): number,  // returns 0 if unknown
  calculateLineTotal(strainId: string, grams: number): number,
  validateCart(cart: CartItem[]): { corrected: CartItem[]; hasDrift: boolean },
}
```

- **No class**, no `UnitProcessor` class — a plain object with functions. Matches React/Lovable patterns.
- Unit handling: All products are per-gram. If `retailPrice === 0` or missing, block the transaction (return `{ blocked: true, reason: "Price unavailable" }`).
- Exported as standalone functions for reuse in Catalog, Cart, and Checkout.

### New: `src/context/TruthProvider.tsx`

A thin React Context wrapper around `commerce.ts`:
- Exposes `getTruthPrice()`, `validateCartPrices()`, `lastRefreshed`
- Wraps the app in `App.tsx` (inside `ShopProvider`)

### Changes to existing files

| File | Change |
|---|---|
| `src/hooks/useProducts.ts` | After fetch, call `PriceTruth.setPrices()`. Remove fallback chain (`pricePerGram`, `pricePerUnit`, `price`) → use only `strain.retailPrice \|\| 0` |
| `src/context/ShopContext.tsx` | `addToCart`: override `item.unit_price` with `PriceTruth.getPrice(item.strain_id)`. Remove `cartTotalConverted` field. Compute `cartTotal` from truth prices. |
| `src/components/shop/Cart.tsx` | Replace `cartTotalConverted` → `cartTotal`. Display line prices via `getTruthPrice(strain_id) * quantity`. |
| `src/components/shop/StrainQuickView.tsx` | Total: `getTruthPrice(product.id) * quantity` (already correct pattern, just source from truth cache) |
| `src/pages/StrainDetail.tsx` | Same pattern for total display |
| `src/components/shop/ProductCard.tsx` | No change needed — already uses `product.retailPrice` directly |
| `src/pages/Checkout.tsx` | On mount: call `validateCartPrices()`. If drift detected, auto-correct DB and show clinical toast before allowing submission. Remove `cartTotalConverted` reference. |

### Clinical error messages
- **Price drift:** *"Pricing Update: Cart prices have been adjusted to reflect current clinical pricing. Please review before proceeding."*
- **Price unavailable:** *"Clinical Notice: Price data unavailable for this product. Please refresh or contact support."*

---

## Part 2: Navigation Active State Fix

### File: `src/components/NavigationMenu.tsx`

**Remove:**
- `border-b-2 border-[#EAB308]` on active (line 46)
- Gold dot indicator (lines 57-59)
- Gold icon color for active (line 52)

**Replace with:**
- Active: `bg-white/10` background, white icon, white 2px bottom underline
- Hover: gold icon tint, `bg-white/10`, no underline
- Active underline: `bg-white` instead of `bg-[#EAB308]`

---

## Part 3: Modularization & Export Readiness

### New: `src/config/endpoints.ts`

Centralize all API endpoint configuration:
```typescript
export const API_CONFIG = {
  drgreen: {
    proxy: 'drgreen-proxy',
    actions: {
      getStrains: 'get-strains-legacy',
      getClient: 'get-client',
      createClient: 'create-client-legacy',
      // ... all actions in one place
    }
  }
};
```

Currently, action strings like `'get-strains-legacy'` are scattered across `useProducts.ts`, `ShopContext.tsx`, `drgreenApi.ts`, `useDrGreenApi.ts`, etc. This centralizes them.

### New: `.env.example`

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

No secrets — just the shape. Prevents export failures.

### Lovable-specific dependency audit

- `lovable-tagger` — dev-only, already stripped in production builds. No risk.
- `@/integrations/supabase/client.ts` — standard Supabase client, fully portable.
- All path aliases (`@/`) already configured in `tsconfig.json`. No broken imports on export.
- `vite.config.ts` base path: currently `/` (correct for Lovable preview), `./` needed for cPanel. The existing `5_build_and_fix.ps1` script handles this. No change needed.

### `src/lib/privacy.ts` — Zero-Retention Middleware

A standalone utility for PII scrubbing, portable to any host:
```typescript
export function withPrivacyFilter<T>(data: T): T  // strips email, phone, name from log payloads
export function sanitizeForLogging(obj: Record<string, unknown>): Record<string, unknown>
```

This extracts the existing `sanitizeForLogging` pattern from `drgreen-webhook` and `drgreen-proxy` into a shared, importable module.

---

## Part 4: GitHub Action Workflow Update

### File: `.github/workflows/deploy-healingbuds.yml` (existing)

Add a **pre-deploy audit step** that:
1. Runs `grep -r "DRGREEN_API_KEY\|DRGREEN_PRIVATE_KEY" src/` — fails build if secrets found in frontend code
2. Runs `grep -r "api.drgreennft.com" src/` — fails build if direct API URLs found in frontend
3. Validates `.env` variables are set in GitHub Secrets

This enforces Zero-Retention at CI level — no PII or secrets can accidentally ship to production.

---

## Summary of Deliverables

| # | Deliverable | Type |
|---|---|---|
| 1 | `src/lib/commerce.ts` | New — Commerce SDK with PriceTruth |
| 2 | `src/context/TruthProvider.tsx` | New — React Context wrapper |
| 3 | `src/config/endpoints.ts` | New — Centralized API actions |
| 4 | `src/lib/privacy.ts` | New — Portable PII scrubber |
| 5 | `.env.example` | New — Environment template |
| 6 | `src/hooks/useProducts.ts` | Edit — Remove fallbacks, push to truth cache |
| 7 | `src/context/ShopContext.tsx` | Edit — Use truth prices, remove `cartTotalConverted` |
| 8 | `src/components/shop/Cart.tsx` | Edit — Use truth prices |
| 9 | `src/pages/Checkout.tsx` | Edit — Validate prices on mount |
| 10 | `src/components/NavigationMenu.tsx` | Edit — Fix active state styling |
| 11 | `src/App.tsx` | Edit — Add TruthProvider |
| 12 | `.github/workflows/deploy-healingbuds.yml` | Edit — Add security audit step |

