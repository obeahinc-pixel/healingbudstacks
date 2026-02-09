
# Fix: Normalize `shippings` Array in drgreen-proxy

## Problem
The Dr. Green API returns shipping addresses as a `shippings` array (e.g., `"shippings": [{"address1": "123 Main St", ...}]`), but the frontend expects a singular `shipping` object (e.g., `result.data?.shipping?.address1`). This causes shipping addresses to silently fail to load on the Checkout and Patient Dashboard pages.

The local fallback path already returns `shipping` (singular) correctly — the bug only occurs when the live API response is used.

## Fix

**File**: `supabase/functions/drgreen-proxy/index.ts`

### Change 1: Normalize in `get-my-details` (line ~2376)
Before returning API data, add normalization:
```typescript
if (apiData) {
  // Normalize shippings array to shipping object
  if (Array.isArray(apiData.shippings) && apiData.shippings.length > 0) {
    apiData.shipping = apiData.shippings[0];
  }
  return new Response(JSON.stringify(apiData), { ... });
}
```

### Change 2: Normalize in `get-client` (line ~2654)
After the API response is received, parse and normalize before returning:
```typescript
case "get-client": {
  // ... existing validation and fetch ...
  // After getting response, normalize shippings array
  if (response && response.ok) {
    const clientData = await response.json();
    if (Array.isArray(clientData.shippings) && clientData.shippings.length > 0) {
      clientData.shipping = clientData.shippings[0];
    }
    return new Response(JSON.stringify(clientData), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  break;
}
```

## Scope
- One file modified: `supabase/functions/drgreen-proxy/index.ts`
- Two cases updated: `get-my-details` and `get-client`
- No frontend changes needed — the frontend already expects `shipping` (singular)
