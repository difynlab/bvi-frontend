/**
 * Convert a data URL to a Blob object
 * @param {string} dataUrl - The data URL to convert
 * @returns {Blob} - The converted blob
 */
export function dataUrlToBlob(dataUrl) {
  try {
    const [meta, b64] = dataUrl.split(',');
    const mime = /data:(.*?);base64/.exec(meta)?.[1] || 'image/jpeg';
    const bin = atob(b64);
    const len = bin.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  } catch { 
    return new Blob(); 
  }
}

/**
 * Generate a safe filename for avatar based on user data
 * @param {Object} user - Member object with id or email
 * @returns {string} - Safe filename for avatar
 */
export function fileNameForAvatar(user) {
  const base = (user?.id || user?.email || 'member').toString().replace(/[^a-z0-9_-]/gi, '');
  return `${base}-avatar.jpg`;
}
