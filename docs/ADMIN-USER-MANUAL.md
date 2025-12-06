# Prime Global Properties - Admin User Manual

## 📘 Welcome to the Admin Panel

This manual will guide you through using the Prime Global Properties Admin Panel to manage your property listings effectively.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Logging In](#logging-in)
3. [Dashboard Overview](#dashboard-overview)
4. [Managing House Listings](#managing-house-listings)
5. [Managing Land Listings](#managing-land-listings)
6. [Best Practices](#best-practices)
7. [Tips & Tricks](#tips--tricks)
8. [FAQ](#faq)

---

## Getting Started

### Accessing the Admin Panel

1. Open your web browser (Chrome, Firefox, Safari, or Edge)
2. Navigate to: `https://yourwebsite.com/admin-panel.html`
3. Bookmark this page for easy access

### System Requirements

- Modern web browser (updated within the last year)
- Internet connection
- Admin username and password

---

## Logging In

### Step 1: Enter Credentials

1. Enter your **Username** in the first field
2. Enter your **Password** in the second field
3. Click **Login**

![Login Screen](https://via.placeholder.com/600x400?text=Login+Screen)

### Step 2: Login Confirmation

- Upon successful login, you'll be redirected to the dashboard
- You'll receive an email confirmation of your login
- **Important**: If you didn't attempt to login, contact your administrator immediately

### Logout

- Click the **Logout** button in the top-right corner
- You'll be returned to the login screen
- Your session will be cleared

---

## Dashboard Overview

### Navigation Tabs

The dashboard has two main tabs:

1. **Houses** - Manage residential property listings
2. **Land Plots** - Manage land plot listings

### Tab Badge Numbers

Each tab shows the total number of listings (including hidden ones):
- **Houses (5)** - You have 5 house listings
- **Land Plots (3)** - You have 3 land listings

### Dashboard Sections

Each tab contains:
- **Section Header** - Shows listing type and count
- **Add Button** - Green button to create new listings
- **Listings Grid** - Displays all your listings in cards
- **Action Buttons** - Edit, Hide/Show, Delete options

---

## Managing House Listings

### Adding a New House

#### Step 1: Open the Form

1. Click on the **Houses** tab
2. Click the **+ Add New House** button
3. A modal form will appear

#### Step 2: Fill in Basic Information

**Property Title** (Required)
- Enter a descriptive title
- Example: "4 Bedroom House - Community 26"
- Keep it concise but informative

**Location** (Required)
- Enter the area/neighborhood
- Example: "Tema" or "East Legon"

**Price** (Required)
- Enter the price in GHS
- Enter numbers only (no commas or currency symbols)
- Example: `950000` for GHS 950,000

#### Step 3: Enter Property Details

**Bedrooms** (Required)
- Number of bedrooms
- Example: `4`

**Bathrooms** (Required)
- Number of bathrooms
- Example: `3`

**Square Feet** (Optional)
- Total square footage
- Example: `2500`

**Description** (Optional)
- Brief description of the property
- Mention key features
- Example: "Spacious house with modern kitchen, all rooms en-suite"

#### Step 4: Add Images

**Important**: Upload images to your server FIRST, then add their URLs here.

1. Upload images to your website's `images` folder via FTP/File Manager
2. In the form, enter one image URL per line:
   ```
   images/properties/house1-exterior.jpg
   images/properties/house1-living-room.jpg
   images/properties/house1-kitchen.jpg
   images/properties/house1-bedroom.jpg
   ```
3. Recommended: 3-5 images per property
4. Use clear, high-quality images

**Image Guidelines**:
- ✅ Minimum 3 images per house
- ✅ First image should be the best exterior shot
- ✅ Include different areas (exterior, living room, kitchen, bedrooms)
- ✅ Use descriptive filenames
- ✅ Optimal size: 1200x800 pixels
- ❌ Don't use spaces in filenames
- ❌ Avoid special characters

#### Step 5: Featured Option

Check **"Feature on Homepage"** if you want this property prominently displayed on the homepage.

- Only feature your best or priority properties
- Recommended: 3-6 featured properties maximum

#### Step 6: Submit

1. Review all information
2. Click **Add Listing**
3. Wait for confirmation message
4. The modal will close automatically
5. Your new listing will appear in the grid

### Editing an Existing House

1. Find the listing you want to edit
2. Click the **Edit** button on the listing card
3. The edit form will open with current data pre-filled
4. Make your changes
5. Click **Save Changes**
6. Confirmation message will appear

**Note**: The original creation date is preserved, but an "Updated" timestamp is recorded.

### Hiding/Showing a House

**Why hide a listing?**
- Property is temporarily off-market
- Pending sale
- Under renovation
- Seasonal availability

**How to hide**:
1. Click the **Hide** button on the listing card
2. The listing immediately disappears from the public website
3. The listing remains in admin panel with a "Hidden" badge
4. You can still edit hidden listings

**How to show**:
1. Find the hidden listing (it has a yellow "Hidden" badge)
2. Click the **Show** button
3. The listing immediately appears on the public website

### Deleting a House

**⚠️ Warning**: Deletion is permanent and cannot be undone!

**When to delete**:
- Property is sold
- Listing was created by mistake
- Property is no longer available

**How to delete**:
1. Click the **Delete** button on the listing card
2. A confirmation dialog will appear
3. Click **OK** to confirm deletion
4. The listing is permanently removed from:
   - Admin panel
   - Public website
   - Google Sheet database

**Best Practice**: Consider hiding instead of deleting to preserve historical data.

---

## Managing Land Listings

Managing land listings is similar to houses, with some differences.

### Adding a New Land Plot

#### Form Fields

**Property Title** (Required)
- Example: "Plot at Tsopoli"

**Location** (Required)
- Example: "Tsopoli" or "Community 25, Tema"

**Price** (Required)
- Enter in GHS
- Example: `12500` for GHS 12,500

**Plot Size** (Required)
- Dimensions of the plot
- Example: "70 x 100" or "60 x 120"

**Total Area** (Optional)
- Area in square feet
- Example: `7000`

**Description** (Optional)
- Brief description
- Example: "Prime location near main road, suitable for residential development"

**Image URL** (Required)
- Unlike houses, land listings use a single image
- Upload image first, then enter URL
- Example: `images/land/tsopoli-plot.jpg`

**Featured Option**
- Check to feature on homepage

#### Submit the Form

1. Review all information
2. Click **Add Listing**
3. Wait for confirmation
4. New listing appears in grid

### Editing Land Plots

Same process as editing houses:
1. Click **Edit** button
2. Modify fields
3. Click **Save Changes**

### Hiding/Showing Land Plots

Same process as houses:
- **Hide**: Removes from public website
- **Show**: Makes visible on website

### Deleting Land Plots

Same process as houses:
- Click **Delete**
- Confirm deletion
- Permanent removal

---

## Best Practices

### Image Management

1. **Organize Your Images**
   ```
   images/
   ├── properties/
   │   ├── house1-exterior.jpg
   │   ├── house1-interior.jpg
   │   └── house2-living.jpg
   └── land/
       ├── tsopoli-plot1.jpg
       └── tema-plot2.jpg
   ```

2. **Image Optimization**
   - Resize images before uploading (1200x800 recommended)
   - Compress images to reduce file size
   - Use JPEG for photos (smaller file size)
   - Name files descriptively

3. **Image Quality**
   - Use natural lighting
   - Show multiple angles
   - Highlight key features
   - Ensure images are sharp and clear

### Listing Management

1. **Keep Information Updated**
   - Review listings monthly
   - Update prices as needed
   - Remove sold properties
   - Refresh images periodically

2. **Use Descriptive Titles**
   - ✅ Good: "4 Bedroom House - Community 26"
   - ✅ Good: "Luxury 5 Bed House - Trassaco Valley"
   - ❌ Poor: "House for Sale"
   - ❌ Poor: "Property 123"

3. **Write Compelling Descriptions**
   - Highlight unique features
   - Mention nearby amenities
   - Include document status (e.g., "Land Certificate")
   - Keep it concise (2-3 sentences)

4. **Featured Properties**
   - Feature your best properties
   - Rotate featured listings regularly
   - Don't feature too many at once
   - Update seasonal offerings

### Security

1. **Login Security**
   - Never share your password
   - Log out when finished
   - Don't save password on public computers
   - Check login notification emails

2. **Data Protection**
   - Regularly backup Google Sheet
   - Export data monthly
   - Keep records of all transactions

---

## Tips & Tricks

### Keyboard Shortcuts

- **Tab**: Move to next field in forms
- **Enter**: Submit forms (when focused on submit button)
- **Esc**: Close modals

### Bulk Operations

**To update multiple listings**:
1. Open Google Sheet directly
2. Make bulk changes
3. Refresh admin panel to see updates

**Caution**: Be careful with bulk edits in Google Sheet - errors can break the system.

### Image URL Tips

**Absolute URLs** (if images are on another server):
```
https://yourcdn.com/images/house1.jpg
```

**Relative URLs** (recommended for same server):
```
images/properties/house1.jpg
```

**Testing Images**:
- Before adding to listing, paste URL in browser
- If image loads in browser, it will work in listing

### Mobile Access

The admin panel works on mobile devices:
- Use landscape mode for better view
- Forms are touch-friendly
- All features available on mobile

### Troubleshooting Common Issues

**Issue**: Images not appearing
- **Solution**: Check image URLs are correct
- **Solution**: Verify images are uploaded to server
- **Solution**: Test URL directly in browser

**Issue**: Changes not showing on website
- **Solution**: Clear browser cache
- **Solution**: Wait a few minutes for cache to expire
- **Solution**: Check if listing is marked as "Visible"

**Issue**: Can't login
- **Solution**: Double-check username and password
- **Solution**: Check caps lock is off
- **Solution**: Contact administrator if credentials are forgotten

---

## FAQ

### Q: How many listings can I add?

**A**: There's no hard limit, but we recommend:
- Houses: 20-30 active listings
- Land: 20-30 active listings
- Use hiding feature for inactive listings rather than deleting

### Q: Can I have multiple admins?

**A**: Currently, the system supports one admin login. For multiple admins:
- Share credentials securely
- Monitor login notification emails
- Consider creating different credentials per admin (requires code modification)

### Q: How long does it take for changes to appear on the website?

**A**: Changes are immediate, but may take up to 5 minutes due to caching:
- Admin panel: Immediate
- Public website: Up to 5 minutes

### Q: What happens if I accidentally delete a listing?

**A**: Deletion is permanent. If you accidentally delete:
- You'll need to re-create the listing manually
- Check Google Sheet - sometimes you can recover data
- **Prevention**: Use "Hide" instead of "Delete" for temporary removals

### Q: Can I change the order of listings?

**A**: Currently, listings are displayed in the order they were added (newest first). Featured listings may appear first depending on website configuration.

### Q: How do I feature a property on the homepage?

**A**: When adding or editing a listing, check the "Feature on Homepage" box. Featured properties appear in prominent positions on the homepage.

### Q: Can I add videos to listings?

**A**: Currently, the system supports images only. For video tours:
- Host videos on YouTube/Vimeo
- Add video links to the description field
- Or contact your developer for video integration

### Q: What if I need to change my admin password?

**A**: Contact your system administrator or developer. The password is configured in the Google Apps Script code.

### Q: How do I export all listings?

**A**:
1. Open your Google Sheet
2. Go to File → Download → CSV or Excel
3. Save the file to your computer

### Q: Can I schedule listings to publish later?

**A**: Not currently. You can:
- Add listing but keep it hidden
- Manually show it when ready
- Or contact your developer for scheduling features

---

## Getting Help

### Resources

- **Setup Guide**: For technical configuration
- **API Documentation**: For developers
- **Google Sheet**: View raw data

### Support Contacts

If you need assistance:
1. Check this manual first
2. Review error messages carefully
3. Check browser console for errors
4. Contact your system administrator
5. Email your web developer with:
   - Description of the issue
   - Screenshots
   - Steps to reproduce
   - Browser and device information

---

## Appendix: Quick Reference Card

### Adding a House Listing

1. Click **Houses** tab
2. Click **+ Add New House**
3. Fill required fields: Title, Location, Price, Bedrooms, Bathrooms, Images
4. Click **Add Listing**

### Adding a Land Listing

1. Click **Land Plots** tab
2. Click **+ Add New Land Plot**
3. Fill required fields: Title, Location, Price, Plot Size, Image
4. Click **Add Listing**

### Editing a Listing

1. Find the listing
2. Click **Edit**
3. Modify fields
4. Click **Save Changes**

### Hiding a Listing

1. Find the listing
2. Click **Hide**
3. Listing disappears from public website

### Showing a Hidden Listing

1. Find the hidden listing (yellow badge)
2. Click **Show**
3. Listing reappears on website

### Deleting a Listing

1. Find the listing
2. Click **Delete**
3. Confirm deletion
4. ⚠️ **Cannot be undone**

---

**Thank you for using the Prime Global Properties Admin Panel!** 🏡

For updates and new features, check with your system administrator regularly.

*Last Updated: December 2025*
