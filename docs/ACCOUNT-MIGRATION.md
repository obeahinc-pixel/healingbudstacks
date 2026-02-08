# Healing Buds — Account Migration Document

> **Generated:** 2026-02-08  
> **Project:** Healing Buds Medical Cannabis Platform  
> **Platform:** Lovable Cloud (Supabase-backed)  
> **Classification:** CONFIDENTIAL — Contains infrastructure references

---

## 1. Project Identity

| Key | Value |
|-----|-------|
| Lovable Project ID | `3b660d14-e53f-461d-b1bc-ac132b819f15` |
| Supabase Project Ref | `hfpflcognzrpbsmhbmjx` |
| Supabase Region | EU Central (Frankfurt) |
| Preview URL | `https://id-preview--3b660d14-e53f-461d-b1bc-ac132b819f15.lovable.app` |
| Supabase API URL | `https://hfpflcognzrpbsmhbmjx.supabase.co` |
| Anon Key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmcGZsY29nbnpycGJzbWhibWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NzgzNzUsImV4cCI6MjA4NjE1NDM3NX0.tk1PVHGad3pL2dgC5Cw3Yu5yFCZWP5EBzbcr1AsXfbQ` |

---

## 2. Secrets & API Keys Inventory

> ⚠️ **Secret values are encrypted and NOT included.** You must export/re-enter them manually during migration.

### 2.1 Dr. Green DApp API Credentials

| Secret Name | Purpose | Environment |
|-------------|---------|-------------|
| `DRGREEN_API_KEY` | Primary production API key (read-scoped) | Production |
| `DRGREEN_PRIVATE_KEY` | Primary production signing key (HMAC-SHA256) | Production |
| `DRGREEN_ALT_API_KEY` | Alternate production API key | Alt-Production |
| `DRGREEN_ALT_PRIVATE_KEY` | Alternate production signing key | Alt-Production |
| `DRGREEN_WRITE_API_KEY` | Write-enabled production API key (client creation, orders) | Production-Write |
| `DRGREEN_WRITE_PRIVATE_KEY` | Write-enabled production signing key | Production-Write |
| `DRGREEN_STAGING_API_KEY` | Staging/test environment API key | Staging |
| `DRGREEN_STAGING_PRIVATE_KEY` | Staging/test signing key | Staging |
| `DRGREEN_STAGING_API_URL` | Staging API base URL override | Staging |

**Signing Method:** HMAC-SHA256 symmetric signing (`DRGREEN_USE_HMAC` toggle available).  
**Header Format:**  
- `x-auth-apikey`: Raw API key (NOT Base64 encoded, no PEM header stripping)  
- `x-auth-signature`: Base64-encoded HMAC-SHA256 of request payload  
- GET requests: sign the query string  
- POST/PATCH/DELETE: sign the stringified JSON body  

### 2.2 Platform & Infrastructure Secrets

| Secret Name | Purpose |
|-------------|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin-level access (server-side only) |
| `SUPABASE_ANON_KEY` | Supabase public/anon key |
| `SUPABASE_PUBLISHABLE_KEY` | Alias for anon key (used in client) |
| `SUPABASE_DB_URL` | Direct PostgreSQL connection string |
| `SUPABASE_URL` | Supabase API endpoint URL |
| `EXTERNAL_SUPABASE_SERVICE_KEY` | Service key for external Supabase project (if applicable) |
| `LOVABLE_API_KEY` | Lovable platform connector key (cannot be deleted) |

### 2.3 Third-Party Service Secrets

| Secret Name | Purpose |
|-------------|---------|
| `RESEND_API_KEY` | Email delivery via Resend (transactional emails) |
| `ADMIN_WALLET_ADDRESSES` | Comma-separated list of admin-authorized Ethereum wallet addresses |

### 2.4 Frontend Environment Variables (.env — auto-managed)

| Variable | Source |
|----------|--------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project reference |

---

## 3. WalletConnect & Web3 Configuration

| Key | Value |
|-----|-------|
| WalletConnect Project ID | `0ed43641317392e224a038f3edc04ae7` |
| WalletConnect Relay | `wss://relay.walletconnect.org` |
| Dr. Green NFT Contract | `0x217ddEad61a42369A266F1Fb754EB5d3EBadc88a` |
| Chain | Ethereum Mainnet (chainId: 1) |
| NFT Standard | ERC-721 |
| RPC Fallback | `https://eth.llamarpc.com` |
| RainbowKit Version | `^2.2.10` |
| wagmi Version | `^3.1.3` |
| viem Version | `^2.43.4` |

**Admin Auth Flow (SIWE):**
1. User connects MetaMask via RainbowKit
2. Signs timestamped auth message
3. `wallet-auth` edge function verifies signature + checks NFT `balanceOf > 0`
4. Resolves wallet → email via `wallet_email_mappings` table
5. Issues OTP → establishes Supabase session

