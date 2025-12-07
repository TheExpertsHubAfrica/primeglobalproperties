/**
 * Property Management System for Prime Global Properties
 * Handles authentication, CRUD operations, and email notifications
 */

// Configuration
const CONFIG = {
  SPREADSHEET_ID: '1sFVDIer6YdMAs9z45CBzbcoCWOC81v1WFhhjC0CrlaE',
  HOUSES_SHEET: 'Houses',
  LAND_SHEET: 'Land',
  ADMIN_EMAIL: 'deforexsp@gmail.com',
  
  // Admin credentials (in production, use more secure storage)
  ADMIN_USERNAME: 'admin',
  ADMIN_PASSWORD: 'PrimeGlobal2025!',
  
  // Image storage
  IMAGES_FOLDER_NAME: 'Prime Properties Images',
  
  // Brand colors
  BRAND_COLOR: '#F96D00',
  SECONDARY_COLOR: '#232526'
};

/**
 * Handle POST requests from the admin panel
 */
function doPost(e) {
  try {
    let data;
    
    // Parse incoming data - support both JSON and form-encoded
    if (e.postData && e.postData.type === 'application/json') {
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      // Handle form data or URL parameters
      data = e.parameter;
      
      // Parse nested JSON fields if they exist
      if (data.listingData && typeof data.listingData === 'string') {
        try {
          data.listingData = JSON.parse(data.listingData);
        } catch (err) {
          Logger.log('Failed to parse listingData: ' + err);
        }
      }
    } else if (e.postData && e.postData.contents) {
      // Try parsing as form data
      data = parseFormData(e.postData.contents);
    }
    
    Logger.log('Received request: ' + (data ? data.action : 'unknown'));
    
    if (!data || !data.action) {
      return createResponse(false, 'No action specified');
    }
    
    // Route to appropriate handler
    switch(data.action) {
      case 'login':
        return handleLogin(data);
      case 'getListings':
        return getListings(data.type);
      case 'addListing':
        return addListing(data);
      case 'updateListing':
        return updateListing(data);
      case 'toggleVisibility':
        return toggleVisibility(data);
      case 'deleteListing':
        return deleteListing(data);
      case 'uploadImage':
        return handleImageUpload(data);
      default:
        return createResponse(false, 'Invalid action: ' + data.action);
    }
    
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return createResponse(false, 'Server error: ' + error.message);
  }
}

/**
 * Parse form data from POST body
 */
function parseFormData(contents) {
  const data = {};
  const pairs = contents.split('&');
  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i].split('=');
    const key = decodeURIComponent(pair[0]);
    const value = decodeURIComponent(pair[1] || '');
    data[key] = value;
  }
  return data;
}

/**
 * Handle GET requests (for public listing display)
 */
function doGet(e) {
  try {
    const action = e.parameter.action || 'getPublicListings';
    
    if (action === 'getPublicListings') {
      const type = e.parameter.type || 'all';
      return getPublicListings(type);
    }
    
    if (action === 'debug') {
      // Debug endpoint to check sheet contents
      const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
      const housesSheet = spreadsheet.getSheetByName(CONFIG.HOUSES_SHEET);
      const landSheet = spreadsheet.getSheetByName(CONFIG.LAND_SHEET);
      
      return createResponse(true, 'Debug info', {
        spreadsheetName: spreadsheet.getName(),
        spreadsheetUrl: spreadsheet.getUrl(),
        housesExists: !!housesSheet,
        housesRows: housesSheet ? housesSheet.getLastRow() : 0,
        landExists: !!landSheet,
        landRows: landSheet ? landSheet.getLastRow() : 0,
        config: {
          spreadsheetId: CONFIG.SPREADSHEET_ID,
          adminEmail: CONFIG.ADMIN_EMAIL
        }
      });
    }
    
    return createResponse(true, 'Property Management API is running');
    
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return createResponse(false, 'Server error: ' + error.message);
  }
}

