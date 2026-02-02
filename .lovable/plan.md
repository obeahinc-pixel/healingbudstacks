
# Plan: Fix Quick Login Admin Credentials

## Issue Identified
The quick login dropdown has incorrect admin credentials. The actual admin account in the database is:
- **Email**: `admin@healingbuds.test`
- **User ID**: `6fc36e5c-92c5-43d4-a162-3d6385190590`
- **Role**: `admin`

The dropdown currently tries to use `scott@healingbuds.global` which doesn't exist in the auth system.

## Fix Required

### File: `src/pages/Auth.tsx`

Update line 319 to use the correct admin email:

| Current (Wrong) | Correct |
|-----------------|---------|
| `scott@healingbuds.global` | `admin@healingbuds.test` |

```typescript
<DropdownMenuItem
  onClick={() => {
    setEmail("admin@healingbuds.test");  // Changed from scott@healingbuds.global
    setPassword("Healing2025!");
  }}
  className="cursor-pointer"
>
  <Shield className="w-4 h-4 mr-2 text-primary" />
  Admin (Test)
</DropdownMenuItem>
```

## Available Accounts Summary

| Email | Role | Status |
|-------|------|--------|
| `admin@healingbuds.test` | Admin | ✅ Confirmed |
| `scott.k1@outlook.com` | Patient | ✅ Confirmed |

## Testing
After this change, clicking "Quick Login (Dev)" → "Admin (Test)" should successfully log in and redirect to `/admin`.
