# cPanel Deployment Instructions

## 📦 Files Included in Zip

- `dist/` - Built production files (ready to deploy)
- `.htaccess` - Apache configuration for React Router SPA support
- `package.json` - Project dependencies reference
- `README.md` - Project documentation

## 🚀 Deployment Steps

### Method 1: cPanel File Manager

1. **Extract the zip file** on your local computer
2. **Login to cPanel**
3. **Open File Manager**
4. **Navigate to your domain's public_html folder** (or subdomain folder)
5. **Upload all files from the `dist` folder** to the root of public_html
6. **Upload the `.htaccess` file** to the root of public_html
7. **Set permissions** (if needed):
   - Files: 644
   - Folders: 755

### Method 2: cPanel File Manager (Direct Upload)

1. **Login to cPanel**
2. **Open File Manager**
3. **Navigate to public_html**
4. **Upload the zip file**
5. **Right-click the zip file → Extract**
6. **Move contents of `dist` folder to root**
7. **Move `.htaccess` to root**
8. **Delete the zip and empty dist folder**

## ⚙️ Important Configuration

### Environment Variables

Make sure to set your Supabase environment variables in cPanel:

1. Go to **cPanel → Environment Variables** (or use `.env` file)
2. Add these variables:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
   ```

**Note:** Since this is a built production app, environment variables need to be set at build time. If you need to change them, rebuild the project with the new values.

### .htaccess Configuration

The included `.htaccess` file provides:
- ✅ React Router SPA support (all routes redirect to index.html)
- ✅ Gzip compression for better performance
- ✅ Browser caching for static assets

## 🔍 Verification

After deployment:
1. Visit your domain
2. Check browser console for any errors
3. Test navigation between pages
4. Verify API connections to Supabase

## 📝 Notes

- The `dist` folder contains the built production files
- All source code is compiled and minified
- No `node_modules` needed for production
- The app is ready to run as static files

## 🆘 Troubleshooting

**404 errors on page refresh:**
- Ensure `.htaccess` is uploaded and mod_rewrite is enabled

**API errors:**
- Check environment variables are set correctly
- Verify Supabase URL and keys

**Blank page:**
- Check browser console for errors
- Verify all files uploaded correctly
- Check file permissions

---
Last updated: 20th January 2025



