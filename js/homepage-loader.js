/**
 * Homepage Featured Properties Dynamic Loader
 * Loads featured properties from Google Apps Script backend
 */

// Configuration
const HOMEPAGE_CONFIG = {
  SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwEvIZ4MVS8qWuilYPxcAs1lfuS4ll6EImK3G52FRR-Owm2wIn5o-y8obqu1XNoY7-4QQ/exec', // Replace with your deployed Apps Script URL
  CACHE_KEY: 'homepage_featured_properties',
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  MAX_FEATURED_HOUSES: 3,
  MAX_FEATURED_LAND: 3
};

/**
 * Initialize on page load
 */
document.addEventListener('DOMContentLoaded', function() {
  loadFeaturedProperties();
});

/**
 * Load featured properties from server or cache
 */
async function loadFeaturedProperties() {
  // Check cache first
  const cachedData = getCachedData();
  if (cachedData) {
    console.log('Loading featured properties from cache');
    renderFeaturedProperties(cachedData);
    return;
  }
  
  // Show skeleton loaders
  showHomepageSkeletons();
  
  try {
    const response = await fetch(`${HOMEPAGE_CONFIG.SCRIPT_URL}?action=getPublicListings&type=all&featured=true`, {
      method: 'GET'
    });
    
    const data = await response.json();
    
    if (data.status === 'success') {
      // Cache the data
      cacheHomepageData(data);
      
      // Hide skeletons and render properties
      hideHomepageSkeletons();
      renderFeaturedProperties(data);
    } else {
      console.error('Failed to load featured properties:', data.message);
      hideHomepageSkeletons();
      showFallbackContent();
    }
    
  } catch (error) {
    console.error('Error loading featured properties:', error);
    hideHomepageSkeletons();
    showFallbackContent();
  }
}

/**
 * Render featured properties
 */
function renderFeaturedProperties(data) {
  const housesContainer = document.getElementById('featured-houses-container');
  const landContainer = document.getElementById('featured-land-container');
  
  if (!housesContainer || !landContainer) {
    console.error('Featured property containers not found');
    return;
  }
  
  // Filter featured houses and land
  const featuredHouses = (data.houses || []).filter(house => 
    (house.featured === 'Yes' || house.featured === true) && 
    (house.visible === 'Yes' || house.visible === true)
  );
  const featuredLand = (data.land || []).filter(land => 
    (land.featured === 'Yes' || land.featured === true) && 
    (land.visible === 'Yes' || land.visible === true)
  );
  
  console.log('Featured properties found:', { 
    houses: featuredHouses.length, 
    land: featuredLand.length,
    allHouses: data.houses?.length || 0,
    allLand: data.land?.length || 0
  });
  
  // Limit to max featured items
  const housesToShow = featuredHouses.slice(0, HOMEPAGE_CONFIG.MAX_FEATURED_HOUSES);
  const landToShow = featuredLand.slice(0, HOMEPAGE_CONFIG.MAX_FEATURED_LAND);
  
  // Render houses
  if (housesToShow.length > 0) {
    housesContainer.innerHTML = housesToShow.map(house => createHouseCard(house)).join('');
    console.log('Featured houses rendered:', housesToShow.length);
    console.log('Houses container innerHTML length:', housesContainer.innerHTML.length);
    console.log('Houses container visible:', housesContainer.offsetHeight > 0);
  } else {
    // Keep existing static content if no featured houses
    console.log('No featured houses found, keeping static content');
  }
  
  // Render land
  if (landToShow.length > 0) {
    landContainer.innerHTML = landToShow.map(land => createLandCard(land)).join('');
    console.log('Featured land rendered:', landToShow.length);
    console.log('Land container innerHTML length:', landContainer.innerHTML.length);
    console.log('Land container visible:', landContainer.offsetHeight > 0);
  } else {
    // Keep existing static content if no featured land
    console.log('No featured land found, keeping static content');
  }
  
  // Initialize carousel for dynamically loaded properties
  initializeHomepageCarousels();
}

/**
 * Create house card HTML
 */
function createHouseCard(house) {
  const images = house.images ? house.images.split('\n').filter(img => img.trim()) : [];
  const carouselImages = images.length > 0 ? images : ['images/placeholder.jpg'];
  
  return `
    <div class="col-md-4">
      <div class="property-wrap ftco-animate">
        <div class="property-carousel" style="position: relative; height: 400px; overflow: hidden;">
          <div class="carousel-images">
            ${carouselImages.map((img, index) => `
              <div class="carousel-slide ${index === 0 ? 'active' : ''}" 
                   style="background-image: url('${img}'); height: 400px; background-size: cover; background-position: center;">
              </div>
            `).join('')}
          </div>
          ${carouselImages.length > 1 ? `
            <button class="carousel-control prev" onclick="moveSlide(this, -1)" 
                    style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); 
                           background: rgba(0,0,0,0.5); color: white; border: none; padding: 15px 10px; 
                           cursor: pointer; font-size: 18px; z-index: 10; border-radius: 3px;">❮</button>
            <button class="carousel-control next" onclick="moveSlide(this, 1)" 
                    style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); 
                           background: rgba(0,0,0,0.5); color: white; border: none; padding: 15px 10px; 
                           cursor: pointer; font-size: 18px; z-index: 10; border-radius: 3px;">❯</button>
          ` : ''}
        </div>
        <div class="text">
          <p class="price mb-3">
            <span class="orig-price" style="color: #0D3B66; font-size: 32px; font-weight: 800;">
              GHS ${Number(house.price).toLocaleString()}
            </span>
          </p>
          ${house.features ? `
          <div class="mb-3">
            <span class="badge badge-success" style="font-size: 14px; padding: 8px 15px;">Featured</span>
          </div>
          ` : ''}
          <ul class="property_list">
            <li><span class="flaticon-bed"></span>${house.bedrooms || 'N/A'} Bedrooms</li>
            <li><span class="flaticon-bathtub"></span>${house.bathrooms || 'N/A'} Bathrooms</li>
            <li><span class="ion-ios-pin"></span>${house.location || 'Location'}</li>
          </ul>
          <h3><a href="properties.html" style="color: #0D3B66;">${house.title || 'House for Sale'}</a></h3>
          <span class="location" style="font-size: 14px; color: #666;">
            ${house.description ? house.description.substring(0, 80) + '...' : house.location}
          </span>
          <a href="properties.html" class="d-flex align-items-center justify-content-center btn-custom">
            <span class="ion-ios-arrow-forward"></span>
          </a>
        </div>
      </div>
    </div>
  `;
}

