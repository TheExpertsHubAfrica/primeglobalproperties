# Prime Global Properties - API Documentation

## Overview

The Property Management API provides endpoints for managing property listings through Google Apps Script. All requests should be made to your deployed Web App URL.

**Base URL**: `https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec`

---

## Authentication

The API uses simple username/password authentication for admin operations. Public endpoints (viewing listings) do not require authentication.

### Admin Credentials

Configured in `property-management.gs`:

```javascript
CONFIG.ADMIN_USERNAME = 'admin'
CONFIG.ADMIN_PASSWORD = 'your_password'
```

---

## Endpoints

### 1. Login

Authenticate admin user and receive session token.

**Method**: `POST`

**Request Body**:
```json
{
  "action": "login",
  "username": "admin",
  "password": "your_password"
}
```

**Success Response**:
```json
{
  "status": "success",
  "message": "Login successful",
  "username": "admin",
  "token": "token-admin-1234567890"
}
```

**Error Response**:
```json
{
  "status": "error",
  "message": "Invalid username or password"
}
```

**Side Effects**:
- Sends login notification email to admin
- Logs login attempt

---

### 2. Get Listings (Admin)

Retrieve all listings including hidden ones. Used by admin panel.

**Method**: `POST`

**Request Body**:
```json
{
  "action": "getListings",
  "type": "houses"  // or "land" or "all"
}
```

**Success Response**:
```json
{
  "status": "success",
  "message": "Listings retrieved",
  "listings": [
    {
      "id": "PGP-1234567890-abc123",
      "type": "house",
      "created": "Dec 6, 2025, 10:30 AM",
      "updated": "Dec 6, 2025, 10:30 AM",
      "title": "4 Bedroom House - Community 26",
      "location": "Tema",
      "price": "950000",
      "bedrooms": "4",
      "bathrooms": "3",
      "sqft": "2500",
      "description": "Beautiful house...",
      "images": "images/house1.jpg\nimages/house2.jpg",
      "featured": "Yes",
      "visible": "Yes"
    }
  ]
}
```

---

### 3. Get Public Listings

Retrieve only visible listings for public website display.

**Method**: `GET`

**Query Parameters**:
- `action=getPublicListings`
- `type=houses` | `land` | `all`

**Example URL**:
```
https://script.google.com/macros/s/YOUR_ID/exec?action=getPublicListings&type=all
```

**Success Response**:
```json
{
  "status": "success",
  "message": "Public listings retrieved",
  "houses": [
    {
      "id": "PGP-1234567890-abc123",
      "title": "4 Bedroom House",
      "location": "Tema",
      "price": "950000",
      "bedrooms": "4",
      "bathrooms": "3",
      "sqft": "2500",
      "description": "...",
      "images": "images/house1.jpg\nimages/house2.jpg",
      "featured": "Yes",
      "visible": "Yes"
    }
  ],
  "land": [
    {
      "id": "PGP-1234567891-def456",
      "title": "Plot at Tsopoli",
      "location": "Tsopoli",
      "price": "12500",
      "plotsize": "70 x 100",
      "area": "7000",
      "description": "...",
      "image": "images/land1.jpg",
      "featured": "No",
      "visible": "Yes"
    }
  ]
}
```

---

### 4. Add Listing

Create a new property listing.

**Method**: `POST`

**Request Body (House)**:
```json
{
  "action": "addListing",
  "listingType": "house",
  "listingData": {
    "title": "5 Bedroom House - Trassaco",
    "location": "Trassaco",
    "price": 700000,
    "bedrooms": 5,
    "bathrooms": 4,
    "sqft": 3500,
    "description": "Luxury house with modern amenities",
    "images": "images/house1.jpg\nimages/house2.jpg\nimages/house3.jpg",
    "featured": true
  }
}
```

**Request Body (Land)**:
```json
{
  "action": "addListing",
  "listingType": "land",
  "listingData": {
    "title": "Plot at Tsopoli",
    "location": "Tsopoli",
    "price": 12500,
    "plotSize": "70 x 100",
    "area": 7000,
    "description": "Prime location near main road",
    "image": "images/land1.jpg",
    "featured": false
  }
}
```

