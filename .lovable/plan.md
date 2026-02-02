

## Goal
Add a fourth environment option called **"Alt Production (Test)"** that lets you test new API keys against the production API (`api.drgreennft.com`) without replacing your current working credentials.

---

## Architecture

The existing system supports 3 environments:
| Environment | API URL | Keys |
|------------|---------|------|
| Production | `api.drgreennft.com` | `DRGREEN_API_KEY`, `DRGREEN_PRIVATE_KEY` |
| Staging | `stage-api.drgreennft.com` | `DRGREEN_STAGING_API_KEY`, `DRGREEN_STAGING_PRIVATE_KEY` |
| Railway | `budstack-backend...railway.app` | (reuses staging keys) |

**New environment to add:**
| Environment | API URL | Keys |
|------------|---------|------|
| **Alt Production** | `api.drgreennft.com` | `DRGREEN_ALT_API_KEY`, `DRGREEN_ALT_PRIVATE_KEY` |

This allows toggling between two different key pairs against the same production API.

---

## Changes Required

### 1. Add New Secrets (User Action Required)
You'll need to add two new secrets:
- `DRGREEN_ALT_API_KEY` - Your alternate API key
- `DRGREEN_ALT_PRIVATE_KEY` - Your alternate private key

### 2. Update Edge Function: `drgreen-proxy/index.ts`

Add new environment config:

```typescript
const ENV_CONFIG: Record<string, EnvConfig> = {
  production: {
    apiUrl: 'https://api.drgreennft.com/api/v1',
    apiKeyEnv: 'DRGREEN_API_KEY',
    privateKeyEnv: 'DRGREEN_PRIVATE_KEY',
    name: 'Production',
  },
  // NEW: Alt production uses same URL but different keys
  'alt-production': {
    apiUrl: 'https://api.drgreennft.com/api/v1',
    apiKeyEnv: 'DRGREEN_ALT_API_KEY',
    privateKeyEnv: 'DRGREEN_ALT_PRIVATE_KEY',
    name: 'Alt Production (Test)',
  },
  staging: { ... },
  railway: { ... },
};
```

### 3. Update Context: `ApiEnvironmentContext.tsx`

Add new environment type:

```typescript
export type ApiEnvironment = 'production' | 'alt-production' | 'staging' | 'railway';

const ENVIRONMENT_LABELS: Record<ApiEnvironment, string> = {
  production: 'Production',
  'alt-production': 'Alt Production (Test)',
  staging: 'Staging (Official)',
  railway: 'Railway (Dev)',
};
```

### 4. Update Selector: `EnvironmentSelector.tsx`

Add new dropdown option:

```typescript
const environments = [
  { value: 'production', label: 'Production', icon: <Server />, color: 'bg-green-500' },
  { value: 'alt-production', label: 'Alt Production (Test)', icon: <Key />, color: 'bg-blue-500' },
  { value: 'staging', label: 'Staging (Official)', icon: <Cloud />, color: 'bg-amber-500' },
  { value: 'railway', label: 'Railway (Dev)', icon: <Train />, color: 'bg-purple-500' },
];
```

---

## Testing Flow

After implementation:
1. Go to Admin Dashboard → Environment Selector
2. Select **Alt Production (Test)**
3. Test API calls (e.g., fetch products)
4. If keys work, you can later swap them to become the main production keys
5. Switch back to **Production** to use original working keys

---

## Summary

| File | Change |
|------|--------|
| Backend secrets | Add `DRGREEN_ALT_API_KEY` + `DRGREEN_ALT_PRIVATE_KEY` |
| `drgreen-proxy/index.ts` | Add `alt-production` environment config |
| `ApiEnvironmentContext.tsx` | Add `alt-production` to type and labels |
| `EnvironmentSelector.tsx` | Add dropdown option with blue indicator |

