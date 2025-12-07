/**
 * Admin Panel JavaScript for Prime Global Properties
 * Handles authentication, CRUD operations, and UI interactions
 */

// Configuration
const CONFIG = {
  SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxNvkCfkuHemDo5DgoIpYKj1YmsUM3vlK5YLNqdfE2Irf2RoUY8MNV9ZItuBYPGjiVD/exec', // Replace after deployment
  SESSION_KEY: 'pgp_admin_session'
};

// Verify script URL is configured
if (!CONFIG.SCRIPT_URL || CONFIG.SCRIPT_URL.includes('YOUR_')) {
  console.warn('⚠️ Google Apps Script URL not configured. Please update CONFIG.SCRIPT_URL in admin-panel.js');
}

// State management
let currentUser = null;
let housesData = [];
let landData = [];

/**
 * Initialize the application
 */
document.addEventListener('DOMContentLoaded', function() {
  // Check for existing session
  checkSession();
  
  // Set up event listeners
  setupEventListeners();
});

/**
 * Check for existing session
 */
function checkSession() {
  const session = localStorage.getItem(CONFIG.SESSION_KEY);
  if (session) {
    try {
      currentUser = JSON.parse(session);
      showDashboard();
      loadAllListings();
    } catch (error) {
      console.error('Invalid session data');
      localStorage.removeItem(CONFIG.SESSION_KEY);
    }
  }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Login form
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
  
  // Logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
  
  // Add house form
  const addHouseForm = document.getElementById('add-house-form');
  if (addHouseForm) {
    addHouseForm.addEventListener('submit', handleAddHouse);
  }
  
  // Add land form
  const addLandForm = document.getElementById('add-land-form');
  if (addLandForm) {
    addLandForm.addEventListener('submit', handleAddLand);
  }
  
  // Edit house form
  const editHouseForm = document.getElementById('edit-house-form');
  if (editHouseForm) {
    editHouseForm.addEventListener('submit', handleEditHouse);
  }
  
  // Edit land form
  const editLandForm = document.getElementById('edit-land-form');
  if (editLandForm) {
    editLandForm.addEventListener('submit', handleEditLand);
  }
  
  // Image upload previews
  const houseImagesInput = document.getElementById('house-images');
  if (houseImagesInput) {
    houseImagesInput.addEventListener('change', (e) => handleImagePreview(e, 'house-image-preview', true));
  }
  
  const landImageInput = document.getElementById('land-image');
  if (landImageInput) {
    landImageInput.addEventListener('change', (e) => handleImagePreview(e, 'land-image-preview', false));
  }
  
  const editHouseImagesInput = document.getElementById('edit-house-images-input');
  if (editHouseImagesInput) {
    editHouseImagesInput.addEventListener('change', (e) => handleImagePreview(e, 'edit-house-image-preview', true));
  }
  
  const editLandImageInput = document.getElementById('edit-land-image-input');
  if (editLandImageInput) {
    editLandImageInput.addEventListener('change', (e) => handleImagePreview(e, 'edit-land-image-preview', false));
  }
  
  // Tab change event
  $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
    const target = $(e.target).attr('href');
    if (target === '#land' && landData.length === 0) {
      // Load land data if not already loaded
      loadListings('land');
    }
  });
}

/**
 * Handle image preview
 */