**Success Response**:
```json
{
  "status": "success",
  "message": "Listing added successfully",
  "id": "PGP-1234567890-abc123"
}
```

**Side Effects**:
- Creates new row in Google Sheet
- Sends notification email to admin
- Auto-generates unique ID
- Sets default visibility to "Yes"

---

### 5. Update Listing

Modify an existing property listing.

**Method**: `POST`

**Request Body**:
```json
{
  "action": "updateListing",
  "listingType": "house",
  "listingId": "PGP-1234567890-abc123",
  "listingData": {
    "title": "5 Bedroom House - Updated",
    "location": "Trassaco",
    "price": 650000,
    "bedrooms": 5,
    "bathrooms": 4,
    "sqft": 3500,
    "description": "Updated description",
    "images": "images/house1.jpg\nimages/house2.jpg",
    "featured": true
  }
}
```

**Success Response**:
```json
{
  "status": "success",
  "message": "Listing updated successfully"
}
```

**Error Response**:
```json
{
  "status": "error",
  "message": "Listing not found"
}
```

**Side Effects**:
- Updates corresponding row in Google Sheet
- Sends notification email to admin
- Updates "Updated" timestamp

---

### 6. Toggle Visibility

Show or hide a listing on the public website.

**Method**: `POST`

**Request Body**:
```json
{
  "action": "toggleVisibility",
  "listingType": "house",
  "listingId": "PGP-1234567890-abc123"
}
```

**Success Response**:
```json
{
  "status": "success",
  "message": "Visibility toggled",
  "visible": true  // or false
}
```

**Side Effects**:
- Updates "Visible" column in Google Sheet
- Immediately affects public website display

---

### 7. Delete Listing

Permanently remove a property listing.

**Method**: `POST`

**Request Body**:
```json
{
  "action": "deleteListing",
  "listingType": "house",
  "listingId": "PGP-1234567890-abc123"
}
```

**Success Response**:
```json
{
  "status": "success",
  "message": "Listing deleted successfully"
}
```

**Error Response**:
```json
{
  "status": "error",
  "message": "Listing not found"
}
```

**Warning**: This action is irreversible. The row is permanently deleted from Google Sheet.

---

## Data Models

### House Listing Object

```javascript
{
  id: String,           // Unique ID (auto-generated)
  created: String,      // Timestamp (auto-generated)
  updated: String,      // Timestamp (auto-generated)
  title: String,        // Required
  location: String,     // Required
  price: Number,        // Required (in GHS)
  bedrooms: Number,     // Required
  bathrooms: Number,    // Required
  sqft: Number,         // Optional
  description: String,  // Optional
  images: String,       // Required (newline-separated URLs)
  featured: Boolean,    // Default: false
  visible: String       // "Yes" or "No" (default: "Yes")
}
```

### Land Listing Object

```javascript
{
  id: String,           // Unique ID (auto-generated)
  created: String,      // Timestamp (auto-generated)
  updated: String,      // Timestamp (auto-generated)
  title: String,        // Required
  location: String,     // Required
  price: Number,        // Required (in GHS)
  plotSize: String,     // Required (e.g., "70 x 100")
  area: Number,         // Optional (in sq ft)
  description: String,  // Optional
  image: String,        // Required (single URL)
  featured: Boolean,    // Default: false
  visible: String       // "Yes" or "No" (default: "Yes")
}
```

---

## Google Sheets Structure

### Houses Sheet

| Column | Type | Description |
|--------|------|-------------|
| ID | String | Unique identifier |
| Created | String | Creation timestamp |
| Updated | String | Last update timestamp |
| Title | String | Property title |
| Location | String | Property location |
| Price | Number | Price in GHS |
| Bedrooms | Number | Number of bedrooms |
| Bathrooms | Number | Number of bathrooms |
| SqFt | Number | Square footage |
| Description | String | Property description |
| Images | String | Newline-separated image URLs |
| Featured | String | "Yes" or "No" |
| Visible | String | "Yes" or "No" |

### Land Sheet