---

## 4. Database Schema

### 4.1 Tables

| Table | Purpose | RLS |
|-------|---------|-----|
| `articles` | Blog/news content (The Wire) | ✅ Public read, admin write |
| `dosage_logs` | Patient dosage tracking | ✅ User-scoped CRUD |
| `drgreen_cart` | Shopping cart items | ✅ User-scoped CRUD |
| `drgreen_clients` | Patient/client records linked to Dr. Green API | ✅ User-scoped + admin read/update |
| `drgreen_orders` | Order records synced with Dr. Green API | ✅ User-scoped + admin read/update |
| `generated_product_images` | AI-generated product jar images | ✅ Public read, admin write |
| `kyc_journey_logs` | KYC verification event audit trail | ✅ User insert/read + admin read |
| `launch_interest` | Pre-launch interest signups | ✅ Anon insert, admin manage |
| `prescription_documents` | Uploaded prescription files metadata | ✅ User-scoped + admin read/update |
| `profiles` | User profile data (auto-created on signup) | ✅ User-scoped CRUD |
| `strain_knowledge` | Scraped strain medical info | ✅ Public read, admin write |
| `strains` | Product catalog (medical cannabis strains) | ✅ Public read (non-archived), admin manage |
| `user_roles` | RBAC role assignments | ✅ User read own, admin manage |
| `wallet_email_mappings` | Wallet address ↔ email account links | ✅ Admin-only manage/read |

### 4.2 Custom Enum

```sql
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
```

### 4.3 Database Functions

| Function | Purpose |
|----------|---------|
| `handle_new_user()` | Trigger: auto-creates profile row on auth.users insert |
| `has_role(_user_id, _role)` | Checks if user has a specific role (used in RLS policies) |
| `update_updated_at_column()` | Trigger: auto-updates `updated_at` timestamp |
| `normalize_wallet_address()` | Trigger: lowercases wallet addresses on insert/update |

### 4.4 Storage Buckets

| Bucket | Public | Purpose |
|--------|--------|---------|
| `email-assets` | ✅ Yes | Logo images for transactional emails |
| `product-images` | ✅ Yes | Generated product/jar images |
| `prescriptions` | ❌ No | Patient prescription uploads (legacy) |
| `prescription-documents` | ❌ No | Patient prescription uploads (current) |

---

## 5. Edge Functions

| Function | JWT Verify | Purpose |
|----------|-----------|---------|
| `wallet-auth` | ❌ `false` | SIWE wallet authentication + NFT check |
| `drgreen-proxy` | ✅ default | Proxy to Dr. Green DApp API (HMAC signing) |
| `drgreen-health` | ✅ default | Dr. Green API health check |
| `drgreen-api-tests` | ✅ default | API integration test runner |
| `drgreen-comparison` | ✅ default | Cross-environment API comparison |
| `drgreen-webhook` | ❌ likely | Inbound webhooks from Dr. Green |
| `exchange-rates` | ✅ default | Currency exchange rate fetcher |
| `generate-product-image` | ✅ default | AI product image generation |
| `batch-generate-images` | ✅ default | Bulk product image generation |
| `sync-strains` | ✅ default | Sync strains from Dr. Green API |
| `strain-knowledge` | ✅ default | Strain knowledge scraping/storage |
| `strain-medical-info` | ✅ default | Strain medical information lookup |
| `send-client-email` | ✅ default | Transactional email to clients |
| `send-contact-email` | ✅ default | Contact form email handler |
| `send-onboarding-email` | ✅ default | New client onboarding email |
| `prescription-expiry-check` | ✅ default | Check for expiring prescriptions |
| `admin-update-user` | ✅ default | Admin user management |
| `upload-email-logo` | ✅ default | Upload logo to email-assets bucket |
| `upload-jar-template` | ✅ default | Upload jar template for image gen |

---

## 6. RLS Policy Summary

### Public Tables (user-scoped)

All user-facing tables (`dosage_logs`, `drgreen_cart`, `drgreen_clients`, `drgreen_orders`, `prescription_documents`, `profiles`) follow this pattern:
- **SELECT/UPDATE/DELETE**: `auth.uid() = user_id`
- **INSERT**: `WITH CHECK (auth.uid() = user_id)`

### Admin-escalated tables
- `drgreen_clients`: Admin can also SELECT + UPDATE all records
- `drgreen_orders`: Admin can also SELECT + UPDATE all records
- `prescription_documents`: Admin can also SELECT + UPDATE all records

### Public-read tables
- `articles`: Public SELECT, admin ALL
- `strains`: Public SELECT (where `is_archived = false`), admin ALL
- `strain_knowledge`: Public SELECT, admin ALL
- `generated_product_images`: Public SELECT, admin CRUD

