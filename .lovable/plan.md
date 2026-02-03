
## Goal
Add Kayliegh's account to the Quick Login dropdown alongside the existing Admin option for easier testing of both account types.

---

## Current State

The Auth page has a "Quick Login (Dev)" dropdown with one option:
- **Admin**: `scott@healingbuds.global` / `H34l1ng@buds2025!`

---

## Changes Required

### Update: `src/pages/Auth.tsx`

Add a second dropdown menu item for Kayliegh's verified patient account:

```typescript
<DropdownMenuContent align="center" className="w-56">
  <DropdownMenuItem
    onClick={() => {
      setEmail("scott@healingbuds.global");
      setPassword("H34l1ng@buds2025!");
    }}
    className="cursor-pointer"
  >
    <Shield className="w-4 h-4 mr-2 text-primary" />
    Admin
  </DropdownMenuItem>
  
  {/* NEW: Kayliegh's verified patient account */}
  <DropdownMenuItem
    onClick={() => {
      setEmail("kayliegh.sm@gmail.com");
      setPassword("TempPassword123!");
    }}
    className="cursor-pointer"
  >
    <UserIcon className="w-4 h-4 mr-2 text-green-600" />
    Kayliegh (Patient)
  </DropdownMenuItem>
</DropdownMenuContent>
```

---

## Summary

| Change | Description |
|--------|-------------|
| Add dropdown item | Kayliegh's verified patient account for testing patient flows |
| Icon differentiation | Use `UserIcon` with green color to distinguish from admin |

This allows quick switching between:
1. **Admin** → Tests admin dashboard flows
2. **Kayliegh (Patient)** → Tests verified patient flows (Dr. Green synced account)

---

## Technical Notes

- Kayliegh is a **live verified user** per the project constraints — credentials must match what's in the seed script (`TempPassword123!`)
- The `UserIcon` is already imported at line 13, so no new imports needed
