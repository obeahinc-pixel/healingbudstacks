# Git Merge Conflict Prevention

## Issue Encountered
**Date:** 2025-12-09  
**Problem:** Git merge conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`) were left in `index.html`, causing the website to display a blank white screen after deployment.

## Root Cause
- Merge conflicts occurred during Git operations
- Conflict markers were not resolved before committing
- The build process completed successfully despite invalid HTML
- Deployment succeeded but the browser couldn't parse the malformed HTML

## Impact
- Website displayed blank white screen
- No errors in build process (silent failure)
- Required manual intervention to identify and fix

## Prevention Strategy

### 1. Pre-commit Hook
Add a Git pre-commit hook to detect merge conflict markers:

```bash
#!/bin/sh
# .git/hooks/pre-commit

# Check for merge conflict markers
if git diff --cached | grep -E '^[+].*(<{7}|={7}|>{7})'; then
    echo "ERROR: Merge conflict markers detected in staged files!"
    echo "Please resolve all conflicts before committing."
    exit 1
fi
```

### 2. GitHub Actions Build Validation
The deployment workflow already includes a build step that should catch these issues. However, we should add explicit validation:

```yaml
- name: Validate HTML
  run: |
    # Check for merge conflict markers in HTML files
    if grep -r "<<<<<<< HEAD\|=======\|>>>>>>>" --include="*.html" .; then
      echo "ERROR: Merge conflict markers found!"
      exit 1
    fi
```

### 3. .gitignore Best Practices
Ensure `.gitignore` is properly configured to avoid unnecessary conflicts:
- Already ignoring `node_modules/`, `.next/`, `out/`, `.env`, `.DS_Store`
- Consider adding: `dist/` to prevent committing build artifacts

### 4. Regular Checks
Before any deployment:
1. Run `git status` to check for unresolved conflicts
2. Search for conflict markers: `grep -r "<<<<<<< HEAD" .`
3. Verify build locally: `npm run build`
4. Test the built files: `npm run preview`

## Quick Fix Commands
If merge conflicts are detected:

```bash
# Find all files with conflict markers
grep -r "<<<<<<< HEAD" . --exclude-dir=node_modules --exclude-dir=.git

# After manually resolving conflicts
git add .
git commit -m "Resolve merge conflicts"
```

## Automated Detection Script
Create a script to check for conflicts before deployment:

```powershell
# check-conflicts.ps1
$conflicts = Get-ChildItem -Recurse -Include *.html,*.tsx,*.ts,*.jsx,*.js,*.css | 
    Select-String -Pattern "(<{7}|={7}|>{7})" | 
    Select-Object -ExpandProperty Path -Unique

if ($conflicts) {
    Write-Error "Merge conflict markers found in: $($conflicts -join ', ')"
    exit 1
}
Write-Host "No merge conflicts detected ✓"
```

## Lessons Learned
1. **Always verify after merges**: Visual inspection isn't enough
2. **Automate validation**: Use pre-commit hooks and CI/CD checks
3. **Test locally first**: Run `npm run build && npm run preview` before pushing
4. **Monitor deployments**: Check the live site after each deployment

## Related Files
- `index.html` - Main entry point (most critical)
- `.github/workflows/deploy.yml` - Deployment automation
- `.gitignore` - Files to exclude from version control
