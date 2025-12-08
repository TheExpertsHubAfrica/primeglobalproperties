/**
 * Homepage Loader V2 - Complete Rewrite
 * Clean implementation for featured properties on homepage
 */

(function() {
  'use strict';
  
  // Configuration
  const CONFIG = {
    API_URL: 'https://script.google.com/macros/s/AKfycbw_5waGkgqb_sHB7aN0PLBwTgPbGW6vmboTPz8vNuI9weFwljD3DvF76bv7-8XfO7U-/exec',
    CACHE_KEY: 'pgp_homepage_v2',
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
    MAX_FEATURED: 3
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
    elements.housesContainer = document.getElementById('featured-houses-container');
    elements.landContainer = document.getElementById('featured-land-container');
    elements.housesSkeleton = document.getElementById('houses-skeleton');
    elements.landSkeleton = document.getElementById('land-skeleton');
    
    console.log('Homepage Loader V2 initialized');
    console.log('Containers found:', {
      houses: !!elements.housesContainer,
      land: !!elements.landContainer
    });
    
    // Load properties
    loadFeaturedProperties();
  }
  
  async function loadFeaturedProperties() {
    try {
      // Check cache
      const cached = getCache();
      if (cached) {
        console.log('Loading from cache');
        displayFeatured(cached.houses, cached.land);
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
      const data = await response.json();
      console.log('API Response:', data);
      
      if (data.status === 'success') {
        console.log('✅ Data loaded successfully');
        setCache({ houses: data.houses || [], land: data.land || [] });
        displayFeatured(data.houses || [], data.land || []);
      } else {
        console.error('❌ API Error:', data.message);
        hideSkeletons();
      }
      
    } catch (error) {
      console.error('❌ Load Error:', error);
      console.error('Error stack:', error.stack);
      hideSkeletons();
    }
  }
  
  function displayFeatured(houses, land) {
    hideSkeletons();
    
    // Filter and limit featured properties
    const featuredHouses = (houses || [])
      .filter(h => (h.featured === 'Yes' || h.featured === true) && (h.visible === 'Yes' || h.visible === true))
      .slice(0, CONFIG.MAX_FEATURED);
      
    const featuredLand = (land || [])
      .filter(l => (l.featured === 'Yes' || l.featured === true) && (l.visible === 'Yes' || l.visible === true))
      .slice(0, CONFIG.MAX_FEATURED);
    
    console.log('Featured properties:', { houses: featuredHouses.length, land: featuredLand.length });
    console.log('Containers:', { 
      housesContainer: elements.housesContainer, 
      landContainer: elements.landContainer 
    });
    
    // Render houses
    if (featuredHouses.length > 0 && elements.housesContainer) {
      const htmlContent = featuredHouses.map(house => createHouseHTML(house)).join('');
      console.log('Generated HTML length:', htmlContent.length);
      console.log('First 500 chars:', htmlContent.substring(0, 500));
      elements.housesContainer.innerHTML = htmlContent;
      console.log('✅ Featured houses rendered');
      console.log('Container children count:', elements.housesContainer.children.length);
    }
    
    // Render land
    if (featuredLand.length > 0 && elements.landContainer) {
      elements.landContainer.innerHTML = featuredLand.map(land => createLandHTML(land)).join('');
      console.log('✅ Featured land rendered');
    }
    
    // Initialize carousels after rendering
    setTimeout(initCarousels, 100);
    
    // Initialize carousels
    setTimeout(initCarousels, 100);
  }
  
  function createHouseHTML(house) {
    const images = house.images ? house.images.split('\n').filter(img => img.trim()) : [];
    const hasMultipleImages = images.length > 1;
    const mainImage = images[0] || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="18" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
    
    return `
      <div class="col-md-4" style="opacity: 1; visibility: visible;">
        <div class="property-wrap">
          ${hasMultipleImages ? createCarousel(images, house.featured === 'Yes') : createSingleImage(mainImage, house.featured === 'Yes')}
          <div class="text" style="padding: 25px;">
            <p class="price mb-3">
              <span style="color: #F96D00; font-size: 30px; font-weight: 700;">GHS ${Number(house.price || 0).toLocaleString()}</span>
            </p>
            <h3 class="mb-2" style="font-size: 20px;">
              <a href="properties.html" style="color: #232526; font-weight: 600; text-decoration: none;">
                ${house.title || 'House for Sale'}
              </a>
            </h3>
            <p class="location mb-3" style="color: #999; font-size: 14px;">
              <span class="icon-map-marker"></span> ${house.location || 'Ghana'}
            </p>
            <ul class="property_list mb-3" style="list-style: none; padding: 0; display: flex; gap: 15px;">
              <li style="color: #666; font-size: 13px;">
                <span class="flaticon-bed"></span> ${house.bedrooms || 0} Beds
              </li>
              <li style="color: #666; font-size: 13px;">
                <span class="flaticon-bathtub"></span> ${house.bathrooms || 0} Baths
              </li>
            </ul>
            ${house.description ? `<p style="font-size: 13px; color: #666; line-height: 1.6;">${house.description.substring(0, 80)}...</p>` : ''}
          </div>
        </div>
      </div>
    `;
  }
  
  function createLandHTML(land) {
    const landImage = land.image || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="18" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
    const isFeatured = land.featured === 'Yes' || land.featured === true;
    return `
      <div class="col-md-4" style="opacity: 1; visibility: visible;">
        <div class="property-wrap">
          <div class="img" style="background-image: url('${landImage}'); height: 400px; background-size: cover; background-position: center; position: relative;">
            ${isFeatured ? '<span class="status" style="position: absolute; top: 10px; left: 10px; background: #F96D00; color: white; padding: 5px 15px; font-size: 12px; font-weight: 600; z-index: 2;">FEATURED</span>' : ''}
          </div>
          <div class="text" style="padding: 25px;">
            <p class="price mb-3">
              <span style="color: #F96D00; font-size: 30px; font-weight: 700;">GHS ${Number(land.price || 0).toLocaleString()}</span>
            </p>
            <h3 class="mb-2" style="font-size: 20px;">
              <a href="index.html#request-form" style="color: #232526; font-weight: 600; text-decoration: none;">
                ${land.title || 'Land for Sale'}
              </a>
            </h3>
            <p class="location mb-3" style="color: #999; font-size: 14px;">
              <span class="icon-map-marker"></span> ${land.location || 'Ghana'}
            </p>
            <ul class="property_list mb-3" style="list-style: none; padding: 0;">
              <li style="color: #666; font-size: 13px;">
                <strong>Plot:</strong> ${land.plotsize || land['plot size'] || 'N/A'}
              </li>
            </ul>
            ${land.description ? `<p style="font-size: 13px; color: #666; line-height: 1.6;">${land.description.substring(0, 80)}...</p>` : ''}
          </div>
        </div>
      </div>
    `;
  }
  
  function createCarousel(images, isFeatured) {
    return `
      <div class="property-carousel" style="position: relative; height: 400px; overflow: hidden;">
        ${images.map((img, i) => `
          <div class="carousel-slide ${i === 0 ? 'active' : ''}" 
               style="background-image: url('${img.trim()}'); height: 400px; background-size: cover; background-position: center; transition: none; ${i === 0 ? 'display: block; opacity: 1; position: relative;' : 'display: none; position: absolute; width: 100%; top: 0; left: 0; opacity: 0;'}">
            ${isFeatured && i === 0 ? '<span class="status" style="position: absolute; top: 10px; left: 10px; background: #F96D00; color: white; padding: 5px 15px; font-size: 12px; font-weight: 600; z-index: 2;">FEATURED</span>' : ''}
          </div>
        `).join('')}
        <button class="carousel-prev" onclick="moveSlide(this, -1)" 
                style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.5); color: white; border: none; padding: 10px 15px; cursor: pointer; z-index: 2; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 20px;">‹</button>
        <button class="carousel-next" onclick="moveSlide(this, 1)" 
                style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.5); color: white; border: none; padding: 10px 15px; cursor: pointer; z-index: 2; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 20px;">›</button>
      </div>
    `;
  }
  
  function createSingleImage(image, isFeatured) {
    return `
      <div class="img" style="background-image: url('${image}'); height: 400px; background-size: cover; background-position: center; position: relative;">
        ${isFeatured ? '<span class="status" style="position: absolute; top: 10px; left: 10px; background: #F96D00; color: white; padding: 5px 15px; font-size: 12px; font-weight: 600; z-index: 2;">FEATURED</span>' : ''}
      </div>
    `;
  }
  
  function showSkeletons() {
    if (elements.housesSkeleton) elements.housesSkeleton.style.display = 'flex';
    if (elements.landSkeleton) elements.landSkeleton.style.display = 'flex';
  }
  
  function hideSkeletons() {
    if (elements.housesSkeleton) elements.housesSkeleton.style.display = 'none';
    if (elements.landSkeleton) elements.landSkeleton.style.display = 'none';
  }
  
  function initCarousels() {
    const carousels = document.querySelectorAll('.property-carousel');
    console.log('Initializing', carousels.length, 'carousels');
    
    carousels.forEach((carousel, index) => {
      // Skip if already initialized
      if (carousel.dataset.initialized === 'true') return;
      carousel.dataset.initialized = 'true';
      
      const slides = carousel.querySelectorAll('.carousel-slide');
      if (slides.length <= 1) return; // No need for carousel with single image
      
      // Set up auto-rotation
      const intervalId = setInterval(() => {
        const currentSlide = carousel.querySelector('.carousel-slide.active');
        const currentIndex = Array.from(slides).indexOf(currentSlide);
        const nextIndex = (currentIndex + 1) % slides.length;
        
        currentSlide.classList.remove('active');
        currentSlide.style.display = 'none';
        currentSlide.style.opacity = '0';
        currentSlide.style.position = 'absolute';
        
        slides[nextIndex].classList.add('active');
        slides[nextIndex].style.display = 'block';
        slides[nextIndex].style.opacity = '1';
        slides[nextIndex].style.position = 'relative';
      }, 4000);
      
      // Store interval ID for cleanup
      carousel.dataset.intervalId = intervalId;
      
      // Pause on hover
      carousel.addEventListener('mouseenter', () => {
        clearInterval(parseInt(carousel.dataset.intervalId));
      });
      
      // Resume on mouse leave
      carousel.addEventListener('mouseleave', () => {
        const newIntervalId = setInterval(() => {
          const currentSlide = carousel.querySelector('.carousel-slide.active');
          const currentIndex = Array.from(slides).indexOf(currentSlide);
          const nextIndex = (currentIndex + 1) % slides.length;
          
          currentSlide.classList.remove('active');
          currentSlide.style.display = 'none';
          currentSlide.style.opacity = '0';
          currentSlide.style.position = 'absolute';
          
          slides[nextIndex].classList.add('active');
          slides[nextIndex].style.display = 'block';
          slides[nextIndex].style.opacity = '1';
          slides[nextIndex].style.position = 'relative';
        }, 4000);
        carousel.dataset.intervalId = newIntervalId;
      });
    });
    
    console.log('✅ Carousels initialized with auto-rotation');
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