/**
 * Create land card HTML
 */
function createLandCard(land) {
  const image = land.image || 'images/placeholder.jpg';
  
  return `
    <div class="col-md-4">
      <div class="property-wrap ftco-animate">
        <div class="img d-flex align-items-center justify-content-center" 
             style="background-image: url('${image}'); height: 400px;">
          <div class="icon d-flex align-items-center justify-content-center">
            <span class="ion-ios-link"></span>
          </div>
        </div>
        <div class="text">
          <p class="price mb-3">
            <span class="orig-price" style="color: #0D3B66; font-size: 32px; font-weight: 800;">
              GHS ${Number(land.price).toLocaleString()}
            </span>
          </p>
          ${land.featured ? `
          <div class="mb-3">
            <span class="badge badge-success" style="font-size: 14px; padding: 8px 15px;">Featured</span>
          </div>
          ` : ''}
          <ul class="property_list">
            <li><span class="ion-ios-pin"></span>${land.location || 'Location'}</li>
            ${land.plotSize ? `<li><span class="flaticon-bed"></span>Plot: ${land.plotSize}</li>` : ''}
            ${land.area ? `<li><span class="flaticon-bathtub"></span>Area: ${land.area}</li>` : ''}
          </ul>
          <h3><a href="index.html#request-form" style="color: #0D3B66;">${land.title || 'Land for Sale'}</a></h3>
          <span class="location" style="font-size: 14px; color: #666;">
            ${land.description ? land.description.substring(0, 80) + '...' : land.location}
          </span>
          <a href="index.html#request-form" class="d-flex align-items-center justify-content-center btn-custom">
            <span class="ion-ios-arrow-forward"></span>
          </a>
        </div>
      </div>
    </div>
  `;
}

/**
 * Show skeleton loaders
 */
function showHomepageSkeletons() {
  const houseSkeleton = document.getElementById('houses-skeleton');
  const landSkeleton = document.getElementById('land-skeleton');
  const housesContainer = document.getElementById('featured-houses-container');
  const landContainer = document.getElementById('featured-land-container');
  
  if (houseSkeleton) houseSkeleton.style.display = 'flex';
  if (landSkeleton) landSkeleton.style.display = 'flex';
  if (housesContainer) housesContainer.style.display = 'none';
  if (landContainer) landContainer.style.display = 'none';
}

/**
 * Hide skeleton loaders
 */
function hideHomepageSkeletons() {
  const houseSkeleton = document.getElementById('houses-skeleton');
  const landSkeleton = document.getElementById('land-skeleton');
  const housesContainer = document.getElementById('featured-houses-container');
  const landContainer = document.getElementById('featured-land-container');
  
  if (houseSkeleton) houseSkeleton.style.display = 'none';
  if (landSkeleton) landSkeleton.style.display = 'none';
  if (housesContainer) housesContainer.style.display = 'flex';
  if (landContainer) landContainer.style.display = 'flex';
}

/**
 * Show fallback content (keep static HTML)
 */
function showFallbackContent() {
  console.log('Using fallback static content');
  hideHomepageSkeletons();
  // Static content will remain visible
}

/**
 * Cache data
 */
function cacheHomepageData(data) {
  try {
    const cacheObject = {
      data: data,
      timestamp: Date.now()
    };
    localStorage.setItem(HOMEPAGE_CONFIG.CACHE_KEY, JSON.stringify(cacheObject));
  } catch (error) {
    console.error('Error caching data:', error);
  }
}

/**
 * Get cached data if valid
 */
function getCachedData() {
  try {
    const cached = localStorage.getItem(HOMEPAGE_CONFIG.CACHE_KEY);
    if (!cached) return null;
    
    const cacheObject = JSON.parse(cached);
    const age = Date.now() - cacheObject.timestamp;
    
    if (age < HOMEPAGE_CONFIG.CACHE_DURATION) {
      return cacheObject.data;
    }
    
    // Clear expired cache
    localStorage.removeItem(HOMEPAGE_CONFIG.CACHE_KEY);
    return null;
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
}

/**
 * Initialize carousels for dynamically loaded properties
 */
function initializeHomepageCarousels() {
  // Carousel initialization is handled by the existing moveSlide function in index.html
  console.log('Homepage carousels ready');
}
