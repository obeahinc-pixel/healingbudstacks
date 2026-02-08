

# Clean Up: Remove Test Data, Harden for Production, Align with Dr. Green as Source of Truth

## Current State

All 13 local database tables are **empty** (0 rows). No auth users exist. The Dr. Green API is online and healthy. This is actually a clean starting point -- there is no test data to purge from the database itself.

However, **test infrastructure exists in the codebase** that must be removed before production use. Additionally, several local tables are redundant given that Dr. Green is the source of truth.

---

## Part 1: Remove Test Infrastructure (Security Critical)

### 1.1 Delete `seed-test-users` Edge Function
- File: `supabase/functions/seed-test-users/index.ts`
- **Problem**: Contains hardcoded credentials for real email addresses (healingbudsglobal@gmail.com, scott.k1@outlook.com, kayleigh.sm@gmail.com) with the password `H34l1ng@buds2025`
- **Action**: Delete the entire function and remove its deployment
- **Risk**: This function can be called by anyone with the function URL, creating accounts with known passwords

### 1.2 Remove `DevQuickLogin` Component
- File: `src/components/DevQuickLogin.tsx`
- **Problem**: Displays the same hardcoded credentials on the login page. Exposes passwords in the browser DOM
- **Action**: Delete the component file and remove its import/usage from `src/pages/Auth.tsx` (lines 19, 502-506)

### 1.3 Remove Mock Mode System
- File: `src/lib/mockMode.ts`
- **Problem**: Allows bypassing the real Dr. Green API entirely via localStorage toggle. In a regulated medical platform, this could allow unauthenticated access to checkout flows
- **Action**: Delete the file and remove all imports in `src/components/shop/ClientOnboarding.tsx`

### 1.4 Clean Debug Actions from Proxy
- File: `supabase/functions/drgreen-proxy/index.ts`
- **Problem**: `PUBLIC_ACTIONS` array (line 108) includes `debug-list-all-clients`, `bootstrap-test-client`, `debug-compare-keys`, `debug-signing-test` -- these allow unauthenticated access to sensitive operations
- **Action**: Remove `debug-list-all-clients` and `bootstrap-test-client` from `PUBLIC_ACTIONS`. Keep `debug-compare-keys` and `debug-signing-test` but move them to `ADMIN_ACTIONS` so they require admin authentication

---

## Part 2: Database Table Audit -- What to Keep vs. Remove

### Tables to KEEP (serve a unique local purpose)

| Table | Purpose | Why Local |
|-------|---------|-----------|
| `profiles` | User display name, avatar, preferences | Auth-linked metadata. Not in Dr. Green |
| `user_roles` | Admin/moderator role assignments | Security RBAC. Must be local for RLS |
| `drgreen_clients` | Maps Supabase user_id to Dr. Green client_id | Bridge table between auth systems. Caches KYC/approval status for fast eligibility checks without API calls |
| `drgreen_cart` | Shopping cart items per user | Session-specific, user-bound. Dr. Green cart API is NFT-scoped and may not match |
| `drgreen_orders` | Order records with sync status | Local-first pattern: orders are created locally, then synced to Dr. Green. Tracks sync_status |
| `prescription_documents` | Uploaded prescription files | File storage metadata. Not in Dr. Green |
| `dosage_logs` | Patient self-tracking | Patient-only feature. Not in Dr. Green |
| `kyc_journey_logs` | Audit trail of KYC steps | Compliance audit trail |
| `launch_interest` | Pre-launch signups | Marketing data, not in Dr. Green |
| `articles` | Blog/news content | CMS content, not in Dr. Green |
| `generated_product_images` | AI-generated jar images | Local asset management |
| `strain_knowledge` | Scraped dispensary data for enrichment | Supplementary data not in Dr. Green |

### Table to RE-EVALUATE: `strains`

| Column | Source | Verdict |
|--------|--------|---------|
| `name`, `description`, `type` | Dr. Green API | Redundant -- fetched live |
| `thc_content`, `cbd_content`, `cbg_content` | Dr. Green API | Redundant -- fetched live |
| `retail_price`, `availability`, `stock` | Dr. Green API | Redundant -- fetched live |
| `image_url`, `client_url` | Dr. Green API | Redundant -- fetched live |
| `feelings`, `flavors`, `helps_with` | Dr. Green API | Redundant -- fetched live |
| `sku`, `brand_name`, `is_archived` | Dr. Green API | Redundant -- fetched live |

**Current behavior**: `useProducts.ts` already fetches strains **directly from the Dr. Green API** via the proxy. It does NOT read from the local `strains` table. The `sync-strains` function exists to populate the local table, but nothing reads from it in the main shop flow.

**Recommendation**: Keep the `strains` table as an **offline cache / admin reference** but do NOT rely on it for the shop. The current live-fetch approach is correct. The `sync-strains` function can be used periodically for admin dashboards or search indexing.

---

## Part 3: User Account Strategy

### Current Approach (Problematic)
The `seed-test-users` function creates accounts with hardcoded passwords. This is inappropriate for a regulated platform.

### Correct Approach
1. **Admin account**: Create manually through the auth system with a strong unique password (not hardcoded in code)
2. **Real users** (Scott K, Kayleigh SM): They should sign up through the normal registration flow. On login, the `ShopContext` auto-discovery (`linkClientFromDrGreenByAuthEmail`) will automatically find and link their existing Dr. Green client records
3. **Auto-sync on login**: The existing `get-client-by-auth-email` proxy action searches Dr. Green by the user's auth email and creates the local `drgreen_clients` mapping. This is already implemented and working

### Post-Cleanup User Flow
```text
1. User signs up at /auth (email + password)
2. Email confirmation sent
3. User logs in
4. ShopContext.fetchClient() runs
5. No local drgreen_clients record found
6. linkClientFromDrGreenByAuthEmail() calls proxy
7. Proxy searches Dr. Green API by email
8. If found: creates local mapping with KYC status
9. If not found: user is directed to /shop/register for onboarding
```

---

## Part 4: Implementation Steps

### Step 1: Delete test infrastructure files
- Delete `supabase/functions/seed-test-users/index.ts`
- Delete `src/components/DevQuickLogin.tsx`
- Delete `src/lib/mockMode.ts`

### Step 2: Clean Auth.tsx
- Remove `DevQuickLogin` import and usage from `src/pages/Auth.tsx`

### Step 3: Clean ClientOnboarding.tsx
- Remove all `mockMode` imports and conditional logic from `src/components/shop/ClientOnboarding.tsx`

### Step 4: Harden proxy public actions
- Update `PUBLIC_ACTIONS` in `supabase/functions/drgreen-proxy/index.ts` to remove debug endpoints that expose client data without authentication

### Step 5: Deploy and verify
- Deploy updated edge functions
- Verify the auth page works without DevQuickLogin
- Verify the shop loads strains from the live API
- Verify the registration flow works without mock mode

---

## Summary

| Action | Type | Risk |
|--------|------|------|
| Delete seed-test-users | Security fix | Low -- database is already empty |
| Delete DevQuickLogin | Security fix | Low -- only removes a dev shortcut |
| Delete mockMode | Compliance fix | Medium -- must verify ClientOnboarding works without it |
| Harden PUBLIC_ACTIONS | Security fix | Low -- moves debug tools behind auth |
| Keep all 13 tables | Architecture | None -- all serve distinct purposes |
| strains table as cache only | Architecture | None -- shop already uses live API |

No database schema changes are required. No data migration is needed (all tables are empty). The Dr. Green API is the authoritative source for clients, strains, orders, and payments. Local tables serve as auth bridges, caches, audit logs, and user-specific features.

