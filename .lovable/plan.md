

# Phase 2: Psychological Refinement, Effect-First Cards, and Shipping Normalization

## Overview

This phase transforms the strain cards from "commodity-style" (THC/CBD numbers first) to "effect-first" (what will this do for me?), hardens the shipping data normalization in the proxy, and polishes the mobile bottom bar as a calm "floating goal."

---

## 1. Strain Card: Effect-First Redesign

**File**: `src/components/shop/ProductCard.tsx`

**Current state**: THC/CBD percentage boxes dominate the card content area. Effects are tiny 11px grey tags at the bottom -- easy to miss.

**Changes**:
- Move the **Effects** section above THC/CBD, using higher-contrast pill badges with subtle mood-associated icons (mapped from effect names like "Relaxed" -> a calm icon, "Energetic" -> a bolt icon)
- Move **Terpenes** into a visible row (currently not shown at all on the card) using a subtle "Flavour:" label with named pills (e.g., "Limonene", "Myrcene")
- Demote THC/CBD to a compact inline row (still visible, but not the dominant visual)
- Remove the "High Potency" sparkle badge -- it's a pressure element that creates anxiety for medical patients
- Keep the card clean with proper spacing between sections (chunking)

**Information hierarchy (top to bottom)**:
1. Image
2. Name + Price
3. Effect tags (prominent, high-contrast)
4. Terpene/flavour tags (secondary)
5. THC/CBD inline (compact, informational)
6. CTA button

---

## 2. Strains Grid: Effect-Based Filtering

**File**: `src/components/shop/ProductGrid.tsx`

**Current state**: Filters are Type-only (Sativa/Indica/Hybrid/CBD) + Sort dropdown. No effect-based filtering.

**Changes**:
- Add a horizontal scrollable "Filter by Effect" row below the existing Type filters
- Extract unique effects from all loaded products and display them as clickable filter pills
- When an effect is selected, filter products to only those containing that effect
- Keep it single-level (no nested menus) -- flat hierarchy
- Add a "Terpene" filter as a secondary row or combined with effects
- Ensure "Clear" button resets all filters including effect selection

---

## 3. Backend: Shipping Address Deep Normalization

**File**: `supabase/functions/drgreen-proxy/index.ts`

**Current state**: The `shippings[0]` -> `shipping` normalization is already in place. However, field-level normalization is missing: the API may return `zipCode` instead of `postalCode`, `null` for `address2`, or lowercase `countryCode`.

**Changes** (applied at the same two normalization points -- `get-my-details` ~line 2380 and `get-client` ~line 2672):

After extracting `shipping = shippings[0]`, normalize the object:

```typescript
function normalizeShippingObject(shipping: Record<string, unknown>): Record<string, unknown> {
  return {
    ...shipping,
    postalCode: String(shipping.postalCode || shipping.zipCode || shipping.zip_code || '').trim(),
    address1: String(shipping.address1 || shipping.address_line_1 || '').trim(),
    address2: String(shipping.address2 || shipping.address_line_2 || '').trim(), // never null
    city: String(shipping.city || '').trim(),
    state: String(shipping.state || shipping.city || '').trim(),
    country: String(shipping.country || '').trim(),
    countryCode: String(shipping.countryCode || shipping.country_code || '').trim().toUpperCase(),
    landmark: String(shipping.landmark || '').trim(),
  };
}
```

This guarantees:
- `postalCode` is always the canonical key (mapped from `zipCode`/`zip_code` if needed)
- `address2` is always an empty string, never `null`
- `countryCode` is always uppercase (e.g., "PRT" not "prt")
- No undefined fields reach the frontend

---

## 4. Mobile Bottom Bar: Calm Floating Goal

**File**: `src/components/MobileBottomActions.tsx`

**Current state**: Already state-aware with correct CTAs per user state. Styling uses aggressive gradient greens.

**Changes**:
- Soften the CTA gradient from bright emerald to the established pharma-teal palette (already defined in CSS vars)
- Reduce shadow intensity for a calmer, less "sales-y" feel
- Ensure consistent use of `--pharma-teal` tokens rather than hardcoded emerald values
- Keep the structure identical -- just a palette refinement

---

## Technical Summary

| Area | Files Modified | What Changes |
|------|---------------|--------------|
| Strain cards | `ProductCard.tsx` | Effects promoted above THC/CBD, terpenes shown, "High Potency" badge removed |
| Strains grid | `ProductGrid.tsx` | Effect-based filter pills added as horizontal scroll row |
| Shipping proxy | `drgreen-proxy/index.ts` | `normalizeShippingObject()` utility applied at both normalization points |
| Mobile bar | `MobileBottomActions.tsx` | Gradient softened to pharma-teal palette |

**No new dependencies required.**