/**
 * Handle admin login
 */
function handleLogin(data) {
  try {
    const { username, password } = data;
    
    // Validate credentials
    if (username === CONFIG.ADMIN_USERNAME && password === CONFIG.ADMIN_PASSWORD) {
      
      // Send login notification email
      sendLoginNotification(username);
      
      return createResponse(true, 'Login successful', {
        username: username,
        token: generateToken(username) // In production, use proper JWT
      });
    } else {
      return createResponse(false, 'Invalid username or password');
    }
    
  } catch (error) {
    Logger.log('Login error: ' + error.toString());
    return createResponse(false, 'Login failed');
  }
}

/**
 * Get all listings (for admin panel)
 */
function getListings(type) {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    let listings = [];
    
    if (type === 'houses' || type === 'all') {
      const housesSheet = getOrCreateSheet(spreadsheet, CONFIG.HOUSES_SHEET, 'house');
      const houses = readSheetData(housesSheet);
      listings = [...listings, ...houses.map(item => ({ ...item, type: 'house' }))];
    }
    
    if (type === 'land' || type === 'all') {
      const landSheet = getOrCreateSheet(spreadsheet, CONFIG.LAND_SHEET, 'land');
      const land = readSheetData(landSheet);
      listings = [...listings, ...land.map(item => ({ ...item, type: 'land' }))];
    }
    
    return createResponse(true, 'Listings retrieved', { listings });
    
  } catch (error) {
    Logger.log('Get listings error: ' + error.toString());
    return createResponse(false, 'Failed to retrieve listings');
  }
}

/**
 * Get public listings (visible only, for website display)
 */
function getPublicListings(type) {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    let houses = [];
    let land = [];
    
    if (type === 'houses' || type === 'all') {
      const housesSheet = getOrCreateSheet(spreadsheet, CONFIG.HOUSES_SHEET, 'house');
      houses = readSheetData(housesSheet).filter(item => item.visible === 'Yes');
    }
    
    if (type === 'land' || type === 'all') {
      const landSheet = getOrCreateSheet(spreadsheet, CONFIG.LAND_SHEET, 'land');
      land = readSheetData(landSheet).filter(item => item.visible === 'Yes');
    }
    
    return createResponse(true, 'Public listings retrieved', { houses, land });
    
  } catch (error) {
    Logger.log('Get public listings error: ' + error.toString());
    return createResponse(false, 'Failed to retrieve listings');
  }
}

/**
 * Add new listing
 */
function addListing(data) {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const { listingType, listingData } = data;
    
    const sheetName = listingType === 'house' ? CONFIG.HOUSES_SHEET : CONFIG.LAND_SHEET;
    const sheet = getOrCreateSheet(spreadsheet, sheetName, listingType);
    
    // Add timestamp and ID
    const timestamp = new Date().toLocaleString('en-US', {
      timeZone: 'Africa/Accra',
      dateStyle: 'medium',
      timeStyle: 'short'
    });
    
    const id = generateId();
    
    // Prepare row data
    const row = prepareRowData(listingType, listingData, id, timestamp);
    
    // Append to sheet
    sheet.appendRow(row);
    
    // Format the new row
    const lastRow = sheet.getLastRow();
    formatRow(sheet, lastRow);
    
    // Send notification
    sendListingNotification('added', listingType, listingData);
    
    return createResponse(true, 'Listing added successfully', { id });
    
  } catch (error) {
    Logger.log('Add listing error: ' + error.toString());
    return createResponse(false, 'Failed to add listing: ' + error.message);
  }
}

/**
 * Update existing listing
 */
