

## Fix: Client Auto-Sync and Missing Profile Records

### Root Cause Analysis

**1. Profiles table is empty** -- The `handle_new_user()` function exists in the database but has **no trigger attached to `auth.users`**. The trigger `on_auth_user_created` was never created (or was dropped). Only the admin-role trigger (`on_auth_user_created_admin`) exists. This means when users sign up, no profile row is created.

**2. `drgreen_clients` table is empty** -- Because there are no profiles AND no users have completed the onboarding flow yet, no client records exist locally. The auto-discovery in `ShopContext` runs on login but it requires the user's email to match an existing Dr. Green API client. If no client was ever registered on Dr. Green under these emails, auto-discovery returns nothing.

**3. API health is GOOD** -- The health check confirms:
- Credentials: configured and valid
- API connectivity: reachable (493ms response)
- Status: healthy

**4. The 3 accounts exist in auth.users** but have zero associated data:
- `scott.k1@outlook.com` (d6f38c88)
- `kayliegh.sm@gmail.com` (713e6603)
- `scott@healingbuds.global` (b8fbc92e)

### Fix Plan

#### Step 1: Create the missing `on_auth_user_created` trigger

A database migration to attach `handle_new_user()` to `auth.users` so profile rows are auto-created on signup:

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

#### Step 2: Backfill profiles for the 3 existing accounts

Since the trigger wasn't there when these accounts were created, manually insert profile rows:

```sql
INSERT INTO public.profiles (id, full_name)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1))
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;
```

#### Step 3: Assign admin role to scott@healingbuds.global

The `auto_assign_admin_role` trigger checks for this email, but since it fires on INSERT and the account was created via the edge function (which may bypass the trigger), verify and fix:

```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users
WHERE email = 'scott@healingbuds.global'
ON CONFLICT (user_id, role) DO NOTHING;
```

#### Step 4: Test Dr. Green API client lookup for each email

After profiles exist and users can log in, the `ShopContext.fetchClient()` flow will:
1. Check `drgreen_clients` table (empty -- no match)
2. Call `get-client-by-auth-email` on the Dr. Green API
3. If found, auto-link the client record locally

If the emails don't exist as Dr. Green DApp clients yet, users will need to complete the onboarding/registration flow to create their Dr. Green client record.

### Files to Modify

| File | Change |
|------|--------|
| Database migration | Create `on_auth_user_created` trigger, backfill profiles, ensure admin role |

### What This Fixes

- New signups will auto-create profile rows (was broken)
- Existing 3 accounts get profile records immediately
- scott@healingbuds.global gets admin access
- Auto-sync on login will work once Dr. Green client records exist for these emails
- No code changes needed -- the `ShopContext` auto-discovery logic is already correct

