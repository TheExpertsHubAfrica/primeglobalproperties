/**
 * Dynamic Property Loading for Prime Global Properties
 * Fetches and displays properties from Google Sheets backend
 */

// Configuration
const PROPERTIES_CONFIG = {
  SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwEvIZ4MVS8qWuilYPxcAs1lfuS4ll6EImK3G52FRR-Owm2wIn5o-y8obqu1XNoY7-4QQ/exec', // Replace after deployment
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes cache
  CACHE_KEY: 'pgp_properties_cache'
};

// Verify script URL is configured
if (!PROPERTIES_CONFIG.SCRIPT_URL || PROPERTIES_CONFIG.SCRIPT_URL.includes('YOUR_')) {
  console.warn('⚠️ Google Apps Script URL not configured. Please update PROPERTIES_CONFIG.SCRIPT_URL');
}

/**
 * Load properties on page load
 */
document.addEventListener('DOMContentLoaded', function() {
  loadPropertiesData();
});

/**
 * Load properties from server or cache
 */
async function loadPropertiesData() {
  // Check cache first
  const cachedData = getCachedData();
  if (cachedData) {
    console.log('Loading properties from cache');
    renderProperties(cachedData.houses, cachedData.land);
    return;
  }
  
  // Show skeleton loaders
  showSkeletonLoaders();
  
  try {
    const response = await fetch(`${PROPERTIES_CONFIG.SCRIPT_URL}?action=getPublicListings&type=all`, {
      method: 'GET'
    });
    
    const data = await response.json();
    
    if (data.status === 'success') {
      // Cache the data
      cacheData(data);
      
      // Render properties
      renderProperties(data.houses, data.land);
    } else {
      console.error('Failed to load properties:', data.message);
      showErrorState();
    }
    
  } catch (error) {
    console.error('Error loading properties:', error);
    // If there's an error, try to use any available cache
    const cachedData = getCachedData(true); // Get even expired cache
    if (cachedData) {
      console.log('Using expired cache due to error');
      renderProperties(cachedData.houses, cachedData.land);
    } else {
      showErrorState();
    }
  }
}

/**
 * Render houses section
 */
function renderProperties(houses, land) {
  console.log('Rendering properties:', { 
    housesCount: houses?.length || 0, 
    landCount: land?.length || 0,
    houses: houses,
    land: land
  });
  
  // Hide skeleton loaders
  hideSkeletonLoaders();
  
  // Render houses
  const housesContainer = document.getElementById('houses-container');
  if (housesContainer && houses && houses.length > 0) {
    housesContainer.innerHTML = houses.map(house => renderHouseCard(house)).join('');
    console.log('Houses rendered successfully');
    console.log('Houses container innerHTML length:', housesContainer.innerHTML.length);
    console.log('Houses container visible:', housesContainer.offsetHeight > 0);
    initializeCarousels();
  } else {
    console.warn('No houses to render or container not found', { 
      containerExists: !!housesContainer, 
      housesLength: houses?.length 
    });
  }
  
  // Render land
  const landContainer = document.getElementById('land-container');
  if (landContainer && land && land.length > 0) {
    landContainer.innerHTML = land.map(plot => renderLandCard(plot)).join('');
    console.log('Land plots rendered successfully');
    console.log('Land container innerHTML length:', landContainer.innerHTML.length);
    console.log('Land container visible:', landContainer.offsetHeight > 0);
  } else {
    console.warn('No land plots to render or container not found', { 
      containerExists: !!landContainer, 
      landLength: land?.length 
    });
  }
}

/**
 * Render house card with carousel
 */
