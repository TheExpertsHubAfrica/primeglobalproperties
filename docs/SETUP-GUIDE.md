# Prime Global Properties - Admin Panel Setup Guide

## 📋 Table of Contents
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Google Sheets Setup](#google-sheets-setup)
- [Google Apps Script Deployment](#google-apps-script-deployment)
- [Admin Panel Configuration](#admin-panel-configuration)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Overview

The Prime Global Properties Admin Panel is a comprehensive property management system that allows administrators to:
- Add, edit, hide, and delete house listings
- Add, edit, hide, and delete land plot listings
- Feature properties on the homepage
- Receive email notifications for all admin activities
- Manage listings dynamically without touching code

---

## Prerequisites

Before you begin, ensure you have:

1. ✅ **Google Account** - For Google Sheets and Apps Script
2. ✅ **Gmail Access** - For sending automated emails
3. ✅ **Website Hosting** - Where the admin panel will be hosted
4. ✅ **FTP/File Access** - To upload files to your web server
5. ✅ **Basic Understanding** - Of web hosting and file management

---

## Google Sheets Setup

### Step 1: Create a New Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new blank spreadsheet
3. Name it: **"Prime Global Properties - Listings Database"**

### Step 2: Get Your Spreadsheet ID

1. Look at the URL of your spreadsheet:
   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit
   ```
2. Copy the `SPREADSHEET_ID_HERE` part
3. Save this ID - you'll need it in the next step

### Step 3: Set Permissions

1. Click the **Share** button (top right)
2. Under "General access", select **"Restricted"**
3. Only you (and authorized admins) should have access

---

## Google Apps Script Deployment

### Step 1: Open Apps Script Editor

1. In your Google Sheet, go to **Extensions** → **Apps Script**
2. Delete any default code in the editor
3. Copy the entire contents of `gas/property-management.gs`
4. Paste it into the Apps Script editor

### Step 2: Configure Settings

Find these lines at the top of the script and update them:

```javascript
const CONFIG = {
  SPREADSHEET_ID: 'PASTE_YOUR_SPREADSHEET_ID_HERE',
  ADMIN_EMAIL: 'your-admin-email@example.com',
  
  // Change these credentials for security
  ADMIN_USERNAME: 'admin',
  ADMIN_PASSWORD: 'YourSecurePassword123!',
};
```

**Important Security Notes:**
- ⚠️ Change the default username and password immediately
- ⚠️ Use a strong password with letters, numbers, and symbols
- ⚠️ Never share these credentials publicly

### Step 3: Authorize External Requests

Before deployment, you need to authorize the script to send emails and make API calls:

1. In Apps Script editor, select the function dropdown at the top
2. Select **`authorizeExternalRequests`**
3. Click the **Run** button (▶️)
4. A permission dialog will appear - click **Review permissions**
5. Select your Google account
6. Click **Advanced** → **Go to [Project Name] (unsafe)**
7. Click **Allow**

### Step 4: Deploy as Web App

1. Click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Select **Web app**
4. Configure the deployment:
   - **Description**: "Property Management API v1"
   - **Execute as**: Me (your email)
   - **Who has access**: Anyone
5. Click **Deploy**
6. **Copy the Web App URL** - It will look like:
   ```
   https://script.google.com/macros/s/AKfycbz.../exec
   ```
7. Save this URL securely

### Step 5: Test the Deployment

1. Open the Web App URL in a new browser tab
2. You should see:
   ```json
   {"status":"success","message":"Property Management API is running"}
   ```
3. If you see this, your backend is working! ✅

---

## Admin Panel Configuration

### Step 1: Update JavaScript Configuration

Open `js/admin-panel.js` and find this line:

```javascript
const CONFIG = {
  SCRIPT_URL: 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE',
};
```

Replace it with your actual Web App URL:

```javascript
const CONFIG = {
  SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbz.../exec',
};
```

### Step 2: Update Properties Loader Configuration

Open `js/properties-loader.js` and find:

```javascript
const PROPERTIES_CONFIG = {
  SCRIPT_URL: 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE',
};
```

Replace with the same Web App URL:

```javascript
const PROPERTIES_CONFIG = {
  SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbz.../exec',
};
```

### Step 3: Upload Files to Your Server

Upload these files to your web server:

```
primeglobalproperties/
├── admin-panel.html          → Upload to root
├── properties.html           → Upload to root (already there)
├── index.html               → Upload to root (already there)
├── css/
│   └── admin-panel.css      → Upload to css folder
├── js/
│   ├── admin-panel.js       → Upload to js folder
│   └── properties-loader.js → Upload to js folder
└── gas/
    └── property-management.gs → (Already in Google Apps Script)
```

---

## Testing

### Test 1: Admin Login

1. Navigate to `https://yourwebsite.com/admin-panel.html`
2. Enter your username and password
3. Click **Login**
4. You should:
   - Be logged into the dashboard ✅
   - Receive a login confirmation email ✅

### Test 2: Add a House Listing

1. Click **"+ Add New House"**
2. Fill in the form:
   - Title: "Test House"
   - Location: "Accra"
   - Price: 500000
   - Bedrooms: 3
   - Bathrooms: 2
   - Images: `images/test.jpg` (one per line)
3. Click **Add Listing**
4. Check:
   - Listing appears in dashboard ✅
   - Email notification received ✅
   - Google Sheet has new row ✅

### Test 3: Add a Land Plot

1. Click **"+ Add New Land Plot"**
2. Fill in the form:
   - Title: "Test Land"
   - Location: "Tema"
   - Price: 50000
   - Plot Size: "60 x 100"
   - Image: `images/land-test.jpg`
3. Click **Add Listing**
4. Check as above ✅

### Test 4: Public Website Display

1. Navigate to `https://yourwebsite.com/properties.html`
2. Wait for properties to load (skeleton should appear first)
3. Your test listings should appear ✅
4. Check that carousels work for houses with multiple images ✅

### Test 5: Hide/Show Functionality

1. In admin panel, click **Hide** on a listing
2. Check that:
   - Listing shows "Hidden" badge in admin panel ✅
   - Listing does NOT appear on public website ✅
3. Click **Show** to make it visible again ✅

### Test 6: Delete Functionality

1. Click **Delete** on your test listing
2. Confirm the deletion
3. Check that:
   - Listing removed from admin panel ✅
   - Listing removed from Google Sheet ✅
   - Listing removed from public website ✅

---

## Troubleshooting

### Problem: "Script URL not configured" warning

**Solution:**
- Update `CONFIG.SCRIPT_URL` in both `admin-panel.js` and `properties-loader.js`
- Make sure you're using the Web App URL, not the Apps Script editor URL

---

### Problem: Login fails with "Invalid credentials"

**Possible causes:**
1. Username/password mismatch
2. Apps Script not deployed correctly

**Solution:**
- Double-check credentials in `property-management.gs`
- Verify Apps Script is deployed as "Web app" with "Anyone" access
- Redeploy if necessary

---

### Problem: "Connection error" when logging in

**Possible causes:**
1. CORS issues
2. Wrong Script URL
3. Apps Script not authorized

**Solution:**
1. Run `authorizeExternalRequests()` function in Apps Script
2. Verify Web App URL is correct
3. Check browser console for specific error messages

---

### Problem: No email notifications received

**Possible causes:**
1. Gmail not authorized
2. Wrong email address in config
3. Emails going to spam

**Solution:**
1. Run authorization function again
2. Update `ADMIN_EMAIL` in `property-management.gs`
3. Check spam folder
4. Add your Apps Script email to contacts

---

### Problem: Listings not appearing on website

**Possible causes:**
1. JavaScript errors
2. Wrong Script URL
3. Listings are hidden

**Solution:**
1. Open browser console (F12) and check for errors
2. Verify `properties-loader.js` has correct Script URL
3. Check admin panel - make sure listings are visible (not hidden)
4. Clear browser cache

---

### Problem: Images not loading

**Possible causes:**
1. Wrong image URLs
2. Images not uploaded to server
3. Incorrect file paths

**Solution:**
1. Upload images to your server first
2. Use correct paths relative to your website root
3. Test image URLs directly in browser
4. Check file permissions on server

---

### Problem: Skeleton loader shows forever

**Possible causes:**
1. API request failing
2. JavaScript error
3. No internet connection

**Solution:**
1. Check browser console for errors
2. Test Script URL directly in browser
3. Verify Google Sheet permissions
4. Check if Apps Script deployment is active

---

### Problem: Changes in Apps Script not reflected

**Solution:**
1. After editing `property-management.gs`, create a **New Deployment**
2. Click **Deploy** → **Manage deployments**
3. Click **Edit** (pencil icon) on current deployment
4. Change version to **New version**
5. Click **Deploy**
6. Update Script URL in JavaScript files if it changed

---

## Security Best Practices

1. ✅ **Change Default Credentials** - Never use default username/password
2. ✅ **Use HTTPS** - Always access admin panel over HTTPS
3. ✅ **Restrict Access** - Use .htaccess or server config to limit access
4. ✅ **Regular Backups** - Export Google Sheet regularly
5. ✅ **Monitor Emails** - Check login notifications for unauthorized access
6. ✅ **Update Regularly** - Keep your system updated

---

## Need Help?

If you encounter issues not covered here:

1. Check browser console for error messages
2. Check Google Apps Script logs (View → Logs)
3. Verify all configuration steps were completed
4. Test individual components separately
5. Contact your developer for advanced troubleshooting

---

## Next Steps

Once everything is working:

1. ✅ Delete test listings
2. ✅ Add your real property listings
3. ✅ Upload property images to server
4. ✅ Test on different browsers and devices
5. ✅ Share admin panel URL with authorized staff
6. ✅ Set up regular backups of your Google Sheet

---

**Congratulations! Your Admin Panel is now live! 🎉**

For more information, see:
- [API Documentation](./API-DOCUMENTATION.md)
- [Admin User Manual](./ADMIN-USER-MANUAL.md)
