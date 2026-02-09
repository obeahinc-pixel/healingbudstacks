

# Fix: RainbowKit + Wagmi Dependency Conflict

## Problem

`@rainbow-me/rainbowkit@2.2.10` requires `wagmi@^2.9.0` as a peer dependency, but the project has `wagmi@^3.1.3` installed. RainbowKit v2 does **not** support wagmi v3 -- the upstream PR for wagmi v3 compatibility (#2591) is stalled and not merged.

## Recommended Approach: Downgrade wagmi to 2.x

This is the safest option. The wallet features in this project (NFT ownership checks, wallet connect modal) do not use any wagmi v3-specific APIs.

## Changes

### 1. Update `package.json` versions

| Package | Current | Target |
|---------|---------|--------|
| `wagmi` | `^3.1.3` | `^2.14.0` |
| `viem` | `^2.43.4` | `^2.43.4` (no change needed) |
| `@rainbow-me/rainbowkit` | `^2.2.10` | `^2.2.10` (no change needed) |
| `@tanstack/react-query` | `^5.90.16` | `^5.90.16` (no change needed) |

Only `wagmi` needs to change. `viem` v2 is compatible with both wagmi v2 and v3.

### 2. Check for wagmi v3-only API usage

Review all files importing from `wagmi` to ensure no v3-only APIs are used:

- `src/providers/WalletProvider.tsx` -- uses `WagmiProvider`, `http` from wagmi and `getDefaultConfig` from RainbowKit. All compatible with wagmi v2.
- `src/hooks/useNFTOwnership.ts` -- uses `useAccount`, `useReadContract`. These exist in wagmi v2.
- `src/components/WalletConnectionModal.tsx` -- uses `useAccount`, `useDisconnect`, `useBalance`, `useChainId`, `useSwitchChain`. All available in wagmi v2.
- `src/context/WalletContext.tsx` -- uses `useAccount`. Compatible.
- `src/hooks/useWalletAuth.ts` -- needs review but likely uses standard hooks.

No code changes expected -- just the version pin in `package.json`.

### 3. Remove `@metamask/sdk` if unused directly

`@metamask/sdk@^0.34.0` is listed as a direct dependency. RainbowKit already bundles MetaMask connector support. If nothing imports `@metamask/sdk` directly, it can be removed to reduce conflicts. This will be verified before removal.

## Why not the other options?

- **Force install (`--legacy-peer-deps`)**: Risks runtime crashes if wagmi v3 changed internal APIs that RainbowKit calls.
- **Remove RainbowKit**: Would require rewriting the entire wallet connection UI (modal, connectors, chain switching) from scratch. Not worth it.
- **Upgrade RainbowKit to support wagmi v3**: No official release exists yet. Using an unofficial fork introduces maintenance risk.

## Files to modify

| File | Change |
|------|--------|
| `package.json` | Change `wagmi` from `^3.1.3` to `^2.14.0` |