function renderHouseCard(house) {
  const images = house.images ? house.images.split('\n').filter(img => img.trim()) : [];
  
  if (images.length === 0) {
    images.push('images/placeholder.jpg');
  }
  
  return `
    <div class="col-md-4">
      <div class="property-wrap ftco-animate">
        <div class="property-carousel" style="position: relative; height: 400px; overflow: hidden;">
          <div class="carousel-images">
            ${images.map((img, index) => `
              <div class="carousel-slide ${index === 0 ? 'active' : ''}" style="background-image: url('${img.trim()}'); height: 400px; background-size: cover; background-position: center;"></div>
            `).join('')}
          </div>
          ${images.length > 1 ? `
            <button class="carousel-control carousel-prev" onclick="moveSlide(this, -1)" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.5); color: white; border: none; padding: 10px 15px; cursor: pointer; border-radius: 3px; z-index: 10;">‹</button>
            <button class="carousel-control carousel-next" onclick="moveSlide(this, 1)" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.5); color: white; border: none; padding: 10px 15px; cursor: pointer; border-radius: 3px; z-index: 10;">›</button>
          ` : ''}
        </div>
        <div class="text">
          <span class="status" style="background: #F96D00;">${house.featured === 'Yes' ? 'Featured' : 'For Sale'}</span>
          <div class="d-flex">
            <div class="one">
              <h3><a href="index.html#request-form">${house.title || 'House'}</a></h3>
              <p class="location"><span class="icon-map-marker"></span> ${house.location || 'Ghana'}</p>
            </div>
            <div class="two ml-auto">
              <span class="price">GHS ${Number(house.price || 0).toLocaleString()}</span>
            </div>
          </div>
          <div class="d-flex">
            <div class="one">
              <p>Beds: ${house.bedrooms || 0} | Baths: ${house.bathrooms || 0}${house.sqft ? ` | ${Number(house.sqft).toLocaleString()} sqft` : ''}</p>
            </div>
          </div>
          ${house.description ? `<p class="mb-3" style="font-size: 14px; color: #666;">${house.description}</p>` : ''}
          <p><a href="index.html#request-form" class="btn btn-primary py-2 px-3">View Details</a></p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render land card
 */
function renderLandCard(land) {
  return `
    <div class="col-md-4">
      <div class="property-wrap ftco-animate">
        <a href="index.html#request-form" class="img" style="background-image: url('${land.image || 'images/placeholder.jpg'}'); height: 400px; background-size: cover; background-position: center;"></a>
        <div class="text">
          <span class="status" style="background: #F96D00;">${land.featured === 'Yes' ? 'Featured' : 'For Sale'}</span>
          <div class="d-flex">
            <div class="one">
              <h3><a href="index.html#request-form">${land.title || 'Land Plot'}</a></h3>
              <p class="location"><span class="icon-map-marker"></span> ${land.location || 'Ghana'}</p>
            </div>
            <div class="two ml-auto">
              <span class="price">GHS ${Number(land.price || 0).toLocaleString()}</span>
            </div>
          </div>
          <div class="d-flex">
            <div class="one">
              <p>Plot Size: ${land.plotsize || land.plotSize || 'N/A'}${land.area ? ` | ${Number(land.area).toLocaleString()} sqft` : ''}</p>
            </div>
          </div>
          ${land.description ? `<p class="mb-3" style="font-size: 14px; color: #666;">${land.description}</p>` : ''}
          <p><a href="index.html#request-form" class="btn btn-primary py-2 px-3">View Details</a></p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Show skeleton loaders
 */
function showSkeletonLoaders() {
  const housesSkeleton = document.getElementById('houses-skeleton');
  const landSkeleton = document.getElementById('land-skeleton');
  const housesContainer = document.getElementById('houses-container');
  const landContainer = document.getElementById('land-container');
  
  if (housesSkeleton) housesSkeleton.style.display = 'flex';
  if (landSkeleton) landSkeleton.style.display = 'flex';
  if (housesContainer) housesContainer.style.display = 'none';
  if (landContainer) landContainer.style.display = 'none';
}

/**
 * Hide skeleton loaders
 */
