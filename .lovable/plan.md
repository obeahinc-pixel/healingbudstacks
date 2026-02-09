

## Proxy Cleanup and Client Verification Fix

This plan addresses three interconnected issues:

1. **Duplicate switch cases** causing dead code (`empty-cart`, `place-order`)
2. **Dead `extractPemBody` function** still referenced only in a debug diagnostic
3. **Clients appearing unverified** due to a response parsing bug in the live data sync flow

---

### Root Cause: Why Clients Appear Unverified

The `ShopContext.fetchClient()` calls `get-client` to fetch live verification status. However, the `get-client` handler returns the raw Dr. Green API response (e.g., `{ data: { isKYCVerified: true, adminApproval: "VERIFIED", ... } }`) — it does NOT include a `success` field.

The ShopContext then checks:
```
if (!apiError && apiResponse?.success && apiResponse?.data)
```

Since `success` is undefined in the raw Dr. Green response, this condition is **always false**, and the code falls back to cached local data. If the local cache is stale (e.g., was saved before verification), the client appears unverified even though the API confirms they are verified.

**This is the critical bug.** Scott and Kayleigh's live Dr. Green records may show `VERIFIED`, but the frontend never processes the live response.

---

### Changes

#### 1. Fix `get-client` response normalization (drgreen-proxy)

Wrap the `get-client` response in a consistent `{ success: true, data: ... }` envelope so the ShopContext condition works:

```typescript
case "get-client": {
  // ... existing validation and fetch ...
  if (clientResponse && clientResponse.ok) {
    const clientData = await clientResponse.json();
    // Normalize shippings
    const innerData = clientData?.data || clientData;
    if (Array.isArray(innerData.shippings) && innerData.shippings.length > 0) {
      innerData.shipping = normalizeShippingObject(innerData.shippings[0]);
    }
    // Return wrapped response with success flag
    return new Response(JSON.stringify({
      success: true,
      data: innerData,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  response = clientResponse;
  break;
}
```

#### 2. Make ShopContext more resilient to response format

Update the live status check to handle both wrapped and raw responses:

```typescript
// Accept response with or without "success" wrapper
if (!apiError && apiResponse) {
  const liveData = apiResponse.data || apiResponse;
  if (liveData && (liveData.isKYCVerified !== undefined || liveData.adminApproval !== undefined)) {
    // ... process live status ...
  }
}
```

#### 3. Remove duplicate switch cases

Remove the **first** `empty-cart` (lines 2156-2163) and `place-order` (lines 2166-2173) blocks. The second definitions (lines 2707-2733) are more complete and correct, but due to JavaScript switch semantics, the first definition wins. We will keep the second (better) implementations and remove the first (simpler) ones.

#### 4. Remove dead `extractPemBody` function

Delete the `extractPemBody` function (lines 206-243). It is:
- No longer used by any production signing flow (API key is sent as-is)
- Only referenced in the `debug-signing-test` diagnostic case
- A known historical source of key corruption bugs

Update the `debug-signing-test` case to send the API key raw instead of through `extractPemBody`.

#### 5. Remove deprecated `drGreenRequestQuery` wrapper

Replace all remaining calls to `drGreenRequestQuery` with `drGreenRequestGet` (they are functionally identical — `drGreenRequestQuery` just redirects to `drGreenRequestGet`). Then delete the wrapper function.

#### 6. Remove other dead code

- Delete `generateHmacSignatureFallback` (line 907-912) — just wraps `signWithHmac`
- Delete `signPayloadWithMode` (line 940-942) — unused wrapper
- Delete `debug-list-all-clients` case (lines 3403-3474) — unauthenticated debug endpoint, security risk

---

### Technical Details

**Files modified:**
- `supabase/functions/drgreen-proxy/index.ts` — Remove duplicates, dead functions, fix `get-client` response
- `src/context/ShopContext.tsx` — Fix response parsing for live verification sync

**Security note:** The `debug-list-all-clients` action is not in `ADMIN_ACTIONS` or any auth list, meaning it falls into the authenticated-but-no-ownership-check path. However, it lists all client PII. It should be removed.

**Testing:** After deployment, the live status sync will be testable by navigating to `/shop` as a logged-in user whose Dr. Green record shows `VERIFIED`. The ShopContext should now correctly parse the API response and grant eligibility.

