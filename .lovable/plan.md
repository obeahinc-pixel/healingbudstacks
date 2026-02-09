
# Remove Wallet Connect Button from Patient View

## Overview
The WalletButton in the header is currently visible to patients and visitors. It should only be visible to admins (or in the admin login dropdown for unauthenticated users). Two changes needed, both in `src/layout/Header.tsx`.

## Changes

**File**: `src/layout/Header.tsx`

### 1. Hide the WalletButton from patients (line 205)
Change the condition from `(!user || !isAdmin)` to only show for admins:

```
// Before: Shows wallet for non-admins (wrong)
{(!user || !isAdmin) && <WalletButton className="ml-1" />}

// After: Shows wallet ONLY for admins
{user && isAdmin && !roleLoading && <WalletButton className="ml-1" />}
```

### 2. Keep the unauthenticated "Admin Login" dropdown as-is
The dropdown at lines 283-325 already correctly labels wallet connection as "Admin Login" with the description "NFT wallet connection." This stays unchanged -- it's the correct entry point for admins who haven't logged in yet.

## Summary
One line change in `Header.tsx`. No other files affected -- the `NavigationOverlay` (mobile menu) doesn't include a wallet button, and the `MobileBottomActions` bar doesn't either.
