## Full Resolution: Dr. Green DApp API Authentication, NFT Admin vs Patient Architecture, and Client Listing Fix

---

### Status: Phase 1 Complete — Awaiting Browser Capture

**Completed:**
- ✅ Full API reference document created: `docs/DRGREEN-API-FULL-REFERENCE.md`
- ✅ All 50+ proxy actions mapped and documented
- ✅ Medical questionnaire (22 questions) with exact option values documented
- ✅ Two authentication systems (API Key + HMAC vs Wallet Session) fully documented
- ✅ NFT Admin vs Patient architecture documented
- ✅ All 5 environments and credential routing documented
- ✅ Proxy auth tests confirmed edge function correctly enforces Supabase auth
- ✅ Postman collection from user confirms Bearer token auth is supported

**Key Finding:** The Postman collection provided by the user uses `Authorization: Bearer {{bearer_token}}` — confirming the API supports session-based JWT auth (not just API key + HMAC). This strongly suggests the DApp issues a Bearer token after wallet verification.

---

### Immediate Next Step: Browser DevTools Capture

**You need to:**
1. Open `dapp.drgreennft.com` in Chrome/Firefox
2. Open DevTools (F12) → Network tab
3. Connect wallet `0x0b60d85fefcd9064a29f7df0f8cbc7901b9e6c84` and sign in
4. Navigate to the Clients list
5. In the Network tab, filter by `api.drgreennft.com`
6. Click on any successful request to `/dapp/clients`
7. Copy/screenshot:
   - Request URL
   - All Request Headers (especially `Authorization`, `x-auth-apikey`, `x-auth-signature`)
   - Response Status (should be 200)

**This single piece of data will tell us exactly which auth flow to implement.**

---

### Phase 2: Implementation (After Browser Capture)

Based on the Postman collection evidence, the most likely resolution is **Option B (Bearer Token)**:

1. Create `drgreen-dapp-session` edge function that:
   - Signs a SIWE message using stored wallet key
   - Authenticates with the DApp's auth endpoint
   - Receives a Bearer JWT
   - Caches it (with TTL)
2. Modify `drgreen-proxy` to use Bearer token for dApp admin actions
3. Test client listing with the new auth flow

**Alternative resolutions if Bearer token doesn't work:**
- **Option A:** Store the DApp's master API key pair as new secrets
- **Option C:** Add wallet address header to proxy requests

---

### Phase 3: Remaining Documentation

After auth is resolved:
- Update `docs/DRGREEN-API-FULL-REFERENCE.md` with confirmed auth headers
- Update `.agent/knowledge/API_INFRASTRUCTURE.md` with two-auth-system docs
- Mark all endpoints as working/not-working with the new auth flow

---

### Reference Documents

- `docs/DRGREEN-API-FULL-REFERENCE.md` — Complete API reference (NEW)
- `docs/DRGREEN-API-INTEGRATION.md` — Integration guide (existing)
- `docs/DRGREEN-API-SIGNING-KNOWLEDGE.md` — Signing knowledge (existing)
- `.agent/knowledge/API_INFRASTRUCTURE.md` — Infrastructure knowledge base (existing)
