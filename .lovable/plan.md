

## Full Resolution: Dr. Green DApp API Authentication, NFT Admin vs Patient Architecture, and Client Listing Fix

---

### The Core Problem

All 3 API credential sets return **401 Unauthorized** on `/dapp/clients` (list clients), while `/strains` works fine. You can sign into `dapp.drgreennft.com` with your wallet and see clients there. This document resolves the confusion by mapping out the **two completely different authentication systems** at play.

---

### Two Authentication Systems: How They Differ

```text
SYSTEM 1: API Key + HMAC Signing (Server-to-Server)
====================================================
  Used by: Our drgreen-proxy edge function
  Auth method: x-auth-apikey + x-auth-signature (HMAC-SHA256)
  Identity: Tied to a specific NFT via the API key pair
  Scope: Can only see clients/orders created under THAT NFT's scope
  Works for: /strains (global), /dapp/clients (IF the NFT has operator permissions)

SYSTEM 2: Wallet-Based DApp Login (Browser Session)
====================================================
  Used by: dapp.drgreennft.com (the Dr. Green admin portal)
  Auth method: MetaMask wallet signature -> DApp issues a session/JWT
  Identity: Your wallet address (0x0b60d85...) which HOLDS the NFT
  Scope: Full access to all data under NFTs owned by that wallet
  Works for: Everything (clients, orders, carts, dashboard)
```

**Why this matters:** When you log into `dapp.drgreennft.com` with your wallet, the DApp verifies your wallet holds an NFT on-chain, then gives you a session with full permissions. Our proxy uses static API key pairs which are **scoped to a specific NFT instance** -- and those key pairs may not have `/dapp/clients` list permission, even though they can create clients and list strains.

---

### What the User Sees in `dapp.drgreennft.com` (Browser DevTools Capture Needed)

When you sign into the DApp and navigate to the Clients section, the browser makes API calls. We need to capture these headers to understand exactly which auth mechanism the DApp uses for its API calls:

**Option A -- The DApp uses the same `x-auth-apikey` + `x-auth-signature` pattern** but with different credentials (a "master" key pair tied to the wallet owner). If so, we need those credentials stored as secrets.

**Option B -- The DApp uses a Bearer token / JWT** obtained after the wallet signature verification. If so, we need to replicate the DApp's login flow in our proxy: (1) sign a message with our wallet, (2) send it to the DApp's auth endpoint, (3) receive a session token, (4) use that token for subsequent API calls.

**Option C -- The DApp uses a wallet address header** (e.g., `x-wallet-address` or similar) alongside the API key, and the API checks on-chain NFT ownership at request time. If so, we need to add that header to our proxy requests.

---

### Resolution Plan (3 Phases)

#### Phase 1: Capture the DApp's Auth Headers (Manual Step -- You Do This)

1. Open `dapp.drgreennft.com` in Chrome/Firefox
2. Open DevTools (F12) -> Network tab
3. Connect your wallet (`0x0b60d85fefcd9064a29f7df0f8cbc7901b9e6c84`) and sign in
4. Navigate to the Clients list
5. In the Network tab, filter by `api.drgreennft.com`
6. Click on any successful request to `/dapp/clients`
7. Copy/screenshot:
   - Request URL
   - All Request Headers (especially `Authorization`, `x-auth-apikey`, `x-auth-signature`, and any custom headers)
   - Response Status (should be 200)

This tells us definitively which auth pattern the DApp uses.

#### Phase 2: Implement the Correct Auth Flow in the Proxy

Based on what we discover:

**If Option A (different API key pair):**
- Store the DApp's master API key pair as new secrets (`DRGREEN_DAPP_API_KEY` / `DRGREEN_DAPP_PRIVATE_KEY`)
- Add a new environment `dapp-master` to `ENV_CONFIG` in the proxy
- Route `admin-list-all-clients` and other dApp admin actions through this environment

**If Option B (session token from wallet login):**
- Create a new edge function `drgreen-dapp-session` that:
  1. Uses our stored wallet private key to sign a SIWE message
  2. Sends the signature to the DApp's auth endpoint
  3. Receives and caches a session JWT (with TTL)
  4. Returns the JWT for use by other proxy actions
