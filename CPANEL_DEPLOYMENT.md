## Deploying Guardian Shield to cPanel

Use this guide to get the built site live on cPanel. It assumes you have access to File Manager (or SSH) and want the app at the root of your domain (`public_html`).

### Option A — Fast upload (use provided bundle)
1) In cPanel → File Manager → open `public_html`.
2) Upload `guardian-shield-cpanel.zip` from the repo root.
3) Extract it in `public_html`. You should end up with:
   - `public_html/index.html`
   - `public_html/assets/…`
   - `public_html/favicon.ico` and other static files
4) Create/verify `.htaccess` in `public_html` with:
   ```
   RewriteEngine On
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteRule ^ index.html [QSA,L]
   ```
5) Permissions: folders 755, files 644 (including `.htaccess`).
6) Test your domain and a deep link (e.g. `/dashboard`).

### Option B — Rebuild with your Supabase keys, then upload
1) Locally (or via SSH): `npm ci`
2) Create `.env` with:
   ```
   VITE_SUPABASE_URL=your-url
   VITE_SUPABASE_PUBLISHABLE_KEY=your-key
   ```
3) Build: `npm run build` (outputs to `dist/`).
4) Upload `dist/*` into `public_html` (overwrite existing files).
5) Add the same `.htaccess` from Option A and set permissions.
6) Test homepage and deep links.

### If .htaccess is blocked
- Use `guardian-shield-NO-HTACCESS.zip` instead and extract into a subfolder, e.g. `public_html/app/`.
- Access via `yourdomain.com/app/`.
- Or ask host to enable `mod_rewrite`.

### Quick checks after upload
- `public_html/index.html` exists.
- `public_html/assets/index-*.js` loads directly in browser.
- Routes like `/dashboard` load (otherwise check `.htaccess` or mod_rewrite).
- If 500 errors: temporarily rename `.htaccess` to test; check cPanel Error Logs.

### Notes
- This is a static Vite SPA; no server runtime needed.
- Only the two Vite env vars above are used at build time. If you change them, rebuild and re-upload `dist/`.

