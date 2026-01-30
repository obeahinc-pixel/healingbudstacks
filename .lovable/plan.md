

# Fix Scott's Missing Dr. Green Profile

## Problem Summary
Scott (`scott.k1@outlook.com`) shows "Account Pending Approval" because he has **no Dr. Green client profile**. Kayliegh works correctly because she completed the full registration flow.

### Evidence from Investigation
| User | Local Record | Dr. Green API | Status |
|------|-------------|---------------|--------|
| Kayliegh (`kayliegh.sm@gmail.com`) | ✓ Exists | ✓ Found - VERIFIED | Working |
| Scott (`scott.k1@outlook.com`) | ✗ Missing | ✗ Not found (searched 6 clients) | Broken |

### API Logs Proof
```
Kayliegh: "Found existing Dr. Green client by email match { adminApproval: VERIFIED }"
Scott: "No Dr. Green client found matching email after multi-page search { totalClientsChecked: 6 }"
```

## Root Cause
Scott's Supabase auth account exists, but he **never completed the client registration flow** with Dr. Green. The auto-discovery correctly found no profile to link.

## Solution Options

### Option A: Scott Completes Registration (Recommended)
1. Scott navigates to `/shop/register`
2. Fills out medical questionnaire and shipping details
3. System creates Dr. Green client via API
4. KYC link is generated and shown
5. Scott completes KYC verification
6. Admin approves in Dr. Green portal
7. Status syncs to "Verified"

### Option B: Manual Admin Intervention
If Scott already has a Dr. Green profile under a **different email**:
1. Find Scott's actual email in Dr. Green admin portal
2. Either update Dr. Green profile email to `scott.k1@outlook.com`
3. OR have Scott sign in with the matching email

## Implementation: Improve Clarity for Users

### 1. Dashboard Status Page Enhancement
Show explicit messaging when no profile exists:

```typescript
// In DashboardStatus.tsx - add clearer messaging
if (!hasClient) {
  return (
    <Alert variant="warning">
      <AlertTitle>No Medical Profile Found</AlertTitle>
      <AlertDescription>
        We couldn't find a registered profile for your email address.
        You need to complete registration to access the dispensary.
      </AlertDescription>
      <Button asChild>
        <Link to="/shop/register">Complete Registration</Link>
      </Button>
    </Alert>
  );
}
```

### 2. Automatic Redirect for Unregistered Users
When a user with no Dr. Green profile accesses `/dashboard/status`, automatically redirect to registration:

```typescript
// Add useEffect to redirect unregistered users
useEffect(() => {
  if (!isLoading && !drGreenClient && isAuthenticated) {
    // Give user time to see message, then redirect
    const timer = setTimeout(() => {
      navigate('/shop/register', { replace: true });
    }, 3000);
    return () => clearTimeout(timer);
  }
}, [drGreenClient, isLoading, isAuthenticated, navigate]);
```

### 3. Improve Auto-Discovery Toast Messages
Make it crystal clear what the user needs to do:

```typescript
// In ShopContext.tsx linkClientFromDrGreenByAuthEmail
toast({
  title: 'No Profile Found',
  description: 'No medical profile exists for your email. Please complete registration.',
  action: <Button onClick={() => navigate('/shop/register')}>Register Now</Button>,
});
```

## Files to Modify

1. **`src/pages/DashboardStatus.tsx`**
   - Add explicit "No Profile" state with clear CTA
   - Auto-redirect unregistered users to `/shop/register`

2. **`src/context/ShopContext.tsx`**
   - Improve toast message clarity for missing profiles
   - Add navigation action to registration

3. **`src/components/shop/EligibilityGate.tsx`** (if exists)
   - Ensure consistent messaging for unregistered users

## Expected Outcome After Fix

### Scott's Flow:
1. Logs in → "No Profile Found" toast appears
2. Sees dashboard with clear "Complete Registration" button
3. Auto-redirects to `/shop/register` after 3 seconds
4. Completes registration → Client created in Dr. Green
5. KYC link shown → Completes verification
6. Admin approves → Status syncs to VERIFIED

### Kayliegh's Flow (Already Working):
1. Logs in → "Profile Found! You are verified" toast
2. Redirected directly to `/shop`
3. Can browse and purchase

## Verification Test Plan

1. **Scott logs in**: Should see "No Profile Found" and redirect to registration
2. **Scott registers**: Should create Dr. Green client, get KYC link
3. **After KYC**: Manual refresh should show status update
4. **Kayliegh logs in**: Should auto-redirect to shop (verified)

## Technical Notes

- The current auto-discovery is working correctly
- The Dr. Green API lookup is functioning (finds Kayliegh)
- Scott genuinely has no profile in Dr. Green under his email
- No code bugs exist - this is a data/user-flow issue

