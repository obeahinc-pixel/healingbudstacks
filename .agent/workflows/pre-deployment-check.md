---
description: Pre-deployment validation checklist
---

# Pre-Deployment Validation

Before every deployment to cPanel, follow these steps to ensure a successful deployment:

## 1. Check for Merge Conflicts
```powershell
# Search for merge conflict markers in source files
Get-ChildItem -Recurse -Include *.html,*.tsx,*.ts,*.jsx,*.js,*.css | 
    Select-String -Pattern "(<{7}|={7}|>{7})" | 
    Select-Object -ExpandProperty Path -Unique
```

**Expected Result:** No output (no conflicts found)

## 2. Verify Git Status
```powershell
git status
```

**Expected Result:** 
- No untracked files with conflicts
- Working tree clean or only intended changes

## 3. Build the Project
// turbo
```powershell
npm run build
```

**Expected Result:** 
- Build completes successfully
- `dist/` folder is created
- No errors in console

## 4. Preview Locally (Optional but Recommended)
```powershell
npm run preview
```

**Expected Result:**
- Dev server starts successfully
- Website displays correctly at localhost
- No console errors in browser

## 5. Commit and Push
```powershell
git add .
git commit -m "Your commit message"
git push origin main
```

**Expected Result:**
- Changes committed successfully
- Pushed to GitHub
- GitHub Actions workflow triggered

## 6. Monitor Deployment
1. Go to GitHub Actions: https://github.com/healingbuds/sun712/actions
2. Watch the deployment workflow
3. Verify all steps complete successfully

## 7. Verify Live Site
1. Visit https://healingbuds.pt
2. Check that content displays correctly
3. Open browser console (F12) - verify no errors
4. Test key functionality

## Common Issues

### Blank White Screen
**Cause:** Merge conflict markers in HTML files  
**Fix:** Run step 1 above, resolve conflicts, rebuild

### Build Fails
**Cause:** TypeScript errors, missing dependencies  
**Fix:** Check error messages, run `npm install`, fix TypeScript errors

### Deployment Fails
**Cause:** SSH key issues, incorrect secrets  
**Fix:** Verify GitHub secrets are set correctly (CPANEL_HOST, CPANEL_USER, CPANEL_SSH_KEY)

### Site Not Updating
**Cause:** Browser cache, deployment didn't complete  
**Fix:** Hard refresh (Ctrl+Shift+R), check GitHub Actions logs

## Emergency Rollback
If deployment causes issues:

```powershell
# Revert to previous commit
git revert HEAD
git push origin main
```

This will trigger a new deployment with the previous working version.