function updateListing(data) {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const { listingType, listingId, listingData } = data;
    
    const sheetName = listingType === 'house' ? CONFIG.HOUSES_SHEET : CONFIG.LAND_SHEET;
    const sheet = getOrCreateSheet(spreadsheet, sheetName, listingType);
    
    // Find the row with this ID
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    let rowIndex = -1;
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === listingId) {
        rowIndex = i + 1; // Sheet rows are 1-indexed
        break;
      }
    }
    
    if (rowIndex === -1) {
      return createResponse(false, 'Listing not found');
    }
    
    // Update the row
    const timestamp = values[rowIndex - 1][1]; // Keep original timestamp
    const updatedTimestamp = new Date().toLocaleString('en-US', {
      timeZone: 'Africa/Accra',
      dateStyle: 'medium',
      timeStyle: 'short'
    });
    
    const row = prepareRowData(listingType, listingData, listingId, timestamp, updatedTimestamp);
    
    // Update the sheet
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
    formatRow(sheet, rowIndex);
    
    // Send notification
    sendListingNotification('updated', listingType, listingData);
    
    return createResponse(true, 'Listing updated successfully');
    
  } catch (error) {
    Logger.log('Update listing error: ' + error.toString());
    return createResponse(false, 'Failed to update listing: ' + error.message);
  }
}

/**
 * Toggle listing visibility
 */
function toggleVisibility(data) {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const { listingType, listingId } = data;
    
    const sheetName = listingType === 'house' ? CONFIG.HOUSES_SHEET : CONFIG.LAND_SHEET;
    const sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      return createResponse(false, 'Sheet not found');
    }
    
    // Find the row
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    const headers = values[0];
    const visibleColIndex = headers.indexOf('Visible');
    
    let rowIndex = -1;
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === listingId) {
        rowIndex = i + 1;
        break;
      }
    }
    
    if (rowIndex === -1) {
      return createResponse(false, 'Listing not found');
    }
    
    // Toggle visibility
    const currentVisibility = values[rowIndex - 1][visibleColIndex];
    const newVisibility = currentVisibility === 'Yes' ? 'No' : 'Yes';
    
    sheet.getRange(rowIndex, visibleColIndex + 1).setValue(newVisibility);
    
    return createResponse(true, 'Visibility toggled', { visible: newVisibility === 'Yes' });
    
  } catch (error) {
    Logger.log('Toggle visibility error: ' + error.toString());
    return createResponse(false, 'Failed to toggle visibility');
  }
}

/**
 * Delete listing
 */
function deleteListing(data) {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const { listingType, listingId } = data;
    
    const sheetName = listingType === 'house' ? CONFIG.HOUSES_SHEET : CONFIG.LAND_SHEET;
    const sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      return createResponse(false, 'Sheet not found');
    }
    
    // Find the row
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    let rowIndex = -1;
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === listingId) {
        rowIndex = i + 1;
        break;
      }
    }
    
    if (rowIndex === -1) {
      return createResponse(false, 'Listing not found');
    }
    
    // Delete the row
    sheet.deleteRow(rowIndex);
    
    return createResponse(true, 'Listing deleted successfully');
    
  } catch (error) {
    Logger.log('Delete listing error: ' + error.toString());
    return createResponse(false, 'Failed to delete listing');
  }
}

/**
 * Get or create sheet with appropriate headers
 */
function getOrCreateSheet(spreadsheet, sheetName, type) {
  let sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    
    // Set up headers based on type
    let headers;
    if (type === 'house') {
      headers = [
        'ID', 'Created', 'Updated', 'Title', 'Location', 'Price', 
        'Bedrooms', 'Bathrooms', 'SqFt', 'Description', 'Images', 
        'Featured', 'Visible'
      ];
    } else {
      headers = [
        'ID', 'Created', 'Updated', 'Title', 'Location', 'Price', 
        'Plot Size', 'Area', 'Description', 'Image', 
        'Featured', 'Visible'
      ];
    }
    
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Format header row
    sheet.getRange(1, 1, 1, headers.length)
      .setBackground(CONFIG.SECONDARY_COLOR)
      .setFontColor('#ffffff')
      .setFontWeight('bold')
      .setHorizontalAlignment('center');
    
    // Auto-resize columns
    for (let i = 1; i <= headers.length; i++) {
      sheet.autoResizeColumn(i);
    }
    
    // Freeze header row
    sheet.setFrozenRows(1);
  }
  
  return sheet;
}