| Column | Type | Description |
|--------|------|-------------|
| ID | String | Unique identifier |
| Created | String | Creation timestamp |
| Updated | String | Last update timestamp |
| Title | String | Land title |
| Location | String | Land location |
| Price | Number | Price in GHS |
| Plot Size | String | Dimensions (e.g., "70 x 100") |
| Area | Number | Total area in sq ft |
| Description | String | Land description |
| Image | String | Single image URL |
| Featured | String | "Yes" or "No" |
| Visible | String | "Yes" or "No" |

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "status": "error",
  "message": "Description of the error"
}
```

### Common Error Messages

| Message | Cause | Solution |
|---------|-------|----------|
| "Invalid action" | Unknown action parameter | Check action name spelling |
| "Missing required fields" | Incomplete request data | Include all required fields |
| "Listing not found" | Invalid listing ID | Verify ID exists in sheet |
| "Server error: ..." | Apps Script exception | Check Apps Script logs |
| "Invalid username or password" | Wrong credentials | Check CONFIG settings |

---

## Rate Limiting

Google Apps Script has the following quotas:

- **URL Fetch calls**: 20,000 per day
- **Script runtime**: 6 minutes per execution
- **Email sends**: 100 per day (Gmail)

For high-traffic websites, consider implementing caching on the frontend.

---

## Caching Strategy

The `properties-loader.js` implements local caching:

```javascript
CACHE_DURATION: 5 * 60 * 1000  // 5 minutes
```

Benefits:
- Reduces API calls
- Faster page loads
- Works offline temporarily
- Reduces quota usage

---

## Security Considerations

1. **Authentication**: Only admin operations require authentication
2. **Public Access**: Read-only endpoints are publicly accessible
3. **HTTPS**: Always use HTTPS for admin panel
4. **Credentials**: Never expose admin credentials in client-side code
5. **Email Notifications**: Monitor for suspicious login attempts

---

## Email Notifications

### Login Notification

Sent to: `CONFIG.ADMIN_EMAIL`

Triggered by: Successful admin login

Contains:
- Username
- Login timestamp
- Security warning

### Listing Change Notification

Sent to: `CONFIG.ADMIN_EMAIL`

Triggered by: Add, update, or delete operations

Contains:
- Action performed (added/updated/deleted)
- Listing type (house/land)
- Listing details
- Timestamp

---

## Testing the API

### Using cURL

**Login**:
```bash
curl -X POST 'YOUR_SCRIPT_URL' \
  -H 'Content-Type: application/json' \
  -d '{"action":"login","username":"admin","password":"your_password"}'
```

**Get Public Listings**:
```bash
curl 'YOUR_SCRIPT_URL?action=getPublicListings&type=all'
```

**Add Listing**:
```bash
curl -X POST 'YOUR_SCRIPT_URL' \
  -H 'Content-Type: application/json' \
  -d '{"action":"addListing","listingType":"house","listingData":{"title":"Test House","location":"Accra","price":500000,"bedrooms":3,"bathrooms":2,"images":"images/test.jpg","featured":false}}'
```

### Using Browser Console

```javascript
// Get public listings
fetch('YOUR_SCRIPT_URL?action=getPublicListings&type=all')
  .then(res => res.json())
  .then(data => console.log(data));

// Login
fetch('YOUR_SCRIPT_URL', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'login',
    username: 'admin',
    password: 'your_password'
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

---

## Logs and Debugging

### View Apps Script Logs

1. Open Apps Script editor
2. Go to **Executions** (left sidebar)
3. Click on any execution to see logs
4. Use `Logger.log()` for debugging

### Browser Console

- Open Developer Tools (F12)
- Check Console tab for JavaScript errors
- Check Network tab for API requests/responses

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Dec 2025 | Initial release |

---

## Support

For API issues:
1. Check Apps Script logs
2. Verify configuration settings
3. Test endpoints individually
4. Review error messages
5. Consult setup guide

---

## Related Documentation

- [Setup Guide](./SETUP-GUIDE.md) - Initial setup instructions
- [Admin User Manual](./ADMIN-USER-MANUAL.md) - How to use the admin panel
