/**
 * Build image URL for member firms
 * Similar to buildImageUrl for events, but for member-firms storage path
 */
export const buildMemberFirmImageUrl = (imageName) => {
  if (!imageName) return '';
  
  // Si ya es una URL completa, devolverla tal como está
  if (imageName.startsWith('http://') || imageName.startsWith('https://')) {
    return imageName;
  }
  
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
  const apiBaseURL = baseURL.replace('/api', '');
  return `${apiBaseURL}/storage/member-firms/${imageName}`;
};

/**
 * Clean image URL to remove duplicated paths
 */
export const cleanMemberFirmImageUrl = (url) => {
  if (!url) return '';
  
  // Si ya es una URL completa y parece correcta, devolverla
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // Si la URL contiene duplicación del prefijo, limpiarla
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
    const apiBaseURL = baseURL.replace('/api', '');
    const storagePath = `${apiBaseURL}/storage/member-firms/`;
    
    if (url.includes(`${storagePath}${storagePath}`)) {
      return url.replace(`${storagePath}${storagePath}`, storagePath);
    }
    
    return url;
  }
  
  return buildMemberFirmImageUrl(url);
};