function hideSkeletonLoaders() {
  const housesSkeleton = document.getElementById('houses-skeleton');
  const landSkeleton = document.getElementById('land-skeleton');
  const housesContainer = document.getElementById('houses-container');
  const landContainer = document.getElementById('land-container');
  
  if (housesSkeleton) housesSkeleton.style.display = 'none';
  if (landSkeleton) landSkeleton.style.display = 'none';
  if (housesContainer) {
    housesContainer.style.removeProperty('display');
    housesContainer.style.visibility = 'visible';
    housesContainer.style.opacity = '1';
    console.log('Houses container display set to:', window.getComputedStyle(housesContainer).display);
  }
  if (landContainer) {
    landContainer.style.removeProperty('display');
    landContainer.style.visibility = 'visible';
    landContainer.style.opacity = '1';
    console.log('Land container display set to:', window.getComputedStyle(landContainer).display);
  }
}

/**
 * Show error state
 */
function showErrorState() {
  hideSkeletonLoaders();
  
  const housesContainer = document.getElementById('houses-container');
  const landContainer = document.getElementById('land-container');
  
  const errorMessage = `
    <div class="col-md-12 text-center py-5">
      <p style="color: #666; font-size: 16px;">Unable to load properties at this time. Please try again later.</p>
      <button onclick="location.reload()" class="btn btn-primary mt-3">Refresh Page</button>
    </div>
  `;
  
  if (housesContainer) housesContainer.innerHTML = errorMessage;
  if (landContainer) landContainer.innerHTML = errorMessage;
}

/**
 * Cache data
 */
function cacheData(data) {
  try {
    const cacheData = {
      timestamp: Date.now(),
      houses: data.houses || [],
      land: data.land || []
    };
    localStorage.setItem(PROPERTIES_CONFIG.CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error caching data:', error);
  }
}

/**
 * Get cached data
 */
function getCachedData(ignoreExpiry = false) {
  try {
    const cached = localStorage.getItem(PROPERTIES_CONFIG.CACHE_KEY);
    if (!cached) return null;
    
    const data = JSON.parse(cached);
    const now = Date.now();
    
    // Check if cache is still valid
    if (!ignoreExpiry && (now - data.timestamp) > PROPERTIES_CONFIG.CACHE_DURATION) {
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
}

/**
 * Initialize carousels for property images
 */
function initializeCarousels() {
  const carousels = document.querySelectorAll('.property-carousel');
  let carouselIntervals = [];
  
  carousels.forEach((carousel, index) => {
    const slides = carousel.querySelectorAll('.carousel-slide');
    
    // Only set up carousel if there are multiple slides
    if (slides.length <= 1) return;
    
    carouselIntervals[index] = setInterval(() => {
      autoRotateCarousel(carousel);
    }, 4000);
    
    // Pause on hover
    carousel.addEventListener('mouseenter', () => {
      if (carouselIntervals[index]) {
        clearInterval(carouselIntervals[index]);
      }
    });
    
    // Resume on mouse leave
    carousel.addEventListener('mouseleave', () => {
      carouselIntervals[index] = setInterval(() => {
        autoRotateCarousel(carousel);
      }, 4000);
    });
  });
}

/**
 * Auto-rotate carousel
 */
function autoRotateCarousel(carousel) {
  const slides = carousel.querySelectorAll('.carousel-slide');
  let currentIndex = Array.from(slides).findIndex(slide => slide.classList.contains('active'));
  
  slides[currentIndex].classList.remove('active');
  
  currentIndex++;
  if (currentIndex >= slides.length) currentIndex = 0;
  
  slides[currentIndex].classList.add('active');
}

/**
 * Move slide (called from carousel buttons)
 */
function moveSlide(button, direction) {
  const carousel = button.closest('.property-carousel');
  const slides = carousel.querySelectorAll('.carousel-slide');
  let currentIndex = Array.from(slides).findIndex(slide => slide.classList.contains('active'));
  
  slides[currentIndex].classList.remove('active');
  
  currentIndex += direction;
  if (currentIndex >= slides.length) currentIndex = 0;
  if (currentIndex < 0) currentIndex = slides.length - 1;
  
  slides[currentIndex].classList.add('active');
}
