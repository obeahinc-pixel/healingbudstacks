

# Fix: Login Blocking and Client Sync Issues

## Problem Analysis

Two intertwined issues:

1. **Login gets stuck on "Preparing your portal..." spinner** — After login, `Auth.tsx` waits for `isLoading` (from `ShopContext`) to become `false`. But `fetchClient()` calls `drgreen-proxy` edge functions (auto-discovery + live status check) which can hang or timeout. Until those complete, `isLoading` stays `true` and the user is trapped on the spinner.

2. **Auth logs show `refresh_token_not_found`** — After password resets, old browser sessions have invalid refresh tokens. The app may not cleanly recover from this, compounding the stuck-loading issue.

3. **`onAuthStateChange` calls async functions that internally call `supabase.auth.getSession()`** — This can cause auth lock contention per Supabase's known deadlock pattern.

## Fix Plan

### 1. Make `fetchClient` non-blocking for login

Currently `isLoading` stays `true` until the Dr. Green API responds. Change the flow to:

- Set `isLoading = false` as soon as the **local DB query** completes (fast)
- Run the Dr. Green API live-status check as a background update (fire-and-forget)
- This way login redirect happens immediately based on cached local data

In `src/context/ShopContext.tsx`:
- After the local `drgreen_clients` query returns, immediately call `setDrGreenClient(localRecord)` and `setIsLoading(false)`
- Then kick off the API status check as a non-blocking background call that updates state when it resolves
- For auto-discovery (no local record), also set `isLoading = false` quickly and run discovery in background

### 2. Fix `onAuthStateChange` to avoid lock contention

In `ShopContext.tsx` line 348, the callback calls `fetchClient()` which internally calls `supabase.auth.getSession()`. This can deadlock.

Fix: use `setTimeout(() => { fetchCart(); fetchClient(); }, 0)` to defer execution outside the auth lock.

### 3. Handle stale refresh tokens gracefully

In `ShopContext.tsx`, if `getSession()` returns a session but subsequent calls fail with auth errors, catch and clear state cleanly rather than hanging.

## Files Changed

- `src/context/ShopContext.tsx` — Restructure `fetchClient` to be non-blocking; fix `onAuthStateChange` defer pattern; add timeout safety

## No Database Changes Required

