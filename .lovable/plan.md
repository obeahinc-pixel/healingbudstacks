

# Plan: Webhook Test Mode Bypass + Browser Verification

## Status of Previous Tasks

The **Sync Now button** and **Realtime Live indicator** are already implemented in `AdminDashboard.tsx`:
- `syncing` state with `supabase.functions.invoke('sync-drgreen-data')` 
- Realtime channel `admin-dashboard-live` subscribing to `drgreen_clients` and `drgreen_orders`
- Pulsing green dot "Live" indicator when connected

The **admin/clients page** already shows all clients via `AdminClientManager`.

**Browser verification is blocked** — the preview shows a login screen. You'll need to log in in the preview first, then I can navigate and verify visually.

## What Needs to Be Done: Webhook Test Mode Bypass

**File: `supabase/functions/drgreen-webhook/index.ts`** (lines 375-397)

Add a test mode that bypasses signature verification when:
1. A special header `x-test-mode: true` is sent, AND
2. The `WEBHOOK_TEST_SECRET` environment secret matches a provided `x-test-secret` header

This keeps production security intact while allowing controlled testing.

### Changes (lines 380-397)

Replace the signature validation block with:

```typescript
// Test mode bypass — allows testing without Dr Green API signature
const isTestMode = req.headers.get('x-test-mode') === 'true';
const testSecret = Deno.env.get('WEBHOOK_TEST_SECRET');
const providedTestSecret = req.headers.get('x-test-secret') || '';

if (isTestMode && testSecret && providedTestSecret === testSecret) {
  logInfo('Test mode: signature bypass activated');
} else if (privateKey && signature) {
  const isValid = await verifyWebhookSignature(rawPayload, signature, privateKey);
  if (!isValid) {
    logError('Invalid webhook signature');
    return new Response(
      JSON.stringify({ error: "Invalid signature" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
} else if (privateKey) {
  logError('Missing webhook signature');
  return new Response(
    JSON.stringify({ error: "Missing signature" }),
    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

Also relax the timestamp check for test mode — pass `isTestMode` through to skip `validateWebhookTimestamp` when testing.

### Secret Setup

Use `add_secret` to set `WEBHOOK_TEST_SECRET` — a random string you choose. Then test with:

```
curl -X POST {supabase_url}/functions/v1/drgreen-webhook \
  -H "Content-Type: application/json" \
  -H "x-test-mode: true" \
  -H "x-test-secret: YOUR_SECRET" \
  -d '{"event":"order.confirmed","orderId":"test-123","timestamp":"2026-03-04T22:00:00Z","data":{"totalAmount":100,"currency":"EUR","client":{"email":"test@example.com","firstName":"Test","lastName":"User"}}}'
```

### CORS Update

Add `x-test-mode, x-test-secret` to the allowed headers in `corsHeaders`.

## Summary

1. Add test mode bypass to `drgreen-webhook/index.ts` (single file edit)
2. Add `WEBHOOK_TEST_SECRET` secret
3. After you log in to the preview, I can verify the admin dashboard and clients page visually

