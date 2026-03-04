

# Plan: Remove Dead Location Price Fallbacks + Test Shop

## Problem
Per the Postman API docs, `strainLocations` only contains `isActive`, `isAvailable`, and `stockQuantity` — no price fields. The `location?.retailPrice`, `location?.pricePerGram`, `location?.pricePerUnit` fallbacks will always be `undefined`, making them dead code.

## Changes

### 1. `src/hooks/useProducts.ts` (lines 182-191)
Replace the price extraction block with:
```ts
// strainLocations contains availability/stock only — prices are top-level
const retailPrice = 
  parseFloat(strain.retailPrice) || 
  parseFloat(strain.pricePerGram) || 
  parseFloat(strain.pricePerUnit) || 
  parseFloat(strain.price) || 
  0;
```
Update the comment on line 182 accordingly.

### 2. `supabase/functions/sync-strains/index.ts` (lines 229-238)
Same change — remove the three `location?.` price lines:
```ts
// strainLocations contains availability/stock only — prices are top-level
const retailPrice = 
  parseFloat(strain.retailPrice) || 
  parseFloat(strain.pricePerGram) || 
  parseFloat(strain.pricePerUnit) || 
  parseFloat(strain.price) || 
  0;
```

### 3. Test shop page
After the edits, use the browser to verify the shop page loads with correct ZAR prices and no errors.

