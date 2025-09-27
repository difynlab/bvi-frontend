// Password policy validation helper
// Single source of truth for password strength requirements

/**
 * Validates if a password meets the strong password policy
 * @param {string} pwd - Password to validate
 * @returns {boolean} - True if password meets all policy requirements
 */
export function isStrongPassword(pwd) {
  if (typeof pwd !== 'string') return false;
  const s = pwd.trim();
  return s.length >= 8
    && /[A-Z]/.test(s)
    && /\d/.test(s)
    && /[!@#$%^&*()_+\-={}\[\]:;"'<>,.?/~`|\\]/.test(s);
}

/**
 * Returns array of missing policy requirements for a password
 * @param {string} pwd - Password to validate
 * @returns {string[]} - Array of missing requirement labels in English
 */
export function passwordPolicyMissing(pwd) {
  const s = (pwd ?? '').trim();
  const missing = [];
  if (s.length < 8) missing.push('minimum 8 characters');
  if (!/[A-Z]/.test(s)) missing.push('uppercase letter');
  if (!/\d/.test(s)) missing.push('number');
  if (!/[!@#$%^&*()_+\-={}\[\]:;"'<>,.?/~`|\\]/.test(s)) missing.push('special character');
  return missing;
}
