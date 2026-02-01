
# Seamless Checkout with Saved Address + Alternative Delivery Option

## Problem Summary

The current checkout flow has two issues:

1. **Cart-based orders ignore shipping** - The `placeOrder({ clientId })` call doesn't pass shipping address
2. **No option to use alternative delivery address** - Users in South Africa often need to ship to work or pickup points

## Solution: Prioritize Direct Order Creation with Shipping

Since the direct `createOrder` method properly includes the shipping address in the API payload, we should:

1. **Make direct order creation the PRIMARY method** (not fallback)
2. **Show saved address with option to change** (use different delivery address)
3. **Always include shipping in the order payload** to Dr. Green API

## Technical Implementation

### Change 1: Update Checkout Flow Priority

**File: `src/pages/Checkout.tsx`**

Currently the flow is:
1. Try cart-based `placeOrder` (no shipping) → 2. Fallback to `createOrder` (has shipping)

**NEW flow:**
1. Use `createOrder` directly with items + shipping (guaranteed to include address)
2. Skip cart-based flow entirely for reliability

```typescript
const handlePlaceOrder = async () => {
  // ... validation ...
  
  setPaymentStatus('Creating order...');
  
  // Use direct order creation (includes shipping in payload)
  const orderResult = await retryOperation(
    () => createOrder({
      clientId: clientId,
      items: cart.map(item => ({
        productId: item.strain_id,
        quantity: item.quantity,
        price: item.unit_price,
      })),
      shippingAddress: {
        street: shippingAddress.address1,
        address2: shippingAddress.address2,
        city: shippingAddress.city,
        state: shippingAddress.state || shippingAddress.city,
        zipCode: shippingAddress.postalCode,
        country: shippingAddress.country,
        countryCode: shippingAddress.countryCode,
      },
    }),
    'Create order'
  );
  
  if (orderResult.error || !orderResult.data?.orderId) {
    throw new Error(orderResult.error || 'Failed to create order');
  }
  
  // Continue to payment...
};
```

### Change 2: Add "Use Saved vs Different Address" Toggle

**File: `src/pages/Checkout.tsx`**

Add state and UI for address selection:

```typescript
// New state
const [addressMode, setAddressMode] = useState<'saved' | 'custom'>('saved');
const [savedAddress, setSavedAddress] = useState<ShippingAddress | null>(null);

// Update useEffect to capture saved address
useEffect(() => {
  const checkShippingAddress = async () => {
    // ... existing fetch logic ...
    
    if (result.data?.shipping && result.data.shipping.address1) {
      setSavedAddress(result.data.shipping);
      setShippingAddress(result.data.shipping); // Use saved by default
      setNeedsShippingAddress(false);
    } else {
      setNeedsShippingAddress(true);
    }
  };
}, [drGreenClient]);

// Update address mode handler
const handleAddressModeChange = (mode: 'saved' | 'custom') => {
  setAddressMode(mode);
  if (mode === 'saved' && savedAddress) {
    setShippingAddress(savedAddress);
  }
};
```

**UI Component:**

