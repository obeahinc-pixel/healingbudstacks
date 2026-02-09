

# Admin Portal: Environment Switcher & API Settings

## Overview

Move the environment selector into the AdminLayout header bar (visible on every admin page) and add a new Admin Settings page where credentials and API URLs can be viewed and edited per environment.

## Changes

### 1. Move EnvironmentSelector into AdminLayout header

**File: `src/layout/AdminLayout.tsx`**
- Import `EnvironmentSelector` and add it to the page header bar (the `border-b border-border bg-card/50` section at line ~398)
- Place it inline with the page title, aligned right
- Also add it to the mobile header bar
- When sidebar is collapsed, the selector remains visible in the main content header

**File: `src/pages/AdminDashboard.tsx`**
- Remove the standalone `EnvironmentSelector` from the dashboard body (line ~290) since it now lives in the layout
- Remove the `useApiEnvironment` import if no longer used directly (it is still used for `environmentLabel` in the description -- keep that)

### 2. Create Admin Settings page

**New file: `src/pages/AdminSettings.tsx`**

A settings page wrapped in `AdminLayout` with:
- **Active Environment indicator** -- shows which environment is selected (Production / Railway) with a colored badge
- **Environment Configuration cards** -- one card per environment showing:
  - API Base URL (editable input)
  - API Key (masked, editable)
  - Private Key (masked, editable)
  - A "Test Connection" button that calls the `health-check` action via the proxy
  - Status indicator (connected/disconnected based on last test)
- **Save** persists changes to the backend (stored in a `api_environment_config` table)
- **Note**: For the final production release, only one environment will be active. Railway is for testing.

### 3. Add Settings nav item to AdminLayout

**File: `src/layout/AdminLayout.tsx`**
- Add `{ to: "/admin/settings", label: "Settings", icon: Settings }` to `secondaryNavItems`
- The `Settings` icon is already imported but unused -- use it

### 4. Add route

**File: `src/App.tsx`**
- Add `<Route path="/admin/settings" element={<AdminSettings />} />`
- Import the new page component

### 5. Database table for environment config (optional enhancement)

Create a `api_environment_config` table to persist custom API URLs/keys per environment so admins can update credentials without redeploying secrets. Fields:
- `id` (uuid, PK)
- `environment` (text, unique -- 'production' or 'railway')
- `api_url` (text)
- `api_key_hint` (text -- last 4 chars only, for display)
- `updated_at` (timestamptz)
- `updated_by` (uuid, FK to profiles)

RLS: Only admins can read/write.

Actual secret values remain in backend secrets -- the settings page shows hints and allows testing, but full key replacement would still go through the secrets management flow.

## Technical Details

### EnvironmentSelector placement in AdminLayout header

The selector will be added to the existing page header section (line ~398-408), positioned to the right of the title using flex:

```text
+----------------------------------------------+
| Dashboard                  [Env: Production v]|
| Live overview - Production                    |
+----------------------------------------------+
```

### AdminSettings page structure

```text
+------------------+----------------------------+
| Sidebar          | Settings                   |
|                  |                            |
|                  | [Active: Production]       |
|                  |                            |
|                  | -- Production -----------  |
|                  | URL: https://app.drgreen.. |
|                  | Key: ****3xF2              |
|                  | [Test Connection] [OK]     |
|                  |                            |
|                  | -- Railway (Dev) --------  |
|                  | URL: https://railway.app.. |
|                  | Key: ****9aB1              |
|                  | [Test Connection] [--]     |
+------------------+----------------------------+
```

### Files summary

| File | Action |
|------|--------|
| `src/layout/AdminLayout.tsx` | Add EnvironmentSelector to header, add Settings nav item |
| `src/pages/AdminDashboard.tsx` | Remove duplicate EnvironmentSelector from body |
| `src/pages/AdminSettings.tsx` | New page -- environment config and connection testing |
| `src/App.tsx` | Add `/admin/settings` route |

