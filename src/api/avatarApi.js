import { dataUrlToBlob, fileNameForAvatar } from '../utils/imageData';

/**
 * Upload avatar to backend API
 * @param {Object} params - Upload parameters
 * @param {string} params.apiBase - API base URL
 * @param {Object} params.user - Member object
 * @param {string} params.dataUrl - Data URL of the avatar image
 * @returns {Promise<{ok: boolean, url: string}>} - Upload result
 */
export async function uploadAvatar({ apiBase, user, dataUrl }) {
  // TODO BACKEND: confirm endpoint and auth (Bearer token/cookie)
  if (!apiBase || !user?.id || !dataUrl) return { ok: false, url: '' };

  const blob = dataUrlToBlob(dataUrl);
  const fd = new FormData();
  fd.append('file', blob, fileNameForAvatar(user));

  const res = await fetch(`${apiBase}/api/users/${encodeURIComponent(user.id)}/avatar`, {
    method: 'POST',
    body: fd,
    // credentials: 'include', // TODO BACKEND if cookies
    // headers: { Authorization: `Bearer ${token}` }, // TODO BACKEND if JWT
  }).catch(() => null);

  if (!res || !res.ok) return { ok: false, url: '' };

  // Expecting { url: 'https://...' } 
  const json = await res.json().catch(() => ({}));
  return { ok: Boolean(json?.url), url: json?.url || '' };
}
