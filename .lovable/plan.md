

## Update All Secrets and Complete Setup

All credentials have been provided. Here is what will be configured:

### Secrets to Update (7 of 8 provided)

| # | Secret | Value Source |
|---|--------|-------------|
| 1 | `DRGREEN_API_KEY` | Production public key (provided) |
| 2 | `DRGREEN_PRIVATE_KEY` | Production private key (provided) |
| 3 | `DRGREEN_STAGING_API_KEY` | Railway/Budstack public key (provided) |
| 4 | `DRGREEN_STAGING_PRIVATE_KEY` | Railway/Budstack private key (provided) |
| 5 | `DRGREEN_STAGING_API_URL` | `https://budstack-backend-main-development.up.railway.app` |
| 6 | `RESEND_API_KEY` | `re_Jfr6ihh1_H76reahpYEoEEUoQHXHUcqob` |
| 7 | `EXTERNAL_SUPABASE_SERVICE_KEY` | Supabase service role key (provided) |

**Missing**: `ADMIN_WALLET_ADDRESSES` -- not provided. Will skip for now (can be added later, and wallet features are being hidden anyway).

### API URL Configuration

The proxy already has the correct URLs hardcoded:
- **Production**: `https://api.drgreennft.com/api/v1`
- **Staging**: `https://stage-api.drgreennft.com/api/v1` (default fallback)
- **Railway**: Will use `DRGREEN_STAGING_API_URL` override when Railway environment is selected

No proxy code changes needed for URLs.

### UI Changes (from previous approved plan)

1. **Remove "Connect Wallet" button** from the header
2. **Replace "Admin Login" dropdown** with a simple "Patient Login" button linking to `/auth`
3. These features will be developed in the background and re-enabled later

### Hardcode Admin Access

Create a database trigger so that when `healingbudsglobal@gmail.com` signs up (password: `Healing@2026`), they are automatically assigned the `admin` role.

### Product Display

Already confirmed: non-restricted countries (ZA, TH, etc.) show products freely without KYC/verification. No code changes needed.

### Verification

After secrets are set, run the Dr. Green health check endpoint to verify both production and staging connectivity.

