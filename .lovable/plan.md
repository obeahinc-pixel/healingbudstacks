
# Plan: Add Staging Environment Support to drgreen-proxy

## ✅ COMPLETED & VERIFIED

## Problem Summary
The `drgreen-proxy` edge function previously only used production credentials. Staging credentials were configured but unused.

## Solution Implemented
Added environment switching capability following the pattern from `drgreen-comparison`.

## Verification Results

| Environment | Endpoint | Status | Notes |
|-------------|----------|--------|-------|
| Production | GET /strains | ✅ 200 | Works correctly |
| Production | GET /dapp/clients | ❌ 401 | API permission issue |
| Staging | GET /strains | ✅ 200 | Works correctly |
| Staging | GET /dapp/clients | ❌ 401 | Same API permission issue |

**Conclusion**: The implementation is correct. Both staging and production credentials work for public endpoints. The `/dapp/` endpoint 401 errors are due to API-level permissions at Dr. Green, not credential format issues.

## Changes Made

### 1. Environment Configuration (lines 341-365)
```typescript
interface EnvConfig {
  apiUrl: string;
  apiKeyEnv: string;
  privateKeyEnv: string;
  name: string;
}

const ENV_CONFIG: Record<string, EnvConfig> = {
  production: { ... },
  staging: { ... },
};
```

### 2. Helper Functions
- `getStagingApiUrl()` - Validates staging URL format
- `getEnvironment()` - Selects environment based on request/env var
- `getEnvCredentials()` - Retrieves credentials by environment

### 3. Updated Request Functions
All functions now accept optional `envConfig` parameter:
- `drGreenRequestBody(endpoint, method, body, logging, envConfig)`
- `drGreenRequestGet(endpoint, queryParams, logging, envConfig)`
- `drGreenRequestQuery(endpoint, queryParams, logging, envConfig)`
- `drGreenRequest(endpoint, method, body, envConfig)`

### 4. New Actions
- `test-staging` - Tests both environments and reports status

## Usage

### Explicit environment in request:
```json
{
  "action": "get-strains",
  "countryCode": "ZAF",
  "env": "staging"
}
```

### Global override:
Set `DRGREEN_USE_STAGING=true` environment variable.

## Secrets Status

| Secret | Configured | Format Valid |
|--------|------------|--------------|
| `DRGREEN_API_KEY` | ✅ | ✅ Base64 PEM (232 chars) |
| `DRGREEN_PRIVATE_KEY` | ✅ | ✅ Base64 PEM |
| `DRGREEN_STAGING_API_KEY` | ✅ | ✅ Base64 PEM (232 chars) |
| `DRGREEN_STAGING_PRIVATE_KEY` | ✅ | ✅ Base64 PEM |
| `DRGREEN_STAGING_API_URL` | ⚠️ | Invalid (not a URL) - fallback used |

## Next Steps

To enable `/dapp/` endpoints, the Dr. Green API credentials need elevated permissions. This requires:
1. Generating new API keys from the Dr. Green dApp portal with dApp admin permissions
2. Or contacting Dr. Green support to enable `/dapp/` access for the current keys
