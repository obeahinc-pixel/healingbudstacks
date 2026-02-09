

# Admin Dashboard Overhaul -- Relevant, Clean, Professional

## Problem Summary

The admin dashboard is currently a dumping ground of developer/debug tools mixed with operational data. It contains:
- Admin account info card (fine)
- Wallet connection card (fine but large)
- Demo KYC toggle (fine but should be smaller)
- 8 stat cards (some showing 0 because there's no data)
- Client Creator tool
- Client Manager (good, but huge on the main page)
- Batch Image Generator (dev tool -- wrong place)
- KYC Journey Viewer (dev tool -- wrong place)
- Email Trigger (dev tool -- wrong place)
- Client Import (dev tool -- wrong place)
- API Test Runner (dev tool -- wrong place)
- API Comparison Dashboard (dev tool -- wrong place)
- API Debug Panel (dev tool -- wrong place)
- Admin Tools cards at the bottom

This is not a usable CRM dashboard. It violates the project's own UX philosophy: "Clarity over cleverness, Stability over novelty."

## Plan

### 1. Restructure Admin Dashboard into Focused Sections

**Keep on Dashboard (above the fold):**
- Welcome header with admin name, environment selector, refresh button
- 4 primary KPI cards in a row: Live Clients, Live Orders, Pending Approvals, Verified Clients
- Pending Queue banner (if pending orders exist) -- quick action
- Sales Pipeline summary (compact version of SalesDashboard)
- Recent Activity feed (last 5 client registrations + last 5 orders)

**Move to sidebar "Clients" page (new route /admin/clients):**
- AdminClientManager (full client list with search/filter/sync)
- AdminClientCreator

**Move to sidebar "Developer Tools" page (new route /admin/tools):**
- API Test Runner
- API Comparison Dashboard
- API Debug Panel
- Batch Image Generator
- Client Import
- Email Trigger
- KYC Journey Viewer

**Keep in sidebar but already exists:**
- Orders, Prescriptions, Strains, Strain Sync, Knowledge Base, User Roles, Wallet Mappings

### 2. Update Sidebar Navigation

Current sidebar has 8 items + debug link. Reorganize to:

| Nav Item | Icon | Route | Purpose |
|----------|------|-------|---------|
| Dashboard | LayoutDashboard | /admin | KPIs + activity |
| Clients | Users | /admin/clients | Client management (NEW) |
| Orders | ShoppingCart | /admin/orders | Order management |
| Prescriptions | FileText | /admin/prescriptions | Prescription review |
| Strains | Leaf | /admin/strains | Strain catalog |
| Strain Sync | RefreshCw | /admin/strain-sync | Country sync |
| --- divider --- | | | |
| User Roles | Shield | /admin/roles | RBAC management |
| Wallet Mappings | Wallet | /admin/wallet-mappings | Wallet links |
| Developer Tools | Bug | /admin/tools | All debug/dev tools (NEW) |

Remove "Knowledge Base" from primary nav (rarely used, accessible from Strains page or dev tools).

### 3. Redesign Dashboard KPI Cards

Replace the current 8 stat cards with 4 focused, properly labeled cards using live API data:

1. **Registered Clients** -- from getClientsSummary (totalCount), with sub-badge showing pending count
2. **Total Orders** -- from getDashboardSummary or local DB count
3. **Pending Approvals** -- clients awaiting KYC/admin approval (amber, actionable)
4. **Verified & Active** -- fully verified clients ready to order (green, confidence metric)

### 4. Add Quick Actions Section

Below the KPIs, a row of quick-action buttons:
- "View Pending Clients" (links to /admin/clients?filter=PENDING)
- "Process Pending Orders" (links to /admin/orders with pending tab)
- "Sync Client Data" (triggers API refresh)
- "Open Dr. Green Portal" (external link)

### 5. Compact Wallet & Settings

Move the wallet connection and demo KYC toggle into a collapsible "Settings" section at the bottom of the dashboard, or into the sidebar user area. They're useful but not primary content.

### 6. Consistent Visual Language

- Use the same card border style as the main site (subtle `border-border`)
- Remove dashed borders and gradient cards from dev tools
- Use the theme's `--primary` teal consistently
- Keep the LIVE badges but make them smaller and less "pulsing"
- Use `text-foreground` and `text-muted-foreground` consistently

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/pages/AdminDashboard.tsx` | **Major rewrite** | Strip out dev tools, add focused KPIs + quick actions + recent activity |
| `src/pages/AdminClients.tsx` | **New file** | Dedicated clients page with AdminClientManager + AdminClientCreator |
| `src/pages/AdminTools.tsx` | **New file** | Developer tools page collecting all debug/API/image tools |
| `src/layout/AdminLayout.tsx` | **Edit** | Update sidebar nav items (add Clients, add Tools, remove Knowledge Base from primary) |
| `src/App.tsx` | **Edit** | Add routes for /admin/clients and /admin/tools |

## Dashboard Layout (Wireframe)

```text
+----------------------------------------------------------+
| Admin Dashboard                    [Env: Prod] [Refresh]  |
+----------------------------------------------------------+
|                                                           |
| [Clients: 12]  [Orders: 5]  [Pending: 3]  [Verified: 8] |
|  LIVE            LIVE         amber          green        |
|                                                           |
+-----------------------------------------------------------+
| ! 3 Pending Orders Awaiting Processing    [Confirm All]   |
+-----------------------------------------------------------+
|                                                           |
| Quick Actions                                             |
| [Pending Clients] [Process Orders] [Sync Data] [DG Portal]|
|                                                           |
+----------------------------+------------------------------+
| Sales Pipeline (compact)   | Recent Activity              |
| Leads: 5  Ongoing: 3      | - Kay registered (2h ago)    |
| Closed: 8                  | - Scott placed order (5h)    |
| [===========|====|=======] | - New KYC submission (1d)    |
+----------------------------+------------------------------+
|                                                           |
| v Settings & Wallet (collapsible)                         |
| Wallet: 0x1234...5678  |  Demo KYC: [toggle]            |
+-----------------------------------------------------------+
```

## Technical Notes

- The SalesDashboard component can be reused in compact mode on the dashboard
- AdminClientManager and AdminClientCreator move to the new /admin/clients page with no code changes needed
- All dev tools (ApiTestRunner, ApiComparisonDashboard, ApiDebugPanel, BatchImageGenerator, KYCJourneyViewer, AdminEmailTrigger, AdminClientImport) move to /admin/tools as-is
- The route structure follows the existing lazy-loading pattern with React.lazy()

