export function resolveProfileImageUrl(imagePath) {
  if (!imagePath) return '';

  const raw = String(imagePath).trim();
  if (!raw) return '';

  // Already an absolute URL or data URI
  if (/^(https?:)?\/\//i.test(raw) || raw.startsWith('data:')) {
    return raw;
  }

  const baseFromEnv = import.meta.env.VITE_FILE_BASE_URL || import.meta.env.VITE_API_BASE_URL || '';
  if (!baseFromEnv) {
    return raw;
  }

  // Normalize base URL (remove trailing slash)
  const normalizedBase = baseFromEnv.replace(/\/+$/, '');

  // If base URL ends with /api, strip it (common Laravel pattern)
  const backendRoot = normalizedBase.replace(/\/api$/i, '');

  // Ensure image path does not start with slash to avoid double slashes
  const normalizedPath = raw.replace(/^\/+/, '');

  return `${backendRoot}/${normalizedPath}`;
}


