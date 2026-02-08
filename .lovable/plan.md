

## Re-Register Scott and Kayliegh with Current Dr. Green API Key

### Problem

Scott (`scott.k1@outlook.com`) and Kayliegh (`kayliegh.sm@gmail.com`) are genuine clients whose Dr. Green records were created under a **different API key pair**. The current API key pair cannot access their records (causing 401 errors). They need to be re-registered against the **current** API key by sending the full client creation payload to `POST /dapp/clients` again.

### Current State

| User | Email | Old Dr. Green ID | Country | Shipping Data |
|------|-------|-------------------|---------|---------------|
| Kayliegh | kayliegh.sm@gmail.com | 47542db8-... | ZA | 1937 Prospect Street, Pretoria, 0036 |
| Scott | scott.k1@outlook.com | dfd81e64-... | ZA | 123 Sandton Drive, Sandton, 2196 |

Both have `is_kyc_verified: true` and `admin_approval: VERIFIED` locally, but these records are stale/orphaned under the old key pair.

### Solution: Two-Phase Re-Registration

---

#### Phase 1: Delete old local records (database)

Run a SQL migration to delete the stale `drgreen_clients` records for both users. This clears the local mapping so the system knows they need to re-register.

```sql
DELETE FROM drgreen_clients 
WHERE email IN ('scott.k1@outlook.com', 'kayliegh.sm@gmail.com');
```

Their `auth.users` and `profiles` records remain untouched -- they can still log in.

---

#### Phase 2: Admin-Triggered Re-Registration (New Edge Function Feature)

Instead of making Scott and Kayliegh fill out the entire onboarding form again, create an admin action that re-sends their existing data as a client creation payload to the Dr. Green API under the current key pair.

**New action: `admin-reregister-client`** in `supabase/functions/drgreen-proxy/index.ts`

This action will:
1. Accept an email address from the admin
2. Look up the user's stored profile data (name, shipping address from the JSONB column backup)
3. Build a minimal but valid client creation payload using existing data
4. Call `POST /dapp/clients` with the current API credentials
5. Store the **new** `drgreen_client_id` and `kyc_link` in `drgreen_clients`
6. Return the result to the admin

**Why this approach?**
- Scott and Kayliegh are real clients -- their personal details are already known
- Re-filling a 5-step medical questionnaire is unnecessary friction
- The admin can trigger this server-side with minimal medical defaults
- KYC will need to be completed again via the new KYC link

---

#### Phase 3: Admin UI Button

Add a "Re-Register with Current API Key" button to the Admin Dashboard that:
1. Shows a confirmation dialog with the client's email
2. Calls the `admin-reregister-client` action
3. Displays the new client ID and KYC link on success
4. Updates the local UI state

---

### Technical Details

**Files to modify:**

| File | Change |
|------|--------|
| Database migration | DELETE stale records for both users |
| `supabase/functions/drgreen-proxy/index.ts` | Add `admin-reregister-client` to ADMIN_ACTIONS and implement handler |
| `src/components/admin/AdminClientManager.tsx` | Add "Re-Register" button with confirmation dialog |
| `src/hooks/useDrGreenApi.ts` | Add `reregisterClient(email)` method |

**Edge function handler logic:**

```
case "admin-reregister-client":
  1. Require admin auth
  2. Accept { email, firstName, lastName, countryCode, shippingAddress }
  3. Build payload with:
     - Personal details from input
     - Shipping address from input (or defaults)
     - Minimal medical record defaults (all false/none)
  4. Call POST /dapp/clients with current API credentials
  5. Parse response for clientId and kycLink
  6. Upsert into drgreen_clients with new IDs
  7. Return { success, clientId, kycLink }
```

**Payload structure** (matching Dr. Green API spec):

The payload will use the existing data we have (name, email, shipping address) and set medical history fields to safe defaults. This creates a valid client record under the current API key. The actual medical data was already submitted to Dr. Green previously -- this is just re-establishing the API-key binding.

---

### Post-Implementation Flow

1. Admin logs in and navigates to Client Management
2. Admin clicks "Re-Register" for Scott or Kayliegh
3. System sends client creation payload to Dr. Green API
4. New `drgreen_client_id` is stored locally
5. Scott/Kayliegh receive new KYC link
6. They complete KYC verification
7. Once verified, they can shop and place orders under the current API key

### Risk Assessment

- **Low risk**: Only affects two specific users
- **No data loss**: Auth and profile records preserved
- **Reversible**: If API call fails, no records are changed
- **KYC required**: Users must re-verify identity (compliance maintained)

