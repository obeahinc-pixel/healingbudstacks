

## Admin Dashboard Role-Based Access Control Review

### Current State
The admin routes work correctly but have an inconsistency worth addressing:
- AdminLayout checks the admin role and blocks rendering for non-admins (shows "Access Denied")
- However, admin routes in App.tsx do NOT use the `ProtectedRoute` component
- Database-level RLS policies correctly enforce admin access on all sensitive tables using `has_role()`

### What Works Well
- All admin-only database tables are protected by RLS policies using `has_role(auth.uid(), 'admin')`
- The `has_role()` function uses `SECURITY DEFINER` to prevent recursive RLS issues
- AdminLayout correctly blocks UI rendering for non-admin users
- Non-admin users see a clean "Access Denied" screen with navigation options

### Recommended Fix: Wrap Admin Routes with ProtectedRoute

Add the `ProtectedRoute` component around all admin routes in `App.tsx` for defense-in-depth. This provides:
- Redirect to `/auth` for unauthenticated users (instead of showing "Access Denied")
- Prevents admin page components from mounting at all for unauthorized users
- Consistent security pattern across the application

### Changes

**File: `src/App.tsx`**
Wrap each admin route with `ProtectedRoute`:

```text
Before:
<Route path="/admin" element={<AdminDashboard />} />

After:
<Route path="/admin" element={
  <ProtectedRoute requiredRole="admin">
    <AdminDashboard />
  </ProtectedRoute>
} />
```

Apply this pattern to all 11 admin routes:
- `/admin`
- `/admin/clients`
- `/admin/orders`
- `/admin/prescriptions`
- `/admin/strains`
- `/admin/strain-sync`
- `/admin/strain-knowledge`
- `/admin/roles`
- `/admin/wallet-mappings`
- `/admin/tools`
- `/admin/settings`

### Technical Details
- `ProtectedRoute` uses `supabase.rpc('has_role', ...)` for server-side role verification
- This is a double-layer check: ProtectedRoute (route level) + AdminLayout (component level)
- No database changes needed — RLS policies are already correctly configured
- No new dependencies required

### Risk Assessment
- **Low risk**: This is additive security, not a behavior change
- The AdminLayout check remains as a fallback
- Both checks use the same `has_role` database function

