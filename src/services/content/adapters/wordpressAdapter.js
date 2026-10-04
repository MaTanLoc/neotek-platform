import {
  getCachedHomepageData,
  getHomepageData,
  getSolutionsPageData,
} from '../../../api/wordpress.js'

// Delegate to the existing implementation to preserve normalization and caches.
export const wordpressAdapter = {
  getHomePage: getHomepageData,
  getCachedHomePage: getCachedHomepageData,
  getSolutionsPage: getSolutionsPageData,
}
