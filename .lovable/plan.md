

# Nonce-Based Wallet Auth Implementation

## Overview
Replace the current timestamp-based wallet authentication with a secure, server-issued nonce system as defined in the Profile & Auth API Reference (Sections 1.1-1.2). This eliminates replay attack vectors and aligns with industry-standard SIWE patterns.

## Current State (Verified)
- **Dr. Green API**: Healthy, secrets working (confirmed via health check)
- **Wallet-auth edge function**: Operational, NFT check and admin whitelist working
- **Current auth pattern**: Client generates a message with `Wallet: 0x...` and `Timestamp: {ms}`, signs it, sends to edge function which validates the timestamp is within 5 minutes
- **Weakness**: Timestamps can be reused within the 5-minute window (replay risk)

## What Changes

### 1. New Database Table: `wallet_auth_nonces`

Stores server-issued nonces with single-use enforcement:

```text
wallet_auth_nonces
  id            uuid (PK, default gen_random_uuid())
  address       text (NOT NULL, lowercase wallet address)
  nonce         text (NOT NULL, unique)
  purpose       text (NOT NULL: 'login' | 'create' | 'link' | 'delete')
  issued_at     timestamptz (NOT NULL, default now())
  expires_at    timestamptz (NOT NULL, default now() + 5 min)
  used          boolean (NOT NULL, default false)
  used_at       timestamptz (nullable)
```

RLS: disabled (only accessed by edge function via service role).

### 2. Updated Edge Function: `wallet-auth`

Add two new actions alongside existing ones:

**`action: 'request-nonce'`** (new)
- Input: `{ action: 'request-nonce', address: '0x...', purpose: 'login' }`
- Generates a cryptographically random nonce
- Stores it in `wallet_auth_nonces` with 5-minute expiry
- Returns `{ address, nonce, purpose, issuedAt, expiresAt }`

**`action: 'verify'`** (new, replaces the current timestamp-based flow)
- Input: `{ action: 'verify', address: '0x...', message: '...', signature: '0x...', purpose: 'login' }`
- Extracts nonce from the signed message
- Validates: nonce exists, matches address and purpose, not used, not expired
- Recovers address from signature (reuses existing `recoverAddress`)
- Marks nonce as used
- Performs NFT check, email resolution, user creation, role assignment, OTP issuance (same as current flow)

**Backward compatibility**: The current flow (no `action` field, just `message/signature/address`) continues to work during transition but logs a deprecation warning.

### 3. Updated Frontend Hook: `useWalletAuth.ts`

Change `authenticateWithWallet` to:
1. Call edge function with `action: 'request-nonce'` to get a server nonce
2. Build message containing the nonce (instead of a client-generated timestamp)
3. Request wallet signature via MetaMask
4. Call edge function with `action: 'verify'` and the signed message
5. Establish session via OTP (unchanged)

New message format:
```text
Healing Buds Admin Authentication

I am signing in to the Healing Buds admin portal.

Wallet: 0xABC...
Nonce: a1b2c3d4e5f6...
Issued At: 2026-02-08T23:10:50Z
```

### 4. Nonce Cleanup

Add a cleanup step in the nonce request: delete expired nonces older than 1 hour to prevent table bloat. No separate cron needed.

## Files Modified

| File | Change |
|------|--------|
| `supabase/functions/wallet-auth/index.ts` | Add `request-nonce` and `verify` actions, keep backward compat |
| `src/hooks/useWalletAuth.ts` | Two-step flow: request nonce then verify |
| Database migration | Create `wallet_auth_nonces` table |

## Files NOT Modified
- `src/hooks/useNFTOwnership.ts` (client-side NFT check, unrelated)
- `src/components/WalletConnectionModal.tsx` (UI unchanged, consumes hook)
- `src/context/WalletContext.tsx` (unchanged, consumes hook)

## Security Improvements
- Nonces are single-use (prevents replay attacks entirely)
- Server-controlled expiry (5 minutes, not client clock dependent)
- Nonces tied to specific purpose and address
- Expired nonces auto-cleaned on each request
- Rate limiting possible via nonce issuance tracking

## Testing Plan
After implementation:
1. Call `request-nonce` via edge function curl to verify nonce issuance
2. Call `verify` with a test payload to confirm the flow works
3. Verify backward compatibility with old-style requests
4. Test nonce reuse rejection (should fail on second attempt)
5. Test expired nonce rejection

## Technical Notes
- The `wallet_auth_nonces` table has RLS disabled because it is only accessed server-side via the service role key in the edge function
- The nonce is generated using `crypto.randomUUID()` in Deno for sufficient entropy
- The existing `nft-check` action remains unchanged
- The `parseAuthMessage` function is updated to also extract a `Nonce:` field when present

