/**
 * Homepage Loader V2 - Complete Rewrite
 * Clean implementation for featured properties on homepage
 */

(function() {
  'use strict';
  
  // Configuration
  const CONFIG = {
    API_URL: 'https://script.google.com/macros/s/AKfycbybSxH-UqnVZhKi_F_rgZDTXX19K0d2fxfeqjxsNdQNfGgE8vLOg3foXlomnY6ttFmjwA/exec',
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
      console.log('Fetching from API');
      const response = await fetch(`${CONFIG.API_URL}?action=getPublicListings&type=all&t=${Date.now()}`);
      const data = await response.json();
      
      console.log('API Response:', data);
      
      if (data.status === 'success') {
        setCache({ houses: data.houses, land: data.land });
        displayFeatured(data.houses, data.land);
      } else {
        console.error('API Error:', data.message);
        hideSkeletons();
      }
      
    } catch (error) {
      console.error('Load Error:', error);
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
    
    // Render houses
    if (featuredHouses.length > 0 && elements.housesContainer) {
      elements.housesContainer.innerHTML = featuredHouses.map(house => createHouseHTML(house)).join('');
      console.log('✅ Featured houses rendered');
    }
    
    // Render land
    if (featuredLand.length > 0 && elements.landContainer) {
      elements.landContainer.innerHTML = featuredLand.map(land => createLandHTML(land)).join('');
      console.log('✅ Featured land rendered');
    }
    
    // Initialize carousels
    setTimeout(initCarousels, 100);
  }
  
  function createHouseHTML(house) {
    const images = house.images ? house.images.split('\n').filter(img => img.trim()) : [];
    const hasMultipleImages = images.length > 1;
    
    return `
      <div class="col-md-4 ftco-animate">
        <div class="property-wrap">
          ${hasMultipleImages ? createCarousel(images) : createSingleImage(images[0] || 'images/placeholder.jpg')}
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
    return `
      <div class="col-md-4 ftco-animate">
        <div class="property-wrap">
          <div class="img" style="background-image: url('${land.image || 'images/placeholder.jpg'}'); height: 400px; background-size: cover; background-position: center;"></div>
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
  
  function createCarousel(images) {
    return `
      <div class="property-carousel" style="position: relative; height: 400px; overflow: hidden;">
        ${images.map((img, i) => `
          <div class="carousel-slide ${i === 0 ? 'active' : ''}" 
               style="background-image: url('${img.trim()}'); height: 400px; background-size: cover; background-position: center;">
          </div>
        `).join('')}
        <button class="carousel-prev" onclick="moveCarouselSlide(this, -1)" 
                style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.5); color: white; border: none; padding: 10px 15px; cursor: pointer; z-index: 10;">❮</button>
        <button class="carousel-next" onclick="moveCarouselSlide(this, 1)" 
                style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.5); color: white; border: none; padding: 10px 15px; cursor: pointer; z-index: 10;">❯</button>
      </div>
    `;
  }
  
  function createSingleImage(image) {
    return `<div class="img" style="background-image: url('${image}'); height: 400px; background-size: cover; background-position: center;"></div>`;
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
    console.log('Carousels ready');
  }
  
  // Global function for carousel navigation
  window.moveCarouselSlide = function(button, direction) {
    const carousel = button.closest('.property-carousel');
    const slides = carousel.querySelectorAll('.carousel-slide');
    let current = 0;
    
    slides.forEach((slide, i) => {
      if (slide.classList.contains('active')) current = i;
      slide.classList.remove('active');
    });
    
    current += direction;
    if (current < 0) current = slides.length - 1;
    if (current >= slides.length) current = 0;
    
    slides[current].classList.add('active');
  };
  
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
