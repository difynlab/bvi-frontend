// URL validation helper
export function isValidUrl(v = '') {
  try {
    const u = new URL(v);
    return !!u.protocol && !!u.host;
  } catch {
    return false;
  }
}
