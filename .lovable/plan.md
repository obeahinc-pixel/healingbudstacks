

# Plan: Clean Up Stale References to Removed Infrastructure

## Findings

### 1. `supabase/config.toml` — 3 stale function blocks (lines 33-34, 60-61, 63-64)
The previous deletion removed the function directories but missed removing their config entries:
- `[functions.exchange-rates]` (deleted in prior cleanup)
- `[functions.prescription-expiry-check]` (deleted this session)
- `[functions.upload-email-logo]` (deleted this session)

### 2. `docs/ACCOUNT-MIGRATION.md` — 3 stale table rows (lines 157, 166, 168)
References `exchange-rates`, `prescription-expiry-check`, and `upload-email-logo` as active edge functions. These rows should be removed from the edge functions inventory table.

### 3. `docs/API-GAP-ANALYSIS.md` — references to deleted `useWalletAuth.ts` (lines 34, 74, 188)
Three lines reference `src/hooks/useWalletAuth.ts` as an active file. These should be updated to note the hook was removed and wallet auth now uses `WalletContext` + the `wallet-auth` edge function directly.

### End-to-End Test Results
- **Homepage**: Loads correctly, no errors.
- **Shop page**: Loads with 7 strains, filters and cart button functional.
- **Dashboard**: Correctly shows "Sign In Required" for unauthenticated users.
- **Console**: No errors related to removed code.

## Changes

| Action | File | Detail |
|--------|------|--------|
| Edit | `supabase/config.toml` | Remove `[functions.exchange-rates]`, `[functions.prescription-expiry-check]`, `[functions.upload-email-logo]` blocks |
| Edit | `docs/ACCOUNT-MIGRATION.md` | Remove rows for `exchange-rates`, `prescription-expiry-check`, `upload-email-logo` |
| Edit | `docs/API-GAP-ANALYSIS.md` | Update 3 references from `useWalletAuth.ts` to note it was removed; wallet auth handled by `WalletContext` + `wallet-auth` edge function |

## Impact
- Documentation-only changes plus config cleanup
- No functional change to the application
- Prevents confusion from stale references to deleted files

