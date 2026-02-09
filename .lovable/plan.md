
# Fix: Address Not Displaying in Admin Client Manager

## Problem
The `dapp-client-details` API returns shipping data under `shippings` (an array), but the component looks for `shipping` (singular object). This means the address is always `null`, showing "No address on file".

## API Response (actual)
```json
{
  "data": {
    "shippings": [
      {
        "address1": "123 Sandton Drive",
        "city": "Sandton",
        "country": "ZA",
        "countryCode": "ZAF",
        "postalCode": "2196",
        "state": "Sandton"
      }
    ]
  }
}
```

## Fix

**File**: `src/components/admin/AdminClientManager.tsx`, lines 303-305

Change the extraction logic from:
```typescript
const responseData = result.data as unknown as { data?: { shipping?: ShippingAddress } };
const shipping = responseData?.data?.shipping || (result.data as { shipping?: ShippingAddress })?.shipping || null;
```

To:
```typescript
const responseData = result.data as unknown as { data?: { shippings?: ShippingAddress[] } };
const shipping = responseData?.data?.shippings?.[0] || (result.data as { shippings?: ShippingAddress[] })?.shippings?.[0] || null;
```

This takes the first element of the `shippings` array, matching the actual API response structure.

No other files need changes. The rest of the address display and sync logic already works correctly once `shipping` is populated.
