/**
 * Profile Service
 * Handles profile-related API calls to Laravel backend
 * Uses fetch API (consistent with other services in the project)
 */

import { resolveProfileImageUrl } from '../utils/profileImage';

/**
 * Get token from localStorage
 * @returns {string|null} Token or null
 */
function getToken() {
  return localStorage.getItem('token');
}

/**
 * Clear token from localStorage
 */
function clearToken() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

/**
 * Get headers for API requests
 * @param {boolean} includeContentType - Whether to include Content-Type header
 * @param {boolean} isFormData - Whether request is FormData (to exclude Content-Type)
 * @returns {Object} Headers object
 */
function getHeaders(includeContentType = false, isFormData = false) {
  const token = getToken();
  const headers = {
    'Accept': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Only set Content-Type if explicitly requested and not FormData
  if (includeContentType && !isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

/**
 * Handle API response and errors
 * @param {Response} response - Fetch response object
 * @returns {Promise<Object>} Response data
 * @throws {Error} If response is not ok or parsing fails
 */
async function handleResponse(response) {
  if (!response.ok) {
    try {
      const data = await response.json();

      if (response.status === 401) {
        clearToken();
        throw new Error('Unauthorized. Please log in again.');
      } else if (response.status === 400) {
        const errorMessage = data?.message || 'Validation error';
        const validationErrors = data?.errors
          ? Object.values(data.errors).flat().join(', ')
          : '';
        console.log('400 Bad Request details:', data);
        console.log('Validation errors:', data.errors);
        throw new Error(
          `${errorMessage}${validationErrors ? ': ' + validationErrors : ''}`
        );
      } else if (response.status === 422) {
        const errorMessage = data?.message || 'Validation errors';
        const validationErrors = data?.errors
          ? Object.values(data.errors).flat().join(', ')
          : '';
        throw new Error(
          `${errorMessage}${validationErrors ? ': ' + validationErrors : ''}`
        );
      } else if (response.status === 500) {
        const errorMessage = data?.message || data?.error || 'Internal server error';
        console.error('500 Server Error details:', data);
        throw new Error(`${errorMessage} (Error 500)`);
      } else {
        const errorMessage =
          data?.message || data?.error || `Server error: ${response.status}`;
        throw new Error(errorMessage);
      }
    } catch (parseError) {
      // If JSON parsing fails, throw generic error
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
  }

  try {
    return await response.json();
  } catch (parseError) {
    throw new Error('Error processing server response');
  }
}

/**
 * Base URL from environment variable or default
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

function normalizeProfileData(profile) {
  if (!profile || typeof profile !== 'object') return profile;

  const originalImageRaw = profile.original_image || '';
  const blurredImageRaw = profile.blurred_image || '';

  const fallbackImagePath =
    profile.profile_picture_url ||
    profile.image_url ||
    profile.image ||
    profile.profile_picture ||
    profile.profilePicture ||
    '';

  const resolvedOriginalImage = resolveProfileImageUrl(originalImageRaw || fallbackImagePath);
  const resolvedBlurredImage = resolveProfileImageUrl(blurredImageRaw);

  const next = { ...profile };

  if (resolvedOriginalImage) {
    next.profile_picture_url = resolvedOriginalImage;
    next.image_url = resolvedOriginalImage;
    next.profilePictureUrl = resolvedOriginalImage;
    next.profilePicture = resolvedOriginalImage;
    next.original_image = resolvedOriginalImage;
  } else {
    next.profilePictureUrl = next.profilePictureUrl || '';
    next.profilePicture = next.profilePicture || '';
  }

  if (resolvedBlurredImage) {
    next.blurred_image = resolvedBlurredImage;
  }

  return next;
}

/**
 * Convert base64 data URL to File object
 * @param {string} dataUrl - Base64 data URL (e.g., "data:image/jpeg;base64,/9j/4AAQ...")
 * @param {string} filename - Optional filename for the File object
 * @returns {File} File object
 */
export function base64ToFile(dataUrl, filename = 'profile-image.jpg') {
  try {
    // Extract MIME type and base64 data from data URL
    const arr = dataUrl.split(',');
    if (arr.length !== 2) {
      throw new Error('Invalid data URL format');
    }

    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) {
      throw new Error('Could not extract MIME type from data URL');
    }

    const mimeType = mimeMatch[1];
    const base64Data = arr[1];

    // Convert base64 to binary
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Extract file extension from MIME type
    const extension = mimeType.split('/')[1] || 'jpg';
    const finalFilename = filename || `profile-image.${extension}`;

    // Create File object
    const file = new File([bytes], finalFilename, { type: mimeType });
    return file;
  } catch (error) {
    console.error('Error converting base64 to File:', error);
    throw new Error(`Failed to convert image: ${error.message}`);
  }
}

/**
 * Get user profile from backend
 * @param {string} [token] - Authentication token (optional, will be retrieved from localStorage if not provided)
 * @returns {Promise<Object>} User profile data from backend (response.data)
 * @throws {Error} If request fails
 */
export async function getProfile(token = null) {
  try {
    const url = `${BASE_URL}/profile`;

    // If token provided, use it in headers; otherwise getToken() will be used
    const headers = token
      ? {
          ...getHeaders(false),
          Authorization: `Bearer ${token}`,
        }
      : getHeaders(true);

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    const data = await handleResponse(response);

    // Laravel returns: { message: string, data: UserProfile }
    if (data && data.data) {
      return normalizeProfileData(data.data);
    }

    return normalizeProfileData(data);
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
}

/**
 * Helper function to combine country code and phone number
 * Removes spaces and formats as unified phone string
 * @param {string} countryCode - Country code (e.g., "+54")
 * @param {string} phoneNumber - Phone number (e.g., "91123456789")
 * @returns {string} Combined phone string (e.g., "+5491123456789")
 */
function combinePhoneNumber(countryCode, phoneNumber) {
  // Remove all spaces from both parts
  const cleanCode = (countryCode || '').replace(/\s+/g, '');
  const cleanPhone = (phoneNumber || '').replace(/\s+/g, '');

  // Combine them
  return cleanCode + cleanPhone;
}

/**
 * Update user profile
 * Maps frontend Settings data to backend format and sends update request
 *
 * @param {string} [token] - Authentication token (optional, will be retrieved from localStorage if not provided)
 * @param {Object} settingsData - Settings data from frontend
 * @param {string} settingsData.first_name - User's first name
 * @param {string} settingsData.last_name - User's last name
 * @param {string} settingsData.email - User's email
 * @param {string} settingsData.countryCode - Country code (e.g., "+54")
 * @param {string} settingsData.phoneNumber - Phone number without country code
 * @param {string|null} settingsData.profilePicture - Base64 data URL or null
 * @param {string} settingsData.dateFormat - Date format preference (not sent to backend)
 * @param {string} settingsData.timeZone - Timezone preference (not sent to backend)
 * @param {string} settingsData.country - Country preference (not sent to backend)
 * @param {string} settingsData.language - Language preference (not sent to backend)
 * @param {string} [settingsData.currentPassword] - Current password (only if changing password)
 * @param {string} [settingsData.newPassword] - New password (only if changing password)
 * @param {string} [settingsData.confirmPassword] - Password confirmation (only if changing password)
 * @param {string|null} [currentProfilePicture] - Current profile picture to compare if it changed
 * @returns {Promise<Object>} Updated user profile data from backend (response.data)
 * @throws {Error} If request fails or validation errors occur
 */
export async function updateProfile(
  token = null,
  settingsData,
  currentProfilePicture = null
) {
  try {
    // Determine if we need to send password fields
    const hasPasswordFields =
      settingsData.currentPassword &&
      settingsData.newPassword &&
      settingsData.confirmPassword;

    // Determine if profile picture has changed
    const profilePictureChanged =
      settingsData.profilePicture &&
      settingsData.profilePicture !== currentProfilePicture &&
      settingsData.profilePicture.startsWith('data:');

    // Build backend payload
  const backendData = {
    first_name: settingsData.first_name || settingsData.firstName || '',
    last_name: settingsData.last_name || settingsData.lastName || '',
    email: settingsData.email || '',
    phone: (settingsData.phoneE164 && settingsData.phoneE164.trim())
      ? settingsData.phoneE164.trim()
      : combinePhoneNumber(
          settingsData.countryCode || '',
          settingsData.phoneNumber || ''
        ),
  };

    // Add password fields only if all are present
    if (hasPasswordFields) {
      backendData.password = settingsData.currentPassword;
      backendData.new_password = settingsData.newPassword;
      backendData.confirm_password = settingsData.confirmPassword;
    }

    const url = `${BASE_URL}/profile`;
    let response;

    // Use FormData if there's a new image, otherwise use JSON
    if (profilePictureChanged) {
      const formData = new FormData();

      // Add all backend fields to FormData
      Object.keys(backendData).forEach((key) => {
        formData.append(key, backendData[key]);
      });

      // Convert base64 to File and add to FormData
      try {
        const imageFile = base64ToFile(
          settingsData.profilePicture,
          `profile-${Date.now()}.jpg`
        );
        formData.append('image', imageFile);
      } catch (imageError) {
        throw new Error(`Failed to process image: ${imageError.message}`);
      }

      // FormData: don't set Content-Type, browser will set it with boundary
      const headers = token
        ? {
            ...getHeaders(false, true),
            Authorization: `Bearer ${token}`,
          }
        : getHeaders(false, true);

      response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });
    } else {
      // JSON request: send as application/json
      const headers = token
        ? {
            ...getHeaders(true),
            Authorization: `Bearer ${token}`,
          }
        : getHeaders(true);

      response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(backendData),
      });
    }

    const data = await handleResponse(response);

    // Laravel returns: { message: string, data: UserProfile }
    if (data && data.data) {
      return normalizeProfileData(data.data);
    }

    return normalizeProfileData(data);
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
}

/**
 * Default export of the service
 */
export default {
  getProfile,
  updateProfile,
  base64ToFile,
};
