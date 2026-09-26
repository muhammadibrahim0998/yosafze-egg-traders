/**
 * Helper to safely resolve image URLs on localhost and production hosting (Coolify, Vercel, Railway, etc.)
 */
export function getImageUrl(imagePath) {
  if (!imagePath) return '/egg2.png';

  const rawUrl = typeof imagePath === 'string' 
    ? imagePath 
    : (Array.isArray(imagePath) ? imagePath[0] : (imagePath?.url || imagePath?.src || '/egg2.png'));

  if (!rawUrl || typeof rawUrl !== 'string') return '/egg2.png';

  // Absolute URLs (Cloudinary, external, data URIs)
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('data:') || rawUrl.startsWith('blob:')) {
    return rawUrl;
  }

  // Frontend public static images (e.g. /egg2.png, /egg.png, /logo.jpeg)
  if (rawUrl.startsWith('/egg') || rawUrl.startsWith('/logo') || rawUrl.startsWith('egg') || rawUrl.startsWith('logo')) {
    return rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
  }

  // Uploaded backend images (e.g. /uploads/image.jpg)
  const apiBase = import.meta.env.VITE_API_URL || '';
  if (rawUrl.startsWith('/uploads/')) {
    return apiBase ? `${apiBase}${rawUrl}` : rawUrl;
  }

  if (rawUrl.startsWith('uploads/')) {
    return apiBase ? `${apiBase}/${rawUrl}` : `/${rawUrl}`;
  }

  return rawUrl;
}

export default getImageUrl;
