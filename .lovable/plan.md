

# Create & Link Accounts for kayliegh.sm@gmail.com and scott.k1@outlook.com

## Current State
- Neither email exists in auth.users, profiles, drgreen_clients, or wallet_email_mappings
- No Dr. Green DApp client records found for either email (API check requires auth, but database is empty)

## Steps

### 1. Create Supabase Auth Accounts
Use the existing `admin-update-user` edge function to create both accounts with verified emails:
- `kayliegh.sm@gmail.com` (password set, email confirmed)
- `scott.k1@outlook.com` (password set, email confirmed)

The `handle_new_user` trigger will automatically create profile records.

### 2. Create Dr. Green DApp Client Records
For each user, call `drgreen-proxy` with `action: 'create-client-legacy'` to register them as clients on the Dr. Green DApp. This creates the client on the external API and returns a `clientId` and `kycLink`.

Payload will include:
- Basic contact info (name, email, phone placeholder)
- Default shipping address (Portugal)
- Minimal medical record (required fields only with safe defaults)

### 3. Link Local drgreen_clients Records
Insert records into the `drgreen_clients` table mapping each Supabase user ID to their Dr. Green client ID, storing the KYC link for later verification.

## Implementation
All of this can be done by:
1. Calling the `admin-update-user` edge function twice (one per email)
2. Logging in as each user (or using service role) to call `drgreen-proxy` with `create-client-legacy`
3. Inserting `drgreen_clients` records via SQL

Since the proxy requires authentication, the simplest approach is to use the `admin-update-user` function to create accounts, then use the debug header on `drgreen-proxy` to create DApp clients without needing to authenticate as each user.

## Files Modified
- No file changes needed -- this is a data/account provisioning task using existing edge functions

