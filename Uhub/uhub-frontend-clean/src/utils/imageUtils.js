// Utility functions for handling images and cache management

/**
 * Clears the browser cache for a specific image URL
 * @param {string} imageUrl - The URL of the image to clear from cache
 */
export const clearImageCache = (imageUrl) => {
  if (!imageUrl) return;
  
  // Create a new image element to force reload
  const img = new Image();
  img.src = imageUrl + '?t=' + new Date().getTime();
  
  // Clear from browser cache if possible
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name);
      });
    });
  }
  
  // Force browser to reload the image by changing the src
  const images = document.querySelectorAll(`img[src="${imageUrl}"]`);
  images.forEach(img => {
    img.src = imageUrl + '?t=' + new Date().getTime();
  });
};

/**
 * Validates if an image URL is accessible
 * @param {string} imageUrl - The URL to validate
 * @returns {Promise<boolean>} - True if image is accessible, false otherwise
 */
export const validateImageUrl = (imageUrl) => {
  return new Promise((resolve) => {
    if (!imageUrl) {
      resolve(false);
      return;
    }
    
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = imageUrl;
  });
};

/**
 * Simple function to check if a URL is valid
 * @param {string} url - The URL to check
 * @returns {boolean} - True if URL is valid, false otherwise
 */
export const isValidUrl = (url) => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Creates a cache-busting URL for images
 * @param {string} imageUrl - The original image URL
 * @returns {string} - URL with cache-busting parameter
 */
export const getCacheBustingUrl = (imageUrl) => {
  if (!imageUrl) return null;
  return `${imageUrl}?t=${new Date().getTime()}`;
};

/**
 * Forces a complete refresh of all profile pictures for an employee
 * @param {string} employeeId - The employee ID
 * @param {string} oldImageUrl - The old image URL to clear
 */
export const forceRefreshEmployeeImages = (employeeId, oldImageUrl) => {
  if (!oldImageUrl) return;
  
  // Clear the specific image cache
  clearImageCache(oldImageUrl);
  
  // Force refresh all avatar components for this employee
  const avatars = document.querySelectorAll(`[data-employee-id="${employeeId}"]`);
  avatars.forEach(avatar => {
    if (avatar.src && avatar.src.includes(oldImageUrl)) {
      avatar.src = oldImageUrl + '?t=' + new Date().getTime();
    }
  });
  
  // Force a page refresh if needed
  setTimeout(() => {
    window.location.reload();
  }, 100);
};
