/**
 * Admin Panel JavaScript for Prime Global Properties
 * Handles authentication, CRUD operations, and UI interactions
 */

// Configuration
const CONFIG = {
  SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwEvIZ4MVS8qWuilYPxcAs1lfuS4ll6EImK3G52FRR-Owm2wIn5o-y8obqu1XNoY7-4QQ/exec', // Replace after deployment
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
  const firstImage = images[0] || 'images/placeholder.jpg';
  const isHidden = house.visible === 'No';
  
  return `
    <div class="listing-card ${isHidden ? 'hidden' : ''}">
      ${house.featured === 'Yes' ? '<div class="listing-badge">Featured</div>' : ''}
      ${isHidden ? '<div class="listing-badge hidden-badge">Hidden</div>' : ''}
      <img src="${firstImage}" alt="${house.title}" class="listing-image" onerror="this.src='images/placeholder.jpg'">
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
  
  return `
    <div class="listing-card ${isHidden ? 'hidden' : ''}">
      ${land.featured === 'Yes' ? '<div class="listing-badge">Featured</div>' : ''}
      ${isHidden ? '<div class="listing-badge hidden-badge">Hidden</div>' : ''}
      <img src="${land.image}" alt="${land.title}" class="listing-image" onerror="this.src='images/placeholder.jpg'">
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
  
  // Get form data
  const formData = new FormData(form);
  const listingData = {
    title: formData.get('title'),
    location: formData.get('location'),
    price: formData.get('price'),
    bedrooms: formData.get('bedrooms'),
    bathrooms: formData.get('bathrooms'),
    sqft: formData.get('sqft') || '',
    description: formData.get('description') || '',
    images: formData.get('images'),
    featured: formData.get('featured') === 'on'
  };
  
  // Show loading
  setButtonLoading(btn, true);
  
  try {
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
      
      // Reset form
      form.reset();
      
      // Show success message
      showToast('House listing added successfully!');
      
      // Reload listings
      await loadListings('houses');
    } else {
      alert('Error: ' + (data.message || 'Failed to add listing'));
    }
    
  } catch (error) {
    console.error('Error adding house:', error);
    alert('Connection error. Please try again.');
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
  
  // Get form data
  const formData = new FormData(form);
  const listingData = {
    title: formData.get('title'),
    location: formData.get('location'),
    price: formData.get('price'),
    plotSize: formData.get('plotSize'),
    area: formData.get('area') || '',
    description: formData.get('description') || '',
    image: formData.get('image'),
    featured: formData.get('featured') === 'on'
  };
  
  // Show loading
  setButtonLoading(btn, true);
  
  try {
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
      
      // Reset form
      form.reset();
      
      // Show success message
      showToast('Land listing added successfully!');
      
      // Reload listings
      await loadListings('land');
    } else {
      alert('Error: ' + (data.message || 'Failed to add listing'));
    }
    
  } catch (error) {
    console.error('Error adding land:', error);
    alert('Connection error. Please try again.');
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
  document.getElementById('edit-house-images').value = house.images || '';
  document.getElementById('edit-house-featured').checked = house.featured === 'Yes';
  
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
  document.getElementById('edit-land-image').value = land.image || '';
  document.getElementById('edit-land-featured').checked = land.featured === 'Yes';
  
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
  
  // Get form data
  const formData = new FormData(form);
  const listingData = {
    title: formData.get('title'),
    location: formData.get('location'),
    price: formData.get('price'),
    bedrooms: formData.get('bedrooms'),
    bathrooms: formData.get('bathrooms'),
    sqft: formData.get('sqft') || '',
    description: formData.get('description') || '',
    images: formData.get('images'),
    featured: formData.get('featured') === 'on'
  };
  
  const listingId = formData.get('id');
  
  // Show loading
  setButtonLoading(btn, true);
  
  try {
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
    alert('Connection error. Please try again.');
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
  
  // Get form data
  const formData = new FormData(form);
  const listingData = {
    title: formData.get('title'),
    location: formData.get('location'),
    price: formData.get('price'),
    plotSize: formData.get('plotSize'),
    area: formData.get('area') || '',
    description: formData.get('description') || '',
    image: formData.get('image'),
    featured: formData.get('featured') === 'on'
  };
  
  const listingId = formData.get('id');
  
  // Show loading
  setButtonLoading(btn, true);
  
  try {
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
