

# Secret Configuration Plan

## Overview
Update all 9 API secrets with real credentials for the Healing Buds remixed project. This will enable connectivity to all four Dr. Green API environments.

## Secrets to Update

### Dr. Green Production (Primary)
1. **DRGREEN_API_KEY** - Base64-encoded API key for production
2. **DRGREEN_PRIVATE_KEY** - Base64-encoded private key for request signing

### Dr. Green Alt Production (Testing)
3. **DRGREEN_ALT_API_KEY** - Alternative production API key
4. **DRGREEN_ALT_PRIVATE_KEY** - Alternative production private key

### Dr. Green Staging (Official Test Environment)
5. **DRGREEN_STAGING_API_KEY** - Staging environment API key
6. **DRGREEN_STAGING_PRIVATE_KEY** - Staging environment private key
7. **DRGREEN_STAGING_API_URL** - Staging API base URL (e.g., `https://stage-api.drgreennft.com/api/v1`)

### External Services
8. **RESEND_API_KEY** - Resend email service API key
9. **EXTERNAL_SUPABASE_SERVICE_KEY** - Service role key for cross-project Supabase access

## Process
Once approved, I will prompt you to enter each secret value one at a time using secure input forms. Each prompt will include:
- The secret name
- Where to find the value (Dr. Green dashboard, Resend dashboard, etc.)
- Expected format (Base64-encoded, URL, etc.)

## Verification
After all secrets are entered, I will:
1. Re-deploy the edge functions to pick up new values
2. Run health checks on all 4 API environments
3. Confirm successful connectivity