function handleImagePreview(event, previewContainerId, multiple) {
  const files = event.target.files;
  const container = document.getElementById(previewContainerId);
  
  if (!container) return;
  
  // Clear previous previews
  container.innerHTML = '';
  
  // Validate and preview each file
  Array.from(files).forEach((file, index) => {
    // Validate file type
    if (!file.type.match('image/(jpeg|png|webp)')) {
      alert(`${file.name} is not a valid image format. Please use JPG, PNG, or WebP.`);
      return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert(`${file.name} is too large. Maximum file size is 5MB.`);
      return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onload = function(e) {
      const previewItem = document.createElement('div');
      previewItem.className = 'image-preview-item';
      previewItem.innerHTML = `
        <img src="${e.target.result}" alt="Preview ${index + 1}">
        <button type="button" class="image-preview-remove" onclick="removeImagePreview(this, '${event.target.id}', ${index})">&times;</button>
      `;
      container.appendChild(previewItem);
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Remove image from preview
 */
function removeImagePreview(button, inputId, index) {
  const input = document.getElementById(inputId);
  if (!input) return;
  
  // Create a new FileList without the removed file
  const dt = new DataTransfer();
  const files = input.files;
  
  Array.from(files).forEach((file, i) => {
    if (i !== index) {
      dt.items.add(file);
    }
  });
  
  input.files = dt.files;
  
  // Remove preview item
  button.closest('.image-preview-item').remove();
}

/**
 * Upload images to Google Drive
 */
async function uploadImages(files, propertyId) {
  const uploadedUrls = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    try {
      // Convert to base64
      const base64 = await fileToBase64(file);
      
      // Upload to Google Drive
      const formData = new FormData();
      formData.append('action', 'uploadImage');
      formData.append('imageData', base64);
      formData.append('fileName', `${propertyId}_${i + 1}_${file.name}`);
      formData.append('mimeType', file.type);
      formData.append('propertyId', propertyId);
      
      const response = await fetch(CONFIG.SCRIPT_URL, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.status === 'success' && data.imageUrl) {
        uploadedUrls.push(data.imageUrl);
      } else {
        throw new Error(data.message || 'Upload failed');
      }
      
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error(`Failed to upload ${file.name}: ${error.message}`);
    }
  }
  
  return uploadedUrls;
}

/**
 * Convert file to base64
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Handle login form submission
 */
async function handleLogin(e) {
  e.preventDefault();
  
  const btn = document.getElementById('login-btn');
  const errorDiv = document.getElementById('login-error');
  
  // Get form data
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  
  // Validate
  if (!username || !password) {
    showError(errorDiv, 'Please enter both username and password');
    return;
  }
  
  // Show loading
  setButtonLoading(btn, true);
  hideError(errorDiv);
  
  try {
    // Create FormData to avoid CORS preflight
    const formData = new FormData();
    formData.append('action', 'login');
    formData.append('username', username);
    formData.append('password', password);
    
    // Send login request
    const response = await fetch(CONFIG.SCRIPT_URL, {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (data.status === 'success') {
      // Save session
      currentUser = {
        username: data.username,
        token: data.token,
        loginTime: new Date().toISOString()
      };
      localStorage.setItem(CONFIG.SESSION_KEY, JSON.stringify(currentUser));
      
      // Show dashboard
      showDashboard();
      loadAllListings();
    } else {
      showError(errorDiv, data.message || 'Login failed. Please try again.');
    }
    
  } catch (error) {
    console.error('Login error:', error);
    showError(errorDiv, 'Connection error. Please check your internet connection and try again.');
  } finally {
    setButtonLoading(btn, false);
  }
}

/**
 * Handle logout
 */
function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem(CONFIG.SESSION_KEY);
    currentUser = null;
    housesData = [];
    landData = [];
    
    // Hide dashboard and show login
    document.getElementById('admin-dashboard').style.display = 'none';
    document.getElementById('login-section').style.display = 'flex';
    
    // Reset login form
    document.getElementById('login-form').reset();
  }
}

/**
 * Show dashboard
 */
function showDashboard() {
  document.getElementById('login-section').style.display = 'none';
  document.getElementById('admin-dashboard').style.display = 'block';
  document.getElementById('admin-username').textContent = currentUser.username;
}

/**
 * Load all listings
 */
async function loadAllListings() {
  await Promise.all([
    loadListings('houses'),
    loadListings('land')
  ]);
}

/**
 * Load listings from server
 */
async function loadListings(type) {
  const skeletonId = type === 'houses' ? 'houses-skeleton' : 'land-skeleton';
  const gridId = type === 'houses' ? 'houses-grid' : 'land-grid';
  const emptyId = type === 'houses' ? 'houses-empty' : 'land-empty';
  const countId = type === 'houses' ? 'houses-count' : 'land-count';
  
  // Show skeleton
  document.getElementById(skeletonId).style.display = 'grid';
  document.getElementById(gridId).style.display = 'none';
  document.getElementById(emptyId).style.display = 'none';
  
  try {
    // Create FormData to avoid CORS preflight
    const formData = new FormData();
    formData.append('action', 'getListings');
    formData.append('type', type);
    
    const response = await fetch(CONFIG.SCRIPT_URL, {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (data.status === 'success') {
      const listings = data.listings.filter(item => item.type === (type === 'houses' ? 'house' : 'land'));
      
      // Store data
      if (type === 'houses') {
        housesData = listings;
      } else {
        landData = listings;
      }
      
      // Update count
      document.getElementById(countId).textContent = listings.length;
      
      // Hide skeleton
      document.getElementById(skeletonId).style.display = 'none';
      
      // Render listings
      if (listings.length > 0) {
        renderListings(type, listings);
        document.getElementById(gridId).style.display = 'grid';
      } else {
        document.getElementById(emptyId).style.display = 'block';
      }
    } else {
      console.error('Failed to load listings:', data.message);
      document.getElementById(skeletonId).style.display = 'none';
      document.getElementById(emptyId).style.display = 'block';
    }
    
  } catch (error) {
    console.error('Error loading listings:', error);
    document.getElementById(skeletonId).style.display = 'none';
    document.getElementById(emptyId).style.display = 'block';
  }
}

/**
 * Render listings to the grid
 */
function renderListings(type, listings) {
  const gridId = type === 'houses' ? 'houses-grid' : 'land-grid';
  const grid = document.getElementById(gridId);
  
  grid.innerHTML = listings.map(listing => {
    if (type === 'houses') {
      return renderHouseCard(listing);
    } else {
      return renderLandCard(listing);
    }
  }).join('');
}

/**
 * Render house card
 */
function renderHouseCard(house) {
  const images = house.images ? house.images.split('\n').filter(img => img.trim()) : [];
  const firstImage = images[0] || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="18" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
  const isHidden = house.visible === 'No';
  const placeholderSvg = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="18" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
  
  return `
    <div class="listing-card ${isHidden ? 'hidden' : ''}">
      ${house.featured === 'Yes' ? '<div class="listing-badge">Featured</div>' : ''}
      ${isHidden ? '<div class="listing-badge hidden-badge">Hidden</div>' : ''}
      <img src="${firstImage}" alt="${house.title}" class="listing-image" onerror="this.onerror=null; this.src='${placeholderSvg}'; console.error('Failed to load image:', '${firstImage}');" crossorigin="anonymous">
      <div class="listing-content">
        <h4 class="listing-title">${house.title}</h4>
        <p class="listing-location">
          <i class="icon-location-pin"></i> ${house.location}
        </p>
        <div class="listing-price">GHS ${Number(house.price).toLocaleString()}</div>
        <div class="listing-details">
          <div class="listing-detail-item">
            <i class="icon-bed"></i> ${house.bedrooms} Beds
          </div>
          <div class="listing-detail-item">
            <i class="icon-bath"></i> ${house.bathrooms} Baths
          </div>
          ${house.sqft ? `
          <div class="listing-detail-item">
            <i class="icon-resize-full"></i> ${Number(house.sqft).toLocaleString()} sqft
          </div>
          ` : ''}
        </div>
        <div class="listing-actions">
          <button class="btn btn-sm btn-outline-primary" onclick="editHouse('${house.id}')">
            Edit
          </button>
          <button class="btn btn-sm btn-outline-warning" onclick="toggleVisibility('house', '${house.id}')">
            ${isHidden ? 'Show' : 'Hide'}
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteListing('house', '${house.id}')">
            Delete
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render land card
 */
function renderLandCard(land) {
  const isHidden = land.visible === 'No';
  const landImage = land.image || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="18" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
  const placeholderSvg = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="18" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
  
  return `
    <div class="listing-card ${isHidden ? 'hidden' : ''}">
      ${land.featured === 'Yes' ? '<div class="listing-badge">Featured</div>' : ''}
      ${isHidden ? '<div class="listing-badge hidden-badge">Hidden</div>' : ''}
      <img src="${landImage}" alt="${land.title}" class="listing-image" onerror="this.onerror=null; this.src='${placeholderSvg}'; console.error('Failed to load image:', '${landImage}');" crossorigin="anonymous">
      <div class="listing-content">
        <h4 class="listing-title">${land.title}</h4>
        <p class="listing-location">
          <i class="icon-location-pin"></i> ${land.location}
        </p>
        <div class="listing-price">GHS ${Number(land.price).toLocaleString()}</div>
        <div class="listing-details">
          <div class="listing-detail-item">
            <i class="icon-resize-full"></i> ${land.plotsize || land.plotSize}
          </div>
          ${land.area ? `
          <div class="listing-detail-item">
            <i class="icon-map"></i> ${Number(land.area).toLocaleString()} sqft
          </div>
          ` : ''}
        </div>
        <div class="listing-actions">
          <button class="btn btn-sm btn-outline-primary" onclick="editLand('${land.id}')">
            Edit
          </button>
          <button class="btn btn-sm btn-outline-warning" onclick="toggleVisibility('land', '${land.id}')">
            ${isHidden ? 'Show' : 'Hide'}
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteListing('land', '${land.id}')">
            Delete
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Handle add house form submission
 */
async function handleAddHouse(e) {
  e.preventDefault();
  
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  const formData = new FormData(form);
  
  // Get image files
  const imageFiles = document.getElementById('house-images').files;
  
  if (imageFiles.length === 0) {
    alert('Please select at least one image for the property.');
    return;
  }
  
  // Show loading
  setButtonLoading(btn, true);
  
  try {
    // Generate a temporary property ID for image upload
    const tempPropertyId = 'TEMP-' + Date.now();
    
    // Upload images first
    const imageUrls = await uploadImages(imageFiles, tempPropertyId);
    
    if (imageUrls.length === 0) {
      throw new Error('No images were uploaded successfully');
    }
    
    // Prepare listing data with uploaded image URLs
    const listingData = {
      title: formData.get('title'),
      location: formData.get('location'),
      price: formData.get('price'),
      bedrooms: formData.get('bedrooms'),
      bathrooms: formData.get('bathrooms'),
      sqft: formData.get('sqft') || '',
      description: formData.get('description') || '',
      images: imageUrls.join('\n'), // Store as newline-separated URLs
      featured: formData.get('featured') === 'on'
    };
    
    // Create FormData to avoid CORS preflight
    const apiFormData = new FormData();
    apiFormData.append('action', 'addListing');
    apiFormData.append('listingType', 'house');
    apiFormData.append('listingData', JSON.stringify(listingData));
    
    const response = await fetch(CONFIG.SCRIPT_URL, {
      method: 'POST',
      body: apiFormData
    });
    
    const data = await response.json();
    
    if (data.status === 'success') {
      // Close modal
      $('#addHouseModal').modal('hide');
      
      // Reset form and clear preview
      form.reset();
      document.getElementById('house-image-preview').innerHTML = '';
      
      // Show success message
      showToast('House listing added successfully!');
      
      // Reload listings
      await loadListings('houses');
    } else {
      alert('Error: ' + (data.message || 'Failed to add listing'));
    }
    
  } catch (error) {
    console.error('Error adding house:', error);
    alert('Error: ' + error.message);
  } finally {
    setButtonLoading(btn, false);
  }
}

/**
 * Handle add land form submission
 */
async function handleAddLand(e) {
  e.preventDefault();
  
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  const formData = new FormData(form);
  
  // Get image file
  const imageFile = document.getElementById('land-image').files[0];
  
  if (!imageFile) {
    alert('Please select an image for the land plot.');
    return;
  }
  
  // Show loading
  setButtonLoading(btn, true);
  
  try {
    // Generate a temporary property ID for image upload
    const tempPropertyId = 'TEMP-' + Date.now();
    
    // Upload image
    const imageUrls = await uploadImages([imageFile], tempPropertyId);
    
    if (imageUrls.length === 0) {
      throw new Error('Image upload failed');
    }
    
    // Prepare listing data with uploaded image URL
    const listingData = {
      title: formData.get('title'),
      location: formData.get('location'),
      price: formData.get('price'),
      plotSize: formData.get('plotSize'),
      area: formData.get('area') || '',
      description: formData.get('description') || '',
      image: imageUrls[0], // Single image URL
      featured: formData.get('featured') === 'on'
    };
    
    // Create FormData to avoid CORS preflight
    const apiFormData = new FormData();
    apiFormData.append('action', 'addListing');
    apiFormData.append('listingType', 'land');
    apiFormData.append('listingData', JSON.stringify(listingData));
    
    const response = await fetch(CONFIG.SCRIPT_URL, {
      method: 'POST',
      body: apiFormData
    });
    
    const data = await response.json();
    
    if (data.status === 'success') {
      // Close modal
      $('#addLandModal').modal('hide');
      
      // Reset form and clear preview
      form.reset();
      document.getElementById('land-image-preview').innerHTML = '';
      
      // Show success message
      showToast('Land listing added successfully!');
      
      // Reload listings
      await loadListings('land');
    } else {
      alert('Error: ' + (data.message || 'Failed to add listing'));
    }
    
  } catch (error) {
    console.error('Error adding land:', error);
    alert('Error: ' + error.message);
  } finally {
    setButtonLoading(btn, false);
  }
}

/**
 * Edit house listing
 */
function editHouse(id) {
  const house = housesData.find(h => h.id === id);
  if (!house) {
    alert('Listing not found');
    return;
  }
  
  // Populate form
  document.getElementById('edit-house-id').value = house.id;
  document.getElementById('edit-house-title').value = house.title;
  document.getElementById('edit-house-location').value = house.location;
  document.getElementById('edit-house-price').value = house.price;
  document.getElementById('edit-house-bedrooms').value = house.bedrooms;
  document.getElementById('edit-house-bathrooms').value = house.bathrooms;
  document.getElementById('edit-house-sqft').value = house.sqft || '';
  document.getElementById('edit-house-description').value = house.description || '';
  document.getElementById('edit-house-featured').checked = house.featured === 'Yes';
  
  // Show current images in preview
  const previewContainer = document.getElementById('edit-house-image-preview');
  previewContainer.innerHTML = '';
  
  if (house.images) {
    const imageUrls = house.images.split('\n').filter(url => url.trim());
    imageUrls.forEach((url, index) => {
      const previewItem = document.createElement('div');
      previewItem.className = 'image-preview-item';
      previewItem.innerHTML = `
        <img src="${url}" alt="Current Image ${index + 1}">
        <small style="position: absolute; bottom: 5px; left: 5px; background: rgba(0,0,0,0.7); color: white; padding: 2px 5px; font-size: 10px; border-radius: 3px;">Current</small>
      `;
      previewContainer.appendChild(previewItem);
    });
  }
  
  // Clear file input
  document.getElementById('edit-house-images-input').value = '';
  
  // Show modal
  $('#editHouseModal').modal('show');
}

/**
 * Edit land listing
 */
function editLand(id) {
  const land = landData.find(l => l.id === id);
  if (!land) {
    alert('Listing not found');
    return;
  }
  
  // Populate form
  document.getElementById('edit-land-id').value = land.id;
  document.getElementById('edit-land-title').value = land.title;
  document.getElementById('edit-land-location').value = land.location;
  document.getElementById('edit-land-price').value = land.price;
  document.getElementById('edit-land-plotSize').value = land.plotsize || land.plotSize;
  document.getElementById('edit-land-area').value = land.area || '';
  document.getElementById('edit-land-description').value = land.description || '';
  document.getElementById('edit-land-featured').checked = land.featured === 'Yes';
  
  // Show current image in preview
  const previewContainer = document.getElementById('edit-land-image-preview');
  previewContainer.innerHTML = '';
  
  if (land.image) {
    const previewItem = document.createElement('div');
    previewItem.className = 'image-preview-item';
    previewItem.innerHTML = `
      <img src="${land.image}" alt="Current Image">
      <small style="position: absolute; bottom: 5px; left: 5px; background: rgba(0,0,0,0.7); color: white; padding: 2px 5px; font-size: 10px; border-radius: 3px;">Current</small>
    `;
    previewContainer.appendChild(previewItem);
  }
  
  // Clear file input
  document.getElementById('edit-land-image-input').value = '';
  
  // Show modal
  $('#editLandModal').modal('show');
}

/**
 * Handle edit house form submission
 */
async function handleEditHouse(e) {
  e.preventDefault();
  
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  const formData = new FormData(form);
  const listingId = formData.get('id');
  
  // Show loading
  setButtonLoading(btn, true);
  
  try {
    // Check if new images were uploaded
    const newImageFiles = document.getElementById('edit-house-images-input').files;
    let imageUrls = null;
    
    if (newImageFiles.length > 0) {
      // Upload new images
      imageUrls = await uploadImages(newImageFiles, listingId);
      if (imageUrls.length === 0) {
        throw new Error('No images were uploaded successfully');
      }
    }
    
    // Get form data
    const listingData = {
      title: formData.get('title'),
      location: formData.get('location'),
      price: formData.get('price'),
      bedrooms: formData.get('bedrooms'),
      bathrooms: formData.get('bathrooms'),
      sqft: formData.get('sqft') || '',
      description: formData.get('description') || '',
      featured: formData.get('featured') === 'on'
    };
    
    // Only update images if new ones were uploaded
    if (imageUrls) {
      listingData.images = imageUrls.join('\n');
    }
    
    // Create FormData to avoid CORS preflight
    const apiFormData = new FormData();
    apiFormData.append('action', 'updateListing');
    apiFormData.append('listingType', 'house');
    apiFormData.append('listingId', listingId);
    apiFormData.append('listingData', JSON.stringify(listingData));
    
    const response = await fetch(CONFIG.SCRIPT_URL, {
      method: 'POST',
      body: apiFormData
    });
    
    const data = await response.json();
    
    if (data.status === 'success') {
      // Close modal
      $('#editHouseModal').modal('hide');
      
      // Show success message
      showToast('House listing updated successfully!');
      
      // Reload listings
      await loadListings('houses');
    } else {
      alert('Error: ' + (data.message || 'Failed to update listing'));
    }
    
  } catch (error) {
    console.error('Error updating house:', error);
    alert('Error: ' + error.message);
  } finally {
    setButtonLoading(btn, false);
  }
}

/**
 * Handle edit land form submission
 */
async function handleEditLand(e) {
  e.preventDefault();
  
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  const formData = new FormData(form);
  const listingId = formData.get('id');
  
  // Show loading
  setButtonLoading(btn, true);
  
  try {
    // Check if new image was uploaded
    const newImageFile = document.getElementById('edit-land-image-input').files[0];
    let imageUrl = null;
    
    if (newImageFile) {
      // Upload new image
      const imageUrls = await uploadImages([newImageFile], listingId);
      if (imageUrls.length === 0) {
        throw new Error('Image upload failed');
      }
      imageUrl = imageUrls[0];
    }
    
    // Get form data
    const listingData = {
      title: formData.get('title'),
      location: formData.get('location'),
      price: formData.get('price'),
      plotSize: formData.get('plotSize'),
      area: formData.get('area') || '',
      description: formData.get('description') || '',
      featured: formData.get('featured') === 'on'
    };
    
    // Only update image if new one was uploaded
    if (imageUrl) {
      listingData.image = imageUrl;
    }
    
    // Create FormData to avoid CORS preflight
    const apiFormData = new FormData();
    apiFormData.append('action', 'updateListing');
    apiFormData.append('listingType', 'land');
    apiFormData.append('listingId', listingId);
    apiFormData.append('listingData', JSON.stringify(listingData));
    
    const response = await fetch(CONFIG.SCRIPT_URL, {
      method: 'POST',
      body: apiFormData
    });
    
    const data = await response.json();
    
    if (data.status === 'success') {
      // Close modal
      $('#editLandModal').modal('hide');
      
      // Show success message
      showToast('Land listing updated successfully!');
      
      // Reload listings
      await loadListings('land');
    } else {
      alert('Error: ' + (data.message || 'Failed to update listing'));
    }
    
  } catch (error) {
    console.error('Error updating land:', error);
    alert('Connection error. Please try again.');
  } finally {
    setButtonLoading(btn, false);
  }
}

/**
 * Toggle listing visibility
 */
async function toggleVisibility(type, id) {
  if (!confirm('Toggle visibility for this listing?')) {
    return;
  }
  
  try {
    // Create FormData to avoid CORS preflight
    const formData = new FormData();
    formData.append('action', 'toggleVisibility');
    formData.append('listingType', type);
    formData.append('listingId', id);
    
    const response = await fetch(CONFIG.SCRIPT_URL, {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (data.status === 'success') {
      showToast('Visibility toggled successfully!');
      
      // Reload listings
      await loadListings(type === 'house' ? 'houses' : 'land');
    } else {
      alert('Error: ' + (data.message || 'Failed to toggle visibility'));
    }
    
  } catch (error) {
    console.error('Error toggling visibility:', error);
    alert('Connection error. Please try again.');
  }
}

/**
 * Delete listing
 */
async function deleteListing(type, id) {
  if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
    return;
  }
  
  try {
    // Create FormData to avoid CORS preflight
    const formData = new FormData();
    formData.append('action', 'deleteListing');
    formData.append('listingType', type);
    formData.append('listingId', id);
    
    const response = await fetch(CONFIG.SCRIPT_URL, {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (data.status === 'success') {
      showToast('Listing deleted successfully!');
      
      // Reload listings
      await loadListings(type === 'house' ? 'houses' : 'land');
    } else {
      alert('Error: ' + (data.message || 'Failed to delete listing'));
    }
    
  } catch (error) {
    console.error('Error deleting listing:', error);
    alert('Connection error. Please try again.');
  }
}

/**
 * Show toast notification
 */
function showToast(message) {
  const toast = document.getElementById('success-toast');
  const messageSpan = document.getElementById('toast-message');
  
  messageSpan.textContent = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

/**
 * Show error message
 */
function showError(element, message) {
  element.textContent = message;
  element.style.display = 'block';
}

/**
 * Hide error message
 */
function hideError(element) {
  element.style.display = 'none';
}

/**
 * Set button loading state
 */
function setButtonLoading(btn, isLoading) {
  const textSpan = btn.querySelector('.btn-text');
  const spinner = btn.querySelector('.spinner-border');
  
  if (isLoading) {
    btn.disabled = true;
    textSpan.style.display = 'none';
    spinner.classList.remove('d-none');
  } else {
    btn.disabled = false;
    textSpan.style.display = 'inline';
    spinner.classList.add('d-none');
  }
}
