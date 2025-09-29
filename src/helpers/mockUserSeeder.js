// Temporary mock profile seeding for Settings page and other consumers.
// TODO BACKEND: remove this file once profile data comes from the API.

export function mockProfileForEmail(email = '') {
  const e = String(email || '').toLowerCase().trim();

  // Defaults for ANY user
  const base = {
    countryCode: '+54',
    phoneNumber: '1123456789', // simple 10–11 digits, no formatting
  };

  if (e === 'admin@admin') {
    return {
      ...base,
      name: 'Admin User',
      email: 'admin@admin',
      role: 'admin',
    };
  }
  if (e === 'user@user') {
    return {
      ...base,
      name: 'Regular User',
      email: 'user@user',
      role: 'user',
    };
  }
  // Fallback for any other email
  return {
    ...base,
    name: 'User',
    email,
    role: 'user',
  };
}

/**
 * Merge mock fields into an existing user object if missing.
 * Does not overwrite existing non-empty values.
 * TODO BACKEND: delete once server provides these fields.
 */
export function seedMissingContactFields(userLike) {
  const u = userLike || {};
  const mock = mockProfileForEmail(u.email || '');
  const pick = (a, b) => (a != null && String(a).trim() !== '' ? a : b);

  return {
    ...u,
    name: pick(u.name, mock.name),
    email: pick(u.email, mock.email),
    role: pick(u.role, mock.role),
    countryCode: pick(u.countryCode, mock.countryCode),
    phoneNumber: pick(u.phoneNumber, mock.phoneNumber),
  };
}