/**
 * Read data from sheet
 */
function readSheetData(sheet) {
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  
  if (values.length <= 1) {
    return [];
  }
  
  const headers = values[0];
  const data = [];
  
  for (let i = 1; i < values.length; i++) {
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j].toLowerCase().replace(/\s+/g, '')] = values[i][j];
    }
    data.push(row);
  }
  
  return data;
}

/**
 * Prepare row data for sheet
 */
function prepareRowData(type, data, id, timestamp, updatedTimestamp = '') {
  if (type === 'house') {
    return [
      id,
      timestamp,
      updatedTimestamp || timestamp,
      data.title || '',
      data.location || '',
      data.price || 0,
      data.bedrooms || 0,
      data.bathrooms || 0,
      data.sqft || 0,
      data.description || '',
      data.images || '',
      data.featured ? 'Yes' : 'No',
      'Yes' // Default to visible
    ];
  } else {
    return [
      id,
      timestamp,
      updatedTimestamp || timestamp,
      data.title || '',
      data.location || '',
      data.price || 0,
      data.plotSize || '',
      data.area || 0,
      data.description || '',
      data.image || '',
      data.featured ? 'Yes' : 'No',
      'Yes' // Default to visible
    ];
  }
}

/**
 * Format a row in the sheet
 */
function formatRow(sheet, rowIndex) {
  const lastColumn = sheet.getLastColumn();
  sheet.getRange(rowIndex, 1, 1, lastColumn)
    .setBorder(true, true, true, true, false, false)
    .setVerticalAlignment('middle');
}

/**
 * Generate unique ID
 */
function generateId() {
  return 'PGP-' + new Date().getTime() + '-' + Math.random().toString(36).substr(2, 9);
}

/**
 * Generate simple token (in production, use proper JWT)
 */
function generateToken(username) {
  return 'token-' + username + '-' + new Date().getTime();
}

/**
 * Send login notification email
 */
