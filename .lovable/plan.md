

# Plan: Handle External Dr. Green Clients Without Creating Fake Auth Accounts

## Why NOT Create Local Auth Accounts

Creating auth accounts for `varseainc@gmail.com`, `maykendaal23@gmail.com`, `gerard161+budstacks@gmail.com` is **wrong** because:
- These users never consented to account creation on your platform
- They'd have passwords they don't know (security risk)
- It violates the principle that auth accounts represent real user registrations
- If they later sign up organically, there would be conflicts

## The Correct Approach: Make `user_id` Nullable

The local `drgreen_clients` and `drgreen_orders` tables are a **cache** of the Dr. Green API (source of truth). External clients exist in the API regardless of whether they have a local auth account. The fix is simple:

1. **Make `user_id` nullable** on both `drgreen_clients` and `drgreen_orders` — this allows the sync function to store ALL data from the API without needing a local auth user
2. **Auto-link on signup** — when someone signs up with a matching email, automatically link existing `drgreen_clients` / `drgreen_orders` rows to their new `user_id`
3. **Update sync function** — remove the "skip if no user_id" guard so all 11 clients and all 4 orders get upserted
4. **Update RLS policies** — adjust policies so admins see all rows (including `user_id IS NULL`), and patients only see their own linked rows (existing behavior, unaffected)

## Steps

### 1. Database migration
- `ALTER TABLE drgreen_clients ALTER COLUMN user_id DROP NOT NULL`
- `ALTER TABLE drgreen_orders ALTER COLUMN user_id DROP NOT NULL`

### 2. Update `sync-drgreen-data` Edge Function
- Remove the `if (!userId) continue` skip for orders
- Insert all clients regardless of email match (set `user_id` to matched user or `NULL`)
- Insert all orders with `user_id` from linked client or `NULL`

### 3. Add auto-link trigger
- Create a database function + trigger on `auth.users` insert (via `profiles` trigger pattern) that updates `drgreen_clients SET user_id = NEW.id WHERE email = NEW.email AND user_id IS NULL`, and similarly for orders

### 4. Re-run sync
- Trigger `sync-drgreen-data` to pull all 11 clients and 4 orders into local cache

## Why Not "Always Call API Directly"

Calling the Dr. Green API on every page load is:
- Slow (external API, signing overhead)
- Rate-limited (external service)
- Not compatible with RLS (patients querying their own data)
- The local cache pattern is the correct architecture — fast reads from local DB, periodic sync from API source of truth

The hybrid approach (local cache + periodic sync + auto-link on signup) is the industry standard for this pattern.

## Files Changed

- Database migration: make `user_id` nullable, add auto-link trigger
- `supabase/functions/sync-drgreen-data/index.ts` — remove skip logic, insert all clients/orders
- No frontend changes needed — admin queries already work, patient queries use `auth.uid() = user_id` which naturally excludes unlinked rows

