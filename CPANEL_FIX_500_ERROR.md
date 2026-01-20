# Fix 500 Internal Server Error on cPanel

## 🔴 Common Causes of 500 Error

1. **.htaccess syntax error** - Most common cause
2. **mod_rewrite not enabled** - Apache module missing
3. **File permissions** - Incorrect permissions
4. **Missing files** - Files not uploaded correctly

## ✅ Solution Steps

### Step 1: Try Minimal .htaccess

If you're getting 500 error, replace your `.htaccess` with the minimal version:

**Option A - Simplest (Recommended first):**
```
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QSA,L]
```

**Option B - If Option A doesn't work:**
```
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QSA,L]
```

### Step 2: Check File Structure

Your `public_html` should have this structure:
```
public_html/
├── index.html
├── assets/
│   ├── index-*.js
│   └── index-*.css
├── favicon.ico
├── .htaccess
└── (other static files)
```

### Step 3: Verify File Permissions

Set these permissions in cPanel File Manager:
- **Files**: 644
- **Folders**: 755
- **.htaccess**: 644

### Step 4: Test Without .htaccess

1. **Rename `.htaccess` to `.htaccess-backup`**
2. **Test if the site loads** (you'll get 404 on routes, but homepage should work)
3. If homepage works, the issue is with `.htaccess`

### Step 5: Check Error Logs

1. Go to **cPanel → Error Logs**
2. Look for the exact error message
3. Common errors:
   - `mod_rewrite not enabled` - Contact hosting support
   - `Invalid rewrite rule` - Use minimal .htaccess
   - `Permission denied` - Fix file permissions

### Step 6: Alternative Solutions

#### If .htaccess doesn't work at all:

**Option 1: Use subdirectory**
- Upload files to `public_html/app/`
- Access via `yoursite.com/app/`
- Update vite.config.ts base path to `/app/`

**Option 2: Contact Hosting Support**
- Ask them to enable `mod_rewrite`
- Ask them to check Apache error logs
- Provide them the .htaccess file

## 🛠️ Quick Fix Commands (via cPanel Terminal)

If you have SSH access:

```bash
# Check if mod_rewrite is enabled
apache2ctl -M | grep rewrite

# Check .htaccess syntax
apache2ctl configtest

# Fix permissions
find . -type f -exec chmod 644 {} \;
find . -type d -exec chmod 755 {} \;
```

## 📋 Deployment Checklist

- [ ] All files from `dist` folder uploaded to `public_html`
- [ ] `.htaccess` file uploaded to `public_html` root
- [ ] File permissions set correctly (644/755)
- [ ] `index.html` is in the root of `public_html`
- [ ] `assets` folder exists with JS and CSS files
- [ ] Test homepage loads (even if routes don't work)
- [ ] Check cPanel error logs for specific errors

## 🔍 Debugging Steps

1. **Test homepage**: `yoursite.com` - Should load
2. **Test direct file**: `yoursite.com/assets/index-*.js` - Should download
3. **Test route**: `yoursite.com/dashboard` - Should load (if .htaccess works)
4. **Check browser console** - Look for 404 errors on assets

## 💡 Most Likely Fix

**Try this minimal .htaccess first:**
```
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QSA,L]
```

If that doesn't work, your hosting might not support `.htaccess` or `mod_rewrite` is disabled.

---
Last updated: 20th January 2025