function sendLoginNotification(username) {
  try {
    const subject = 'Admin Panel Login Notification - Prime Global Properties';
    const timestamp = new Date().toLocaleString('en-US', {
      timeZone: 'Africa/Accra',
      dateStyle: 'full',
      timeStyle: 'long'
    });
    
    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Nunito Sans', Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #F96D00 0%, #232526 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 24px;
      font-weight: 700;
    }
    .content {
      padding: 40px 30px;
    }
    .alert-box {
      background: #fff3cd;
      border-left: 4px solid #F96D00;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .info-row {
      margin: 10px 0;
      padding: 10px;
      background: #f9f9f9;
      border-radius: 4px;
    }
    .label {
      font-weight: 600;
      color: #232526;
    }
    .footer {
      background: #232526;
      color: #ffffff;
      padding: 20px;
      text-align: center;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>&#128274; Admin Panel Login Alert</h1>
    </div>
    
    <div class="content">
      <p style="font-size: 16px; color: #232526;">
        This is an automated notification to inform you that someone has logged into the 
        Prime Global Properties Admin Panel.
      </p>
      
      <div class="alert-box">
        <strong>&#9888;&#65039; Security Notice:</strong> If this wasn't you, please contact your system administrator immediately.
      </div>
      
      <h3 style="color: #F96D00; margin-top: 30px;">Login Details:</h3>
      
      <div class="info-row">
        <span class="label">Username:</span> ${username}
      </div>
      
      <div class="info-row">
        <span class="label">Login Time:</span> ${timestamp}
      </div>
      
      <div class="info-row">
        <span class="label">System:</span> Property Management System
      </div>
      
      <p style="margin-top: 30px; font-size: 14px; color: #666666;">
        This login grants access to manage property listings, including adding, editing, 
        hiding, and deleting properties on the Prime Global Properties website.
      </p>
    </div>
    
    <div class="footer">
      <p style="margin: 0 0 10px 0; font-weight: 600;">Prime Global Properties</p>
      <p style="margin: 5px 0; font-size: 12px;">
        Automated Security Notification - Property Management System
      </p>
    </div>
  </div>
</body>
</html>
    `;
    
    const plainBody = `
ADMIN PANEL LOGIN NOTIFICATION
Prime Global Properties

Someone has logged into the Admin Panel:

Username: ${username}
Login Time: ${timestamp}
System: Property Management System

If this wasn't you, please contact your system administrator immediately.

---
Prime Global Properties
Automated Security Notification
    `;
    
    GmailApp.sendEmail(
      CONFIG.ADMIN_EMAIL,
      subject,
      plainBody,
      {
        htmlBody: htmlBody,
        name: 'Prime Global Properties - Security'
      }
    );
    
  } catch (error) {
    Logger.log('Email notification error: ' + error.toString());
  }
}

/**
 * Send listing change notification
 */
function sendListingNotification(action, type, data) {
  try {
    const actionText = action.charAt(0).toUpperCase() + action.slice(1);
    const typeText = type === 'house' ? 'House' : 'Land Plot';
    
    const subject = `${actionText} - ${typeText} Listing - Prime Global Properties`;
    const timestamp = new Date().toLocaleString('en-US', {
      timeZone: 'Africa/Accra',
      dateStyle: 'medium',
      timeStyle: 'short'
    });
    
    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Nunito Sans', Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #F96D00 0%, #232526 100%);
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 22px;
      font-weight: 700;
    }
    .content {
      padding: 30px;
    }
    .badge {
      display: inline-block;
      background: #F96D00;
      color: #ffffff;
      padding: 6px 12px;
      border-radius: 15px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 15px;
    }
    .listing-details {
      background: #f9f9f9;
      border: 2px solid #F96D00;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .detail-row {
      margin: 10px 0;
      padding: 8px 0;
      border-bottom: 1px solid #eeeeee;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .label {
      font-weight: 600;
      color: #F96D00;
      display: inline-block;
      min-width: 120px;
    }
    .footer {
      background: #232526;
      color: #ffffff;
      padding: 20px;
      text-align: center;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>Listing ${actionText}</h1>
    </div>
    
    <div class="content">
      <div class="badge">${typeText}</div>
      
      <p style="font-size: 16px;">
        A ${typeText.toLowerCase()} listing has been ${action} in the system.
      </p>
      
      <div class="listing-details">
        <div class="detail-row">
          <span class="label">Title:</span>
          <span>${data.title || 'N/A'}</span>
        </div>
        <div class="detail-row">
          <span class="label">Location:</span>
          <span>${data.location || 'N/A'}</span>
        </div>
        <div class="detail-row">
          <span class="label">Price:</span>
          <span>GHS ${data.price ? Number(data.price).toLocaleString() : 'N/A'}</span>
        </div>
        ${type === 'house' ? `
        <div class="detail-row">
          <span class="label">Bedrooms:</span>
          <span>${data.bedrooms || 'N/A'}</span>
        </div>
        <div class="detail-row">
          <span class="label">Bathrooms:</span>
          <span>${data.bathrooms || 'N/A'}</span>
        </div>
        ` : `
        <div class="detail-row">
          <span class="label">Plot Size:</span>
          <span>${data.plotSize || 'N/A'}</span>
        </div>
        `}
        <div class="detail-row">
          <span class="label">Featured:</span>
          <span>${data.featured ? 'Yes' : 'No'}</span>
        </div>
        <div class="detail-row">
          <span class="label">Timestamp:</span>
          <span>${timestamp}</span>
        </div>
      </div>
      
      <p style="font-size: 14px; color: #666666; margin-top: 20px;">
        This listing is now ${action === 'added' ? 'visible' : action === 'updated' ? 'updated' : 'removed'} on the website.
      </p>
    </div>
    
    <div class="footer">
      <p style="margin: 0;">Prime Global Properties - Property Management System</p>
    </div>
  </div>
</body>
</html>
    `;
    
    GmailApp.sendEmail(
      CONFIG.ADMIN_EMAIL,
      subject,
      `Listing ${actionText}\n\nType: ${typeText}\nTitle: ${data.title}\nLocation: ${data.location}\nPrice: GHS ${data.price}\nTimestamp: ${timestamp}`,
      {
        htmlBody: htmlBody,
        name: 'Prime Global Properties'
      }
    );
    
  } catch (error) {
    Logger.log('Notification error: ' + error.toString());
  }
}