```jsx
{savedAddress && !needsShippingAddress && (
  <Card className="bg-card/50 backdrop-blur-sm border-border/50">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <MapPin className="h-5 w-5" />
        Delivery Address
      </CardTitle>
    </CardHeader>
    <CardContent>
      <RadioGroup value={addressMode} onValueChange={handleAddressModeChange}>
        {/* Option 1: Use saved address */}
        <div className="flex items-start gap-3 p-3 rounded-lg border">
          <RadioGroupItem value="saved" id="addr-saved" />
          <Label htmlFor="addr-saved" className="flex-1 cursor-pointer">
            <span className="font-medium">Use saved address</span>
            <div className="text-sm text-muted-foreground mt-1">
              {savedAddress.address1}<br />
              {savedAddress.city}, {savedAddress.postalCode}<br />
              {savedAddress.country}
            </div>
          </Label>
        </div>
        
        {/* Option 2: Different address */}
        <div className="flex items-start gap-3 p-3 rounded-lg border">
          <RadioGroupItem value="custom" id="addr-custom" />
          <Label htmlFor="addr-custom" className="cursor-pointer">
            <span className="font-medium">Ship to a different address</span>
            <span className="text-sm text-muted-foreground ml-2">
              (work, pickup point, etc.)
            </span>
          </Label>
        </div>
      </RadioGroup>
      
      {/* Show form when custom selected */}
      {addressMode === 'custom' && (
        <div className="mt-4 pt-4 border-t">
          <ShippingAddressForm
            clientId={drGreenClient.drgreen_client_id}
            initialAddress={savedAddress} // Pre-fill with saved data
            defaultCountry={savedAddress.countryCode || countryCode}
            onSuccess={handleShippingAddressSaved}
            submitLabel="Confirm Address"
            variant="inline"
          />
        </div>
      )}
    </CardContent>
  </Card>
)}
```

### Change 3: Ensure Shipping is ALWAYS Required Before Order

**File: `src/pages/Checkout.tsx`**

Add validation before order placement:

```typescript
const handlePlaceOrder = async () => {
  // Validate shipping address exists
  if (!shippingAddress || !shippingAddress.address1) {
    toast({
      title: 'Shipping Address Required',
      description: 'Please provide a shipping address before placing your order.',
      variant: 'destructive',
    });
    return;
  }
  
  // ... rest of order logic ...
};
```

### Change 4: Update ShippingAddressForm for Inline Variant

**File: `src/components/shop/ShippingAddressForm.tsx`**

Add `initialAddress` prop to pre-populate form with saved address:

```typescript
interface ShippingAddressFormProps {
  clientId: string;
  defaultCountry?: string;
  initialAddress?: ShippingAddress; // NEW: Pre-fill form
  onSuccess?: (address: ShippingAddress) => void;
  submitLabel?: string;
  variant?: 'default' | 'inline';
}

// In component:
const form = useForm({
  defaultValues: {
    address1: initialAddress?.address1 || '',
    address2: initialAddress?.address2 || '',
    city: initialAddress?.city || '',
    state: initialAddress?.state || '',
    postalCode: initialAddress?.postalCode || '',
    country: initialAddress?.countryCode || defaultCountry || 'ZA',
    landmark: initialAddress?.landmark || '',
  },
});
```

## Why This Approach is Seamless

| Aspect | Before | After |
|--------|--------|-------|
| **Order Creation** | Cart-based (no shipping) → Fallback (with shipping) | Direct order with shipping (always) |
| **Shipping in API** | Sometimes missing | Always included |
| **UX for SA users** | No option to change | Toggle saved vs. custom |
| **Form pre-fill** | Empty form | Pre-filled from saved |
| **API reliability** | Two methods, one may fail | Single robust method |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Checkout.tsx` | Add address mode toggle, use direct order creation, add validation |
| `src/components/shop/ShippingAddressForm.tsx` | Add `initialAddress` prop for pre-population |

## Testing Checklist

After implementation:
1. **Saved address flow**: Log in as verified patient with saved address → See "Use saved address" selected → Click Place Order → Order created with correct address
2. **Custom address flow**: Select "Ship to different address" → Form pre-fills with saved data → Edit address → Confirm → Place Order → Order has custom address
3. **No saved address**: New user without address → Form appears directly → Fill → Place Order works
4. **API verification**: Check edge function logs confirm `shippingAddress` included in order payload
5. **Dr. Green system**: Verify order appears with correct shipping in admin portal

## Summary

This plan ensures:
- Orders are **always** created with shipping address via the Dr. Green API
- The `POST /dapp/orders` endpoint receives the complete payload
- Users can easily choose between saved address and alternative delivery
- South African customers can ship to work/pickup points
- Single, reliable order creation path (no fallback complexity)
