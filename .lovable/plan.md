
# Plan: Enhanced AdminClientCreator with Find & Link Mode

## Context
Scott (`scott.k1@outlook.com`) and Kayleigh (`kayleigh.sm@gmail.com`) already exist in the Dr. Green API. Rather than creating duplicate records, we need to search for and link these existing clients to the local database.

## Current State Analysis
- The `sync-client-by-email` action in `drgreen-proxy` can search for clients by email
- The `admin-reregister-client` action creates NEW clients (not what we want for existing records)
- The `AdminClientCreator` component currently only uses re-registration (POST)
- No Supabase users exist for Scott/Kayleigh yet (empty auth.users query result)

## Implementation Strategy

### Phase 1: Update AdminClientCreator with Correct Emails

Update `PREDEFINED_CLIENTS` array with the real Dr. Green emails:

```text
Scott:
  - email: scott.k1@outlook.com
  - firstName: Scott
  - lastName: K

Kayleigh:
  - email: kayleigh.sm@gmail.com
  - firstName: Kayleigh
  - lastName: SM
```

### Phase 2: Add Dual-Mode Operation

The component will support two modes:

1. **Find & Link Mode** (Primary for existing clients)
   - Calls `sync-client-by-email` action
   - Searches Dr. Green API for the client
   - If found: displays client ID, KYC status, admin approval
   - Can optionally link to a local Supabase user

2. **Create Mode** (Fallback for new clients)
   - Uses existing `admin-reregister-client` action
   - Creates fresh records under current API key pair

### Phase 3: Expose syncClientByEmail in useDrGreenApi Hook

Add a new function to the hook:

```typescript
syncClientByEmail: async (email: string, localUserId?: string) => {
  return callProxy<{
    success: boolean;
    client?: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      isKYCVerified: boolean;
      adminApproval: string;
    };
    synced?: boolean;
    message?: string;
  }>('sync-client-by-email', { email, localUserId });
}
```

### Phase 4: Update UI with Enhanced Actions

For each predefined client, show:
- **Find & Link** button (uses sync-client-by-email)
- **Create New** button (uses admin-reregister-client)
- Status display showing:
  - Dr. Green Client ID (if found)
  - KYC Status
  - Admin Approval Status

## File Changes

| File | Change Type | Description |
|------|-------------|-------------|
| `src/components/admin/AdminClientCreator.tsx` | Modify | Update emails, add Find & Link mode, dual-button UI |
| `src/hooks/useDrGreenApi.ts` | Modify | Add `syncClientByEmail` function to exports |

## Technical Details

### AdminClientCreator.tsx Changes

```typescript
// Updated predefined clients
const PREDEFINED_CLIENTS = [
  {
    id: 'scott',
    firstName: 'Scott',
    lastName: 'K',
    email: 'scott.k1@outlook.com',  // Real Dr. Green email
    countryCode: 'ZAF',  // South Africa (default for open countries)
    // ... shipping details
  },
  {
    id: 'kayleigh',
    firstName: 'Kayleigh',
    lastName: 'SM',
    email: 'kayleigh.sm@gmail.com',  // Real Dr. Green email
    countryCode: 'ZAF',
    // ... shipping details
  },
];

// New find & link function
const findAndLinkClient = async (client) => {
  const result = await syncClientByEmail(client.email);
  if (result.data?.success && result.data?.client) {
    // Client found - show details and sync status
    setResults(prev => [...prev, {
      ...result.data.client,
      success: true,
      synced: result.data.synced,
    }]);
  } else {
    // Not found or API error - offer to create new
    toast({ title: 'Not Found', description: result.data?.message });
  }
};
```

### useDrGreenApi.ts Addition

Add `syncClientByEmail` to the returned object alongside existing methods.

## User Flow After Implementation

1. Navigate to `/admin`
2. See "Create Dr. Green Clients" section
3. For Scott and Kayleigh with correct emails:
   - Click **"Find & Link"** button
   - System searches Dr. Green API
   - If found: Shows client ID, status, and "Linked" badge
   - If not found: Shows error with option to create new
4. If needed, use "Create New" for fresh registration

## Testing Plan

1. Deploy changes
2. Navigate to Admin Dashboard
3. Click "Find & Link" for Scott (`scott.k1@outlook.com`)
4. Verify the search returns client data (or clear error if not visible)
5. Repeat for Kayleigh (`kayleigh.sm@gmail.com`)
6. If clients are found, verify client IDs are displayed
7. Test "Create New" fallback with a test email

## Risk Considerations

- If clients belong to a different NFT/API key pair, the search will return 401
- In that case, the UI will clearly indicate that the clients cannot be accessed with current credentials
- Manual intervention via Dr. Green DApp portal would be required to reassign clients