- Modify `drgreen-proxy` to call this function for dApp admin actions and pass the JWT as `Authorization: Bearer <token>` instead of API key + signature headers

**If Option C (wallet address header):**
- Add `x-wallet-address: 0x0b60d85fefcd9064a29f7df0f8cbc7901b9e6c84` (from secrets) to the proxy's request headers for dApp-scoped endpoints

#### Phase 3: Create the Full API Reference Document

Create `docs/DRGREEN-API-FULL-REFERENCE.md` consolidating all findings into a single authoritative document covering:

1. **Architecture overview** -- proxy pattern, two auth systems
2. **NFT Admin vs Patient distinction:**
   - **NFT Admin (Wallet Holder):** Holds Dr. Green Digital Key NFT. Signs in via MetaMask. Gets full dApp access (create/list/manage clients, orders, dashboard). This is you (Ricardo) and any other NFT holders.
   - **Patient (Client):** Created via `POST /dapp/clients`. Does NOT hold an NFT. Does NOT sign in via wallet. Goes through medical questionnaire, KYC, admin approval. Can browse products and place orders once verified (`isKYCVerified === true` AND `adminApproval === "VERIFIED"`).
3. **All endpoints** with request/response schemas
4. **Medical questionnaire** -- all 22 questions with exact option values
5. **curl and fetch examples** for every endpoint
6. **Error handling** and status codes
7. **Proxy action mapping** -- all 45+ frontend actions to API endpoints

---

### NFT Admin vs Patient: Complete Breakdown

| Property | NFT Admin (You) | Patient (Client) |
|----------|----------------|-------------------|
| **Identity** | Wallet address holding Dr. Green NFT | Email + personal details |
| **Auth method** | MetaMask wallet signature (SIWE) | Email/password via Supabase Auth |
| **Access level** | Full dApp: clients, orders, dashboard, analytics | Own profile, shop, cart, orders only |
| **Created via** | Wallet connection + NFT verification | `POST /dapp/clients` with medical record |
| **KYC required** | No (NFT ownership IS the credential) | Yes -- `isKYCVerified` + `adminApproval` |
| **Can list all clients** | Yes (via dApp portal or API with correct auth) | No |
| **Can create orders for others** | Yes (admin action) | No (own orders only) |
| **Our system role** | `admin` role in `user_roles` table | No role (default user) |
| **Where they sign in** | `/auth` page via MetaMask -> `wallet-auth` edge function | `/auth` page via email/password -> Supabase Auth |
| **Session creation** | `wallet-auth` verifies signature + NFT balance -> issues OTP -> Supabase session | Standard Supabase `signInWithPassword` |

---

### Immediate Fix: What We Can Do Right Now (Before Browser Capture)

**Test client creation** via `POST /dapp/clients` using `production-write` credentials. Even if we cannot LIST clients, we may be able to CREATE them. This would confirm the write credentials work and the 401 is specifically a read/list permission issue.

**Verify NFT ownership on-chain** by calling the `balanceOf` function on contract `0x217ddEad61a42369A266F1Fb754EB5d3EBadc88a` for wallet `0x0b60d85fefcd9064a29f7df0f8cbc7901b9e6c84`. This confirms our wallet actually holds the NFT.

---

### Technical Details

**Files to modify (Phase 2, after capture):**
- `supabase/functions/drgreen-proxy/index.ts` -- Add new auth flow based on findings
- Possibly create `supabase/functions/drgreen-dapp-session/index.ts` -- If session-based auth is needed
- `docs/DRGREEN-API-FULL-REFERENCE.md` -- New comprehensive reference document
- `.agent/knowledge/API_INFRASTRUCTURE.md` -- Update with two-auth-system documentation

**No files modified in this plan** -- this is investigation and documentation only until we have the browser capture data.

---

### What I Need From You

Sign into `dapp.drgreennft.com` with your wallet, open DevTools Network tab, navigate to Clients, and share the request headers from any successful API call. This single piece of information will tell us exactly how to fix the 401 and complete the integration.