/**
 * Handle image upload
 */
function handleImageUpload(data) {
  try {
    const { imageData, fileName, mimeType, propertyId } = data;
    
    if (!imageData || !fileName) {
      return createResponse(false, 'Image data and filename are required');
    }
    
    // Get or create the main images folder in Google Drive
    const folderName = CONFIG.IMAGES_FOLDER_NAME || 'Prime Properties Images';
    let mainFolder;
    
    const folders = DriveApp.getFoldersByName(folderName);
    if (folders.hasNext()) {
      mainFolder = folders.next();
    } else {
      mainFolder = DriveApp.createFolder(folderName);
      // Make folder publicly accessible
      mainFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    }
    
    // Create property-specific subfolder if propertyId is provided
    let folder = mainFolder;
    if (propertyId) {
      const subFolderName = 'Property-' + propertyId;
      const subFolders = mainFolder.getFoldersByName(subFolderName);
      if (subFolders.hasNext()) {
        folder = subFolders.next();
      } else {
        folder = mainFolder.createFolder(subFolderName);
        folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      }
    }
    
    // Remove base64 prefix if present
    let base64Data = imageData;
    if (imageData.indexOf(',') !== -1) {
      base64Data = imageData.split(',')[1];
    }
    
    // Decode base64 and create blob
    const blob = Utilities.newBlob(
      Utilities.base64Decode(base64Data),
      mimeType || 'image/jpeg',
      fileName
    );
    
    // Upload to Drive
    const file = folder.createFile(blob);
    
    // Make file publicly accessible
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Get the file URL - using thumbnail API which works better with CORS
    // Using size=s2000 for high quality display
    const fileUrl = `https://drive.google.com/thumbnail?id=${file.getId()}&sz=w2000`;
    
    Logger.log('Image uploaded: ' + fileUrl);
    
    return createResponse(true, 'Image uploaded successfully', {
      imageUrl: fileUrl,
      fileId: file.getId()
    });
    
  } catch (error) {
    Logger.log('Image upload error: ' + error.toString());
    return createResponse(false, 'Failed to upload image: ' + error.toString());
  }
}

/**
 * Create JSON response
 */
