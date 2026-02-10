

## Fix White Screen on cPanel Export + Admin Email Management Panel

This plan addresses two separate issues:

### Issue 1: White Screen on cPanel Deployment (Permanent Fix)

**Root Cause (from screenshot):**
The cPanel server is serving `.css` and `.js` files with MIME type `text/html` instead of their correct types. This happens because:

1. `vite.config.ts` has `base: "/"` (absolute paths) -- when deployed to cPanel, the server cannot resolve `/assets/index-xxx.css` and falls through to the SPA rewrite rule, which returns `index.html` for everything (including CSS/JS files).
2. The `.htaccess` SPA rewrite catches asset requests because the files may not exist at the expected absolute paths, or cPanel/LiteSpeed doesn't serve the correct MIME types.

**Fix (3 changes):**

1. **`vite.config.ts`** -- Change `base: "/"` to `base: "./"` so all asset references use relative paths (`./assets/...` instead of `/assets/...`). This ensures the browser resolves assets relative to `index.html` regardless of deployment location.

2. **`public/.htaccess`** -- Add explicit MIME type declarations BEFORE the rewrite rules, and add asset file extension exclusions to the rewrite condition. This ensures `.css`, `.js`, `.woff2`, etc. are never caught by the SPA fallback:

```text
# Force correct MIME types (prevents text/html for assets)
AddType text/css .css
AddType application/javascript .js .mjs
AddType application/json .json
AddType image/svg+xml .svg
AddType font/woff2 .woff2
AddType font/woff .woff

# SPA rewrite -- skip files with known extensions
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !\.(css|js|mjs|json|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|map|webp|mp4)$
RewriteRule ^ index.html [QSA,L]
```

3. **`index.html`** -- Remove the Geist font CSS reference (`/fonts/geist.css`) since cPanel may not serve it correctly, and load it inline or via a CDN fallback.

---

### Issue 2: Admin Email Management Panel

**What:** A new admin page at `/admin/emails` with three tabs:

**Tab 1: Email Log (View All Sent Emails)**
- Database table `email_logs` to record every email sent
- Columns: id, recipient, subject, email_type, status (sent/failed), error_message, sent_at, template_used, metadata
- All 6 edge functions updated to log sends to this table
- Table view with search, filter by type, filter by status, date range
- Click row to see full HTML preview in a dialog
- "Resend" button per row to re-trigger the same email

**Tab 2: Email Templates**
- Database table `email_templates` to store custom templates
- Columns: id, name, slug, subject, html_body, variables (jsonb), is_active, created_at, updated_at
- Pre-seed with the 6 existing template types (welcome, kyc-link, kyc-approved, kyc-rejected, eligibility-approved, eligibility-rejected)
- Template editor with:
  - Name, subject line, HTML body (textarea with monospace font)
  - Variable placeholders shown (e.g. `{{firstName}}`, `{{kycLink}}`)
  - "Load Default" button to reset to built-in template
  - "Preview" button to render HTML in an iframe
  - Save/Update functionality

**Tab 3: Send Test Email**
- Enhance existing `AdminEmailTrigger` component
- Add "Send Test" option that sends to a manually entered email address (not just existing clients)

---

### Technical Details

#### Database Changes (2 new tables):

```sql
-- Email send log
CREATE TABLE public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  email_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT,
  html_body TEXT,
  metadata JSONB DEFAULT '{}',
  template_slug TEXT,
  sent_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Email templates
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: admin-only access for both tables
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
-- Policies using the existing admin role check pattern
```

#### Files to Create:
1. `src/pages/AdminEmails.tsx` -- Main admin email page with 3 tabs
2. `src/components/admin/EmailLogViewer.tsx` -- Email log table with search, filters, resend, preview
3. `src/components/admin/EmailTemplateEditor.tsx` -- Template CRUD with HTML preview

#### Files to Modify:
1. `vite.config.ts` -- Change `base: "/"` to `base: "./"`
2. `public/.htaccess` -- Add MIME types and asset exclusion in rewrite rules
3. `index.html` -- Fix geist.css reference
4. `src/App.tsx` -- Add `/admin/emails` route
5. `src/layout/AdminLayout.tsx` -- Add "Emails" nav item with Mail icon
6. `supabase/functions/send-client-email/index.ts` -- Log sends to `email_logs` table
7. `supabase/functions/send-contact-email/index.ts` -- Log sends to `email_logs` table
8. `supabase/functions/send-onboarding-email/index.ts` -- Log sends to `email_logs` table
9. `supabase/functions/send-order-confirmation/index.ts` -- Log sends to `email_logs` table
10. `supabase/functions/send-dispatch-email/index.ts` -- Log sends to `email_logs` table
11. `supabase/functions/drgreen-webhook/index.ts` -- Log sends to `email_logs` table