### Special tables
- `launch_interest`: Anon + authenticated INSERT, admin manage
- `user_roles`: User reads own, admin manages ALL
- `wallet_email_mappings`: Admin-only (authenticated role required)

---

## 7. Third-Party Integrations

| Service | Purpose | Credential Location |
|---------|---------|-------------------|
| **Dr. Green DApp API** | Medical cannabis commerce/fulfilment | Edge function secrets (5 environments) |
| **Resend** | Transactional email delivery | `RESEND_API_KEY` secret |
| **WalletConnect Cloud** | Wallet connection relay | Hardcoded project ID in WalletProvider |
| **Ethereum Mainnet RPC** | NFT ownership verification | Public RPC (`eth.llamarpc.com`) |
| **Lovable AI** | Product image generation, strain knowledge | `LOVABLE_API_KEY` (auto-managed) |

---

## 8. Auth Configuration

| Setting | Value |
|---------|-------|
| Auth method | Email/password + Wallet (SIWE) |
| Auto-confirm email | Default (not enabled) |
| Anonymous users | Disabled |
| Profile auto-creation | Trigger on `auth.users` insert |
| Admin access | Wallet-based (NFT-gated) + `user_roles` table |
| Session persistence | localStorage, auto-refresh enabled |

---

## 9. Migration Checklist

### Pre-Migration
- [ ] Export all secret values from Lovable Cloud settings
- [ ] Export database data (pg_dump or Supabase dashboard export)
- [ ] Download all storage bucket contents (email-assets, product-images, prescription-documents, prescriptions)
- [ ] Note any active user sessions or pending orders

### Target Environment Setup
- [ ] Create new Supabase project (or equivalent)
- [ ] Run all migration SQL files from `supabase/migrations/`
- [ ] Create storage buckets with matching names and public/private settings
- [ ] Set all storage RLS policies
- [ ] Deploy all 19 edge functions
- [ ] Configure all 15+ secrets
- [ ] Set up `.env` with `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`
- [ ] Update WalletConnect Cloud dashboard with new domain
- [ ] Register new domain in Dr. Green DApp API if required
- [ ] Test wallet-auth flow end-to-end
- [ ] Test Dr. Green proxy signing with all environments
- [ ] Verify email delivery via Resend
- [ ] Import database data
- [ ] Import storage files
- [ ] Verify RLS policies match source

### Post-Migration
- [ ] Verify admin wallet login
- [ ] Verify patient signup → KYC → eligibility flow
- [ ] Verify product listing and cart
- [ ] Verify order creation through Dr. Green API
- [ ] Verify prescription upload and management
- [ ] Run security scan on new environment

---

## 10. Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React/Vite)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │ Auth Page │  │   Shop   │  │  Admin   │  │ Patient│ │
│  │  (SIWE)  │  │(Products)│  │Dashboard │  │Dashboard│ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬────┘ │
│       │              │             │             │       │
│  ┌────┴──────────────┴─────────────┴─────────────┴────┐ │
│  │            Supabase Client (anon key)               │ │
│  └────────────────────────┬────────────────────────────┘ │
│       │                   │                              │
│  ┌────┴────┐         ┌────┴────┐                        │
│  │RainbowKit│        │  React  │                        │
│  │ wagmi   │         │ Router  │                        │
│  └────┬────┘         └─────────┘                        │
│       │ WalletConnect (0ed436...)                        │
└───────┼─────────────────────────────────────────────────┘
        │
┌───────┴─────────────────────────────────────────────────┐
│                 SUPABASE BACKEND                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Edge Functions (19)                  │   │
│  │  ┌─────────────┐  ┌──────────────┐               │   │
│  │  │ wallet-auth  │  │ drgreen-proxy│──► Dr. Green  │   │
│  │  │ (SIWE+NFT)  │  │ (HMAC sign)  │    DApp API   │   │
│  │  └─────────────┘  └──────────────┘               │   │
│  │  ┌─────────────┐  ┌──────────────┐               │   │
│  │  │ send-*-email │  │ sync-strains │               │   │
│  │  │  (Resend)   │  │(API → local) │               │   │
│  │  └─────────────┘  └──────────────┘               │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐                     │
│  │  PostgreSQL   │  │   Storage    │                     │
│  │  (14 tables)  │  │  (4 buckets) │                     │
│  └──────────────┘  └──────────────┘                     │
└─────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│              EXTERNAL SERVICES                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Dr. Green    │  │   Resend     │  │  Ethereum    │  │
│  │  DApp API     │  │  (Email)     │  │  Mainnet     │  │
│  │  (5 envs)     │  │              │  │  (NFT check) │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

*This document contains infrastructure references only. Secret values are never stored in code or documentation. Retrieve them from your Lovable Cloud project settings before migration.*