function createResponse(success, message, data = {}) {
  const response = {
    status: success ? 'success' : 'error',
    message: message,
    ...data
  };
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * INITIAL SETUP FUNCTION
 * Populate the sheets with existing property listings from the website
 * Run this ONCE after setting up the spreadsheet
 * Go to: Extensions → Apps Script → Run → populateInitialData
 */
function populateInitialData() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    
    // Ensure sheets exist
    let housesSheet = ss.getSheetByName(CONFIG.HOUSES_SHEET);
    let landSheet = ss.getSheetByName(CONFIG.LAND_SHEET);
    
    if (!housesSheet) {
      housesSheet = ss.insertSheet(CONFIG.HOUSES_SHEET);
    }
    if (!landSheet) {
      landSheet = ss.insertSheet(CONFIG.LAND_SHEET);
    }
    
    // Clear existing data
    housesSheet.clear();
    landSheet.clear();
    
    // Set up headers for Houses
    housesSheet.getRange(1, 1, 1, 13).setValues([[
      'ID', 'Created', 'Updated', 'Title', 'Location', 'Price', 'Bedrooms', 'Bathrooms', 
      'SqFt', 'Description', 'Images', 'Featured', 'Visible'
    ]]);
    
    // Set up headers for Land
    landSheet.getRange(1, 1, 1, 12).setValues([[
      'ID', 'Created', 'Updated', 'Title', 'Location', 'Price', 'Plot Size', 'Area', 
      'Description', 'Image', 'Featured', 'Visible'
    ]]);
    
    // Format headers
    housesSheet.getRange(1, 1, 1, 13).setBackground('#F96D00').setFontColor('#FFFFFF').setFontWeight('bold');
    landSheet.getRange(1, 1, 1, 12).setBackground('#F96D00').setFontColor('#FFFFFF').setFontWeight('bold');
    
    // Add existing house listings from website
    const timestamp = new Date().toLocaleString('en-US', {
      timeZone: 'Africa/Accra',
      dateStyle: 'medium',
      timeStyle: 'short'
    });
    
    const houseListings = [
      [
        generateId(), // ID
        timestamp, // Created
        timestamp, // Updated
        '4 Bedrooms House',
        'Community 26',
        3500000, // GHS 3.5M
        4,
        4,
        2500, // SqFt
        'All rooms en-suite | Community 26 | TDC Document',
        'images/properties/4BedroomOutdoor.jpeg\nimages/properties/4BedroomOutsideWithLight.jpeg\nimages/properties/4BedroomChandelia.jpeg\nimages/properties/4BedroomInsideRoom.jpeg\nimages/properties/4BedroomMirror.jpeg\nimages/properties/4BedroomDualMirror.jpeg\nimages/properties/4BedroomWashroom.jpeg',
        'Yes', // Featured
        'Yes', // Visible
      ],
      [
        generateId(),
        timestamp,
        timestamp,
        '5 Bedrooms House',
        'Trassaco',
        700000, // $700K
        5,
        5,
        3200, // SqFt
        'Fitted Kitchen | AC in all rooms | Gated Community | Land Certificate',
        'images/properties/5BedroomMainBuilding.jpeg\nimages/properties/5BedroomGateView.jpeg\nimages/properties/5BedroomsOutside.jpeg\nimages/properties/5BedroomsKitchen.jpeg\nimages/properties/5BedroomsCorridor.jpeg\nimages/properties/5BedroomsEmptyRoom.jpeg\nimages/properties/5BedroomsStaircase.jpeg\nimages/properties/5BedroomsWashroom.jpeg\nimages/properties/5BedroomsGarden.jpeg\nimages/properties/5BedroomsGarage.jpeg',
        'Yes',
        'Yes',
      ],
      [
        generateId(),
        timestamp,
        timestamp,
        '6 Bedrooms Luxury House',
        'Accra',
        950000, // GHS 950K
        6,
        4,
        3000, // SqFt
        'Emef Estate Afienya | Fitted Kitchen | Spacious Compound | 2 Room BQ | 2 Plots | Grantor Titled | Gated Community',
        'images/properties/6BedroomsOutside.jpeg\nimages/properties/6BedroomsOutsideBackview.jpeg\nimages/properties/6BedroomsHall.jpeg\nimages/properties/6BedroomChandelia.jpeg\nimages/properties/6BedroomStairs.jpeg\nimages/properties/6BedroomsPlainRoom.jpeg\nimages/properties/6BedroomsOtherRoom.jpeg\nimages/properties/6BedroomWashroom.jpeg',
        'Yes',
        'Yes',
      ]
    ];
    
    // Add existing land listings from website
    const landListings = [
      [
        generateId(), // ID
        timestamp, // Created
        timestamp, // Updated
        'Land Sale - Tsopoli',
        'Tsopoli',
        12500, // GHC 12,500
        '70 x 50',
        3500, // Area in sqft (70*50)
        'Plot Size: 70ft x 50ft | Up to 10% off',
        'images/tsopoli 70 x 100 12500.JPG',
        'Yes', // Featured
        'Yes', // Visible
      ],
      [
        generateId(),
        timestamp,
        timestamp,
        'Land Sale - Tsopoli',
        'Tsopoli',
        25000, // GHC 25,000
        '70 x 100',
        7000, // Area in sqft (70*100)
        'Plot Size: 70ft x 100ft | Up to 10% off',
        'images/tsopoli 70 x 100 25000.JPG',
        'Yes',
        'Yes',
      ],
      [
        generateId(),
        timestamp,
        timestamp,
        'Land Sale - Community 25',
        'Community 25, Tema',
        185500, // GHC 185,500 (was 195,000)
        '70 x 100',
        7000, // Area in sqft (70*100)
        'Plot Size: 70ft x 100ft - Tema | Up to 10,000 off | Was GHC 195,000',
        'images/community 25 - tema 185500.JPG',
        'Yes',
        'Yes',
      ]
    ];
    
    // Write house data to sheet
    if (houseListings.length > 0) {
      housesSheet.getRange(2, 1, houseListings.length, 13).setValues(houseListings);
    }
    
    // Write land data to sheet
    if (landListings.length > 0) {
      landSheet.getRange(2, 1, landListings.length, 12).setValues(landListings);
    }
    
    // Auto-resize columns
    housesSheet.autoResizeColumns(1, 13);
    landSheet.autoResizeColumns(1, 12);
    
    // Freeze header row
    housesSheet.setFrozenRows(1);
    landSheet.setFrozenRows(1);
    
    Logger.log('✅ Initial data populated successfully!');
    Logger.log('Houses added: ' + houseListings.length);
    Logger.log('Land listings added: ' + landListings.length);
    
    // Send confirmation email
    GmailApp.sendEmail(
      CONFIG.ADMIN_EMAIL,
      '✅ Property Management System - Initial Data Loaded',
      'Your property management system has been successfully set up!\n\n' +
      'Summary:\n' +
      '- Houses added: ' + houseListings.length + '\n' +
      '- Land listings added: ' + landListings.length + '\n\n' +
      'You can now:\n' +
      '1. Access the admin panel to manage properties\n' +
      '2. Add new listings\n' +
      '3. Edit existing properties\n' +
      '4. Toggle visibility\n\n' +
      'Spreadsheet: ' + ss.getUrl() + '\n\n' +
      'Prime Global Properties - Property Management System'
    );
    
    return 'Success! Check your email for confirmation.';
    
  } catch (error) {
    Logger.log('❌ Error populating initial data: ' + error.toString());
    throw new Error('Failed to populate data: ' + error.toString());
  }
}

/**
 * Test function to verify setup
 * Run this to check if everything is configured correctly
 */
function testSetup() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    Logger.log('✅ Spreadsheet found: ' + ss.getName());
    Logger.log('✅ Spreadsheet URL: ' + ss.getUrl());
    Logger.log('✅ Admin email: ' + CONFIG.ADMIN_EMAIL);
    
    const housesSheet = ss.getSheetByName(CONFIG.HOUSES_SHEET);
    const landSheet = ss.getSheetByName(CONFIG.LAND_SHEET);
    
    if (housesSheet) {
      Logger.log('✅ Houses sheet exists with ' + (housesSheet.getLastRow() - 1) + ' listings');
    } else {
      Logger.log('⚠️ Houses sheet not found - will be created on first run');
    }
    
    if (landSheet) {
      Logger.log('✅ Land sheet exists with ' + (landSheet.getLastRow() - 1) + ' listings');
    } else {
      Logger.log('⚠️ Land sheet not found - will be created on first run');
    }
    
    Logger.log('\n✅ Setup test completed successfully!');
    return 'Setup OK';
    
  } catch (error) {
    Logger.log('❌ Setup test failed: ' + error.toString());
    throw error;
  }
}
