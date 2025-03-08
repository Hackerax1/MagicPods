/**
 * Local image optimization utility using Sharp
 * This replaces the Cloudinary implementation with a server-side solution
 */

/**
 * Optimizes an image URL using our local Sharp-based API endpoint
 * @param originalUrl The original image URL
 * @param options Transformation options
 * @returns Optimized image URL
 */
export function optimizeCardImage(originalUrl: string, options: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
} = {}) {
  if (!originalUrl) return '';
  
  // Default options
  const {
    width = 0,
    height = 0,
    quality = 80,
    format = 'webp'
  } = options;
  
  // Build URL with query parameters
  const params = new URLSearchParams();
  params.append('url', originalUrl);
  
  if (width > 0) {
    params.append('width', width.toString());
  }
  
  if (height > 0) {
    params.append('height', height.toString());
  }
  
  params.append('quality', quality.toString());
  params.append('format', format);
  
  // Return URL to local optimization endpoint
  return `/api/optimize-image?${params.toString()}`;
}

/**
 * Get optimized card image for different use cases
 */
export function getCardImageUrls(originalUrl: string) {
  if (!originalUrl) return { normal: '', small: '', art_crop: '' };
  
  return {
    normal: optimizeCardImage(originalUrl, { width: 488, height: 680, quality: 85 }),
    small: optimizeCardImage(originalUrl, { width: 146, height: 204, quality: 75 }),
    art_crop: optimizeCardImage(originalUrl, { width: 100, height: 80, quality: 70 })
  };
}
