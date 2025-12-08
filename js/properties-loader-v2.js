/**
 * Properties Loader V2 - Complete Rewrite
 * Clean implementation for dynamic property loading
 */

(function() {
  'use strict';
  
  // Configuration
  const CONFIG = {
    API_URL: 'https://script.google.com/macros/s/AKfycbw_5waGkgqb_sHB7aN0PLBwTgPbGW6vmboTPz8vNuI9weFwljD3DvF76bv7-8XfO7U-/exec',
    CACHE_KEY: 'pgp_properties_v2',
    CACHE_DURATION: 5 * 60 * 1000 // 5 minutes
  };
  
  // DOM Elements
  const elements = {
    housesContainer: null,
    landContainer: null,
    housesSkeleton: null,
    landSkeleton: null
  };
  
  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', init);
  
  function init() {
    // Get DOM elements
    elements.housesContainer = document.getElementById('houses-container');
    elements.landContainer = document.getElementById('land-container');
    elements.housesSkeleton = document.getElementById('houses-skeleton');
    elements.landSkeleton = document.getElementById('land-skeleton');
    
    console.log('Properties Loader V2 initialized');
    console.log('Containers found:', {
      houses: !!elements.housesContainer,
      land: !!elements.landContainer,
      housesSkeleton: !!elements.housesSkeleton,
      landSkeleton: !!elements.landSkeleton
    });
    
    // Load properties
    loadProperties();
  }
  
  async function loadProperties() {
    try {
      // Check cache first
      const cached = getCache();
      if (cached) {
        console.log('Loading from cache');
        displayProperties(cached.houses, cached.land);
        return;
      }
      
      // Show skeletons
      showSkeletons();
      
      // Fetch from API
      const apiUrl = `${CONFIG.API_URL}?action=getPublicListings&type=all&t=${Date.now()}`;
      console.log('Fetching from API:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      const data = await response.json();
      console.log('API Response:', data);
      
      if (data.status === 'success') {
        console.log('✅ Data loaded successfully');
        console.log('Houses:', data.houses?.length || 0);
        console.log('Land:', data.land?.length || 0);
        
        // Cache the data
        setCache({ houses: data.houses || [], land: data.land || [] });
        
        // Display properties
        displayProperties(data.houses || [], data.land || []);
      } else {
        console.error('❌ API Error:', data.message);
        showError();
      }
      
    } catch (error) {
      console.error('❌ Load Error:', error);
      console.error('Error stack:', error.stack);
      showError();
    }
  }
  
  function displayProperties(houses, land) {
    console.log('Displaying properties:', { housesCount: houses?.length || 0, landCount: land?.length || 0 });
    
    // Hide skeletons
    hideSkeletons();
    
    // Render houses
    if (houses && houses.length > 0 && elements.housesContainer) {
      elements.housesContainer.innerHTML = houses.map(house => createHouseHTML(house)).join('');
      console.log('✅ Houses rendered:', houses.length);
    } else {
      console.warn('No houses to display');
    }
    
    // Render land
    if (land && land.length > 0 && elements.landContainer) {
      elements.landContainer.innerHTML = land.map(plot => createLandHTML(plot)).join('');
      console.log('✅ Land plots rendered:', land.length);
    } else {
      console.warn('No land plots to display');
    }
    
    // Initialize carousels after a short delay
    setTimeout(initCarousels, 100);
  }
  
  function createHouseHTML(house) {
    const images = house.images ? house.images.split('\n').filter(img => img.trim()) : [];
    const mainImage = images[0] || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="18" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
    const hasMultipleImages = images.length > 1;
    
    return `
      <div class="col-md-4" style="margin-bottom: 30px; opacity: 1; visibility: visible;">
        <div class="property-wrap">
          ${hasMultipleImages ? createImageCarousel(images, house.featured === 'Yes') : createSingleImage(mainImage, house.featured === 'Yes')}
          <div class="text" style="padding: 25px;">
            <p class="price mb-3">
              <span style="color: #F96D00; font-size: 28px; font-weight: 700;">GHS ${Number(house.price || 0).toLocaleString()}</span>
            </p>
            <h3 class="mb-2">
              <a href="index.html#request-form" style="color: #232526; font-weight: 600; text-decoration: none;">
                ${house.title || 'House for Sale'}
              </a>
            </h3>
            <p class="location mb-3" style="color: #999;">
              <span class="icon-map-marker" style="margin-right: 5px;"></span>
              ${house.location || 'Ghana'}
            </p>
            <ul class="property_list mb-3" style="list-style: none; padding: 0; display: flex; gap: 15px; flex-wrap: wrap;">
              <li style="color: #666; font-size: 14px;">
                <span class="flaticon-bed" style="margin-right: 3px;"></span> ${house.bedrooms || 0} Beds
              </li>
              <li style="color: #666; font-size: 14px;">
                <span class="flaticon-bathtub" style="margin-right: 3px;"></span> ${house.bathrooms || 0} Baths
              </li>
              ${house.sqft ? `<li style="color: #666; font-size: 14px;">${Number(house.sqft).toLocaleString()} sqft</li>` : ''}
            </ul>
            ${house.description ? `<p style="font-size: 14px; color: #666; margin-bottom: 15px;">${house.description.substring(0, 100)}${house.description.length > 100 ? '...' : ''}</p>` : ''}
            <a href="index.html#request-form" class="btn btn-primary" style="width: 100%; text-align: center;">View Details</a>
          </div>
        </div>
      </div>
    `;
  }
  
  function createImageCarousel(images, isFeatured) {
    return `
      <div class="property-carousel" style="position: relative; height: 400px; overflow: hidden;">
        ${images.map((img, i) => `
          <div class="carousel-slide ${i === 0 ? 'active' : ''}" style="background-image: url('${img.trim()}'); height: 400px; background-size: cover; background-position: center; ${i === 0 ? 'display: block !important; opacity: 1 !important; position: relative !important;' : 'display: none !important; position: absolute !important; width: 100%; top: 0; left: 0; opacity: 0 !important;'}">
            ${isFeatured && i === 0 ? '<span class="status" style="position: absolute; top: 10px; left: 10px; background: #F96D00; color: white; padding: 5px 15px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); z-index: 2;">FEATURED</span>' : ''}
          </div>
        `).join('')}
        <button class="carousel-prev" onclick="moveSlide(this, -1)" 
                style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.5); color: white; border: none; cursor: pointer; z-index: 3; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 20px; line-height: 1; transition: all 0.3s ease;">‹</button>
        <button class="carousel-next" onclick="moveSlide(this, 1)" 
                style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.5); color: white; border: none; cursor: pointer; z-index: 3; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 20px; line-height: 1; transition: all 0.3s ease;">›</button>
      </div>
    `;
  }
  
  function createSingleImage(imageUrl, isFeatured) {
    return `
      <div class="img" style="background-image: url('${imageUrl}'); height: 400px; background-size: cover; background-position: center; position: relative;">
        ${isFeatured ? '<span class="status" style="position: absolute; top: 10px; left: 10px; background: #F96D00; color: white; padding: 5px 15px; font-size: 12px; font-weight: 600; z-index: 2;">FEATURED</span>' : ''}
      </div>
    `;
  }
  
  function createLandHTML(land) {
    const landImage = land.image || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="18" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
    return `
      <div class="col-md-4" style="margin-bottom: 30px; opacity: 1; visibility: visible;">
        <div class="property-wrap">
          <div class="img" style="background-image: url('${landImage}'); height: 400px; background-size: cover; background-position: center; position: relative;">
            ${land.featured === 'Yes' ? '<span class="status" style="position: absolute; top: 10px; left: 10px; background: #F96D00; color: white; padding: 5px 15px; font-size: 12px; font-weight: 600; z-index: 2;">FEATURED</span>' : ''}
          </div>
          <div class="text" style="padding: 25px;">
            <p class="price mb-3">
              <span style="color: #F96D00; font-size: 28px; font-weight: 700;">GHS ${Number(land.price || 0).toLocaleString()}</span>
            </p>
            <h3 class="mb-2">
              <a href="index.html#request-form" style="color: #232526; font-weight: 600; text-decoration: none;">
                ${land.title || 'Land for Sale'}
              </a>
            </h3>
            <p class="location mb-3" style="color: #999;">
              <span class="icon-map-marker" style="margin-right: 5px;"></span>
              ${land.location || 'Ghana'}
            </p>
            <ul class="property_list mb-3" style="list-style: none; padding: 0;">
              <li style="color: #666; font-size: 14px; margin-bottom: 5px;">
                <strong>Plot Size:</strong> ${land.plotsize || land['plot size'] || 'N/A'}
              </li>
              ${land.area ? `<li style="color: #666; font-size: 14px; margin-bottom: 5px;"><strong>Area:</strong> ${Number(land.area).toLocaleString()} sqft</li>` : ''}
            </ul>
            ${land.description ? `<p style="font-size: 14px; color: #666; margin-bottom: 15px;">${land.description.substring(0, 100)}${land.description.length > 100 ? '...' : ''}</p>` : ''}
            <a href="index.html#request-form" class="btn btn-primary" style="width: 100%; text-align: center;">View Details</a>
          </div>
        </div>
      </div>
    `;
  }
  
  function showSkeletons() {
    if (elements.housesSkeleton) elements.housesSkeleton.style.display = 'flex';
    if (elements.landSkeleton) elements.landSkeleton.style.display = 'flex';
    if (elements.housesContainer) elements.housesContainer.style.display = 'none';
    if (elements.landContainer) elements.landContainer.style.display = 'none';
  }
  
  function hideSkeletons() {
    if (elements.housesSkeleton) elements.housesSkeleton.style.display = 'none';
    if (elements.landSkeleton) elements.landSkeleton.style.display = 'none';
    if (elements.housesContainer) {
      elements.housesContainer.style.display = 'flex';
      elements.housesContainer.style.flexWrap = 'wrap';
    }
    if (elements.landContainer) {
      elements.landContainer.style.display = 'flex';
      elements.landContainer.style.flexWrap = 'wrap';
    }
  }
  
  function showError() {
    hideSkeletons();
    const errorHTML = `
      <div class="col-12 text-center py-5">
        <p style="color: #999; font-size: 16px;">Unable to load properties. Please try again later.</p>
        <button onclick="location.reload()" class="btn btn-primary mt-3">Refresh Page</button>
      </div>
    `;
    if (elements.housesContainer) {
      elements.housesContainer.style.display = 'block';
      elements.housesContainer.innerHTML = errorHTML;
    }
  }
  
  function initCarousels() {
    // Placeholder for carousel initialization if needed
    console.log('Carousels initialized');
  }
  
  // Cache functions
  function getCache() {
    try {
      const cached = localStorage.getItem(CONFIG.CACHE_KEY);
      if (!cached) return null;
      
      const data = JSON.parse(cached);
      if (Date.now() - data.timestamp > CONFIG.CACHE_DURATION) {
        localStorage.removeItem(CONFIG.CACHE_KEY);
        return null;
      }
      
      return data;
    } catch (e) {
      return null;
    }
  }
  
  function setCache(data) {
    try {
      localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify({
        ...data,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.warn('Cache save failed:', e);
    }
  }
  
})();
