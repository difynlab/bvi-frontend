import { useEffect, useMemo, useState, useCallback } from 'react';
import { getSession } from '../helpers/authStorage';
import { useAuth } from '../context/useAuth';
import { updateProfile } from '../services/profileService';
import { resolveProfileImageUrl } from '../utils/profileImage';

export function useSettingsForm() {
  const ctx = useAuth();
  
  // Get current user data from session or context
  const currentUser = useMemo(() => {
    return ctx?.user || getSession() || {};
  }, [ctx?.user]);
  
  // Helper to extract phone components from unified phone string
  const extractPhoneComponents = useCallback((unifiedPhone, defaultCode = '+1') => {
    if (!unifiedPhone) return { code: defaultCode, number: '' };

    const raw = unifiedPhone.toString().replace(/\s+/g, '');
    const phoneDigits = raw.replace(/\D/g, '');
    const codeStr = (defaultCode || '').toString();
    const codeDigits = codeStr.replace(/\D/g, '');

    // Case 1: starts with +<code>
    if (raw.startsWith('+')) {
      const match = raw.match(/^(\+\d{1,3})(.*)$/);
      if (match) {
        return { code: match[1], number: (match[2] || '').trim() };
      }
    }

    // Case 2: unified phone starts with known code digits (e.g., 549..., 54..., 1..)
    if (codeDigits && phoneDigits.startsWith(codeDigits)) {
      const number = phoneDigits.slice(codeDigits.length);
      return { code: codeStr, number };
    }

    // Case 3: if code has an extra trailing '9' (AR mobile pattern 54 vs 549), try without it
    if (codeDigits?.endsWith('9')) {
      const baseCode = codeDigits.slice(0, -1);
      if (baseCode && phoneDigits.startsWith(baseCode)) {
        const number = phoneDigits.slice(baseCode.length);
        return { code: codeStr, number };
      }
    }

    // Fallback: treat as local number, keep provided default code
    return { code: codeStr || '+1', number: phoneDigits };
  }, []);

  // Extract phone components if user has unified phone from registration
  const userPhone = currentUser.phone || '';
  const ensurePlus = useCallback((val) => {
    if (!val) return '';
    const s = String(val).trim();
    return s.startsWith('+') ? s : `+${s}`;
  }, []);
  
  // Get user data from server only (no localStorage)
  const baseUser = useMemo(() => {
    // First name: from backend (snake_case or camelCase)
    const firstName = currentUser.first_name || 
                     currentUser.firstName || 
                     '';
    
    // Last name: from backend (snake_case or camelCase)
    const lastName = currentUser.last_name || 
                    currentUser.lastName || 
                    '';
    
    // Email: from backend
    const email = currentUser.email || '';
    
    // Phone: extract from unified phone if exists
    const phoneData = userPhone 
      ? extractPhoneComponents(userPhone, '+1')
      : {
          code: '+1',
          number: ''
        };
    
    // Get profile picture from server only
    const imagePath = currentUser.original_image ||
                      currentUser.profile_picture_url ||
                      currentUser.image_url ||
                      currentUser.image ||
                      currentUser.profilePictureUrl ||
                      currentUser.profilePicture ||
                      '';
    const profilePicture = resolveProfileImageUrl(imagePath);
    
    return {
      firstName,
      lastName,
      email,
      countryCode: phoneData.code,
      phoneNumber: phoneData.number,
      phoneE164: ensurePlus(currentUser.phone || (phoneData.code.replace(/\s+/g,'') + phoneData.number)),
      dateFormat: 'MM/DD/YYYY', // Default value, not stored
      timeZone: 'EST', // Default value, not stored
      country: 'Virgin Islands, British', // Default value, not stored
      language: 'English (Default)', // Default value, not stored
      profilePicture: profilePicture || ''
    };
  }, [currentUser, extractPhoneComponents, userPhone, ensurePlus]);
  
  const [form, setForm] = useState(baseUser);
  const [dirty, setDirty] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profilePreview, setProfilePreview] = useState(baseUser.profilePicture || '');
  const [selectedFile, setSelectedFile] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const requiredOk = useMemo(() => {
    // Check if any required fields are being changed
    const firstNameChanged = form.firstName !== baseUser.firstName;
    const lastNameChanged = form.lastName !== baseUser.lastName;
    const emailChanged = form.email !== baseUser.email;
    const countryCodeChanged = form.countryCode !== baseUser.countryCode;
    const phoneChanged = form.phoneNumber !== baseUser.phoneNumber;
    const profilePictureChanged = form.profilePicture !== baseUser.profilePicture;
    
    // If only profile picture is being changed, allow it
    if (profilePictureChanged && !firstNameChanged && !lastNameChanged && !emailChanged && !countryCodeChanged && !phoneChanged) {
      return true;
    }
    
    // Otherwise, validate required fields
    return Boolean(form.firstName?.trim()) && 
           Boolean(form.lastName?.trim()) && 
           Boolean(form.email?.trim()) && 
           (String(form.countryCode || '').length > 0 || Boolean(form.phoneE164));
  }, [form, baseUser]);

  const wantsPasswordChange = useMemo(() => 
    !!(currentPassword || newPassword || confirmPassword), 
    [currentPassword, newPassword, confirmPassword]
  );

  const passwordRulesOk = useMemo(() => {
    if (!wantsPasswordChange) return true;
    if (!currentPassword || !newPassword || !confirmPassword) return false;
    if (newPassword !== confirmPassword) return false;
    // TODO BACKEND: verify current password against backend
    return true; // For now, allow password change
  }, [wantsPasswordChange, currentPassword, newPassword, confirmPassword]);

  const canSave = requiredOk && passwordRulesOk && dirty;

  const onChange = useCallback((key, value) => {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      if (next[key] !== baseUser[key]) setDirty(true);
      return next;
    });
  }, [baseUser]);

  const onSelectFile = useCallback((file) => {
    if (!file) {
      // When clearing, set to empty string to show default placeholder
      setSelectedFile(null);
      setProfilePreview('');
      setForm(prev => ({ ...prev, profilePicture: '' }));
      setDirty(true);
      setErrorMessage('');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    
    if (file.size > maxSize) {
      setErrorMessage('Image size must not exceed 5MB');
      setSelectedFile(null);
      setProfilePreview('');
      setForm(prev => ({ ...prev, profilePicture: '' }));
      return;
    }

    setSelectedFile(file);
    setErrorMessage('');
    
    // Convert to base64 only for preview and sending to server
    // This will NOT be saved to localStorage, only sent to server
    const r = new FileReader();
    r.onload = () => { 
      const imageDataUrl = String(r.result || '');
      setProfilePreview(imageDataUrl); // For preview only
      // Store base64 temporarily in form state (will be sent to server, not saved to localStorage)
      setForm(prev => ({ ...prev, profilePicture: imageDataUrl }));
      setDirty(true); 
    };
    r.readAsDataURL(file);
  }, []);

  const onImageError = useCallback((errorMsg) => {
    setErrorMessage(errorMsg);
    setSelectedFile(null);
    setProfilePreview('');
    setForm(prev => ({ ...prev, profilePicture: '' }));
  }, []);

  const resetAfterSave = useCallback((updatedProfile) => {
    setForm(updatedProfile);
    setDirty(false);
    setCurrentPassword(''); 
    setNewPassword(''); 
    setConfirmPassword('');
    setSelectedFile(null);
    setErrorMessage('');
  }, []);

  const save = useCallback(async () => {
    if (!canSave || !currentUser.id || isSaving) return;
    
    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      // Validate email format (email no se puede cambiar pero se envía igual)
      if (form.email) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
        if (!emailPattern.test(form.email)) {
          setErrorMessage('Invalid email format');
          setIsSaving(false);
          return;
        }
      }
      
      // Optional: basic guard if neither phoneE164 nor phoneNumber present
      if (!form.phoneE164 && !form.phoneNumber) {
        setErrorMessage('Phone number is required');
        setIsSaving(false);
        return;
      }
      
      // Prepare settings data for backend API
      const settingsData = {
        first_name: form.firstName?.trim() || '',
        last_name: form.lastName?.trim() || '',
        email: form.email?.toLowerCase().trim() || '', // Email no se puede cambiar pero se envía
        countryCode: form.countryCode || '+1',
        phoneNumber: form.phoneNumber?.trim() || '',
        phoneE164: form.phoneE164 || '',
        profilePicture: form.profilePicture || null,
        // Preferences (solo frontend, no se envían al backend)
        dateFormat: form.dateFormat || 'MM/DD/YYYY',
        timeZone: form.timeZone || 'EST',
        country: form.country || 'Virgin Islands, British',
        language: form.language || 'English (Default)',
      };
      
      // Add password fields if all are present
      if (currentPassword && newPassword && confirmPassword) {
        settingsData.currentPassword = currentPassword;
        settingsData.newPassword = newPassword;
        settingsData.confirmPassword = confirmPassword;
      }
      
      // Get current profile picture to compare if it changed
      const currentProfilePicture = baseUser.profilePicture || '';
      
      // Call backend API to update profile
      const updatedProfileData = await updateProfile(null, settingsData, currentProfilePicture);
      
      // Helper to extract phone components from unified phone string
      const extractPhoneComponents = (unifiedPhone, currentCode) => {
        if (!unifiedPhone) return { code: currentCode || '+1', number: '' };

        const raw = unifiedPhone.toString().replace(/\s+/g, '');
        const phoneDigits = raw.replace(/\D/g, '');
        const codeStr = (currentCode || '+1').toString();
        const codeDigits = codeStr.replace(/\D/g, '');

        if (raw.startsWith('+')) {
          const match = raw.match(/^(\+\d{1,3})(.*)$/);
          if (match) {
            return { code: match[1], number: (match[2] || '').trim() };
          }
        }

        if (codeDigits && phoneDigits.startsWith(codeDigits)) {
          return { code: codeStr, number: phoneDigits.slice(codeDigits.length) };
        }

        if (codeDigits?.endsWith('9')) {
          const baseCode = codeDigits.slice(0, -1);
          if (baseCode && phoneDigits.startsWith(baseCode)) {
            return { code: codeStr, number: phoneDigits.slice(baseCode.length) };
          }
        }

        return { code: codeStr, number: phoneDigits };
      };

      // Extract phone components if backend returned unified phone
      const phoneComponents = updatedProfileData?.phone 
        ? extractPhoneComponents(updatedProfileData.phone, form.countryCode)
        : { code: form.countryCode || '+1', number: form.phoneNumber?.trim() || '' };

      // Get profile picture URL from server response (only server URLs, no base64)
      const updatedImagePath = updatedProfileData?.original_image ||
                               updatedProfileData?.profile_picture_url ||
                               updatedProfileData?.image_url ||
                               updatedProfileData?.image ||
                               updatedProfileData?.profilePicture ||
                               '';
      const profilePictureUrl = resolveProfileImageUrl(updatedImagePath);
      
      // Only save server URL, never save base64 to localStorage
      // If no URL from server, use empty string (don't fallback to form.profilePicture which might be base64)
      const localProfileUpdate = {
        firstName: updatedProfileData?.first_name || form.firstName?.trim() || '',
        lastName: updatedProfileData?.last_name || form.lastName?.trim() || '',
        email: updatedProfileData?.email || form.email?.toLowerCase().trim() || '',
        countryCode: phoneComponents.code,
        phoneNumber: phoneComponents.number,
        phoneE164: ensurePlus(updatedProfileData?.phone || form.phoneE164 || ''),
        profilePicture: profilePictureUrl, // Only server URL, never base64
        dateFormat: form.dateFormat || 'MM/DD/YYYY',
        timeZone: form.timeZone || 'EST',
        country: form.country || 'Virgin Islands, British',
        language: form.language || 'English (Default)',
      };
      
      // Update AuthContext with new data
      if (ctx?.updateProfile) {
        await ctx.updateProfile({
          firstName: localProfileUpdate.firstName,
          lastName: localProfileUpdate.lastName,
          email: localProfileUpdate.email,
          phoneNumber: localProfileUpdate.phoneNumber,
          profilePicture: localProfileUpdate.profilePicture,
          profilePictureUrl: localProfileUpdate.profilePicture,
          original_image: updatedProfileData?.original_image || localProfileUpdate.profilePicture,
          blurred_image: updatedProfileData?.blurred_image || '',
        });
      }
      
      // No longer using localStorage - all data comes from server
      // Preferences (dateFormat, timeZone, country, language) are not persisted
      
      // Reset form state
      resetAfterSave(localProfileUpdate);
      
      // Show success message
      setSuccessMessage('Profile updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrorMessage(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [canSave, currentUser.id, isSaving, form, selectedFile, baseUser, ctx, resetAfterSave, currentPassword, newPassword, confirmPassword]);

  // Initialize form when user data changes
  useEffect(() => {
    // Extract phone components if user has unified phone from registration
    const userPhoneStr = currentUser.phone || '';
    const phoneComponents = userPhoneStr 
      ? extractPhoneComponents(userPhoneStr, '+1')
      : {
          code: '+1',
          number: ''
        };
    
    // Get profile picture from server only
    const imagePath = currentUser.original_image ||
                      currentUser.profile_picture_url ||
                      currentUser.image_url ||
                      currentUser.image ||
                      currentUser.profilePictureUrl ||
                      currentUser.profilePicture ||
                      '';
    const profilePicture = resolveProfileImageUrl(imagePath);
    
    // Get data from server only (no localStorage)
    const newBaseUser = {
      firstName: currentUser.first_name || 
                 currentUser.firstName || 
                 '',
      lastName: currentUser.last_name || 
                currentUser.lastName || 
                '',
      email: currentUser.email || '',
      countryCode: phoneComponents.code,
      phoneNumber: phoneComponents.number,
      phoneE164: ensurePlus(currentUser.phone || (String(phoneComponents.code).replace(/\s+/g,'') + String(phoneComponents.number))),
      dateFormat: 'MM/DD/YYYY', // Default value, not stored
      timeZone: 'EST', // Default value, not stored
      country: 'Virgin Islands, British', // Default value, not stored
      language: 'English (Default)', // Default value, not stored
      profilePicture: profilePicture || ''
    };
    
    setForm(newBaseUser);
    setProfilePreview(newBaseUser.profilePicture || '');
  }, [
    currentUser.id, 
    currentUser.first_name, 
    currentUser.firstName,
    currentUser.last_name, 
    currentUser.lastName, 
    currentUser.email, 
    currentUser.phone,
    currentUser.original_image,
    currentUser.profile_picture_url,
    currentUser.image_url,
    currentUser.profilePictureUrl,
    extractPhoneComponents,
    ensurePlus
  ]);

  return {
    form, 
    onChange,
    profilePreview, 
    selectedFile,
    onSelectFile,
    onImageError,
    currentPassword, 
    setCurrentPassword,
    newPassword, 
    setNewPassword,
    confirmPassword, 
    setConfirmPassword,
    wantsPasswordChange, 
    passwordRulesOk,
    dirty, 
    canSave, 
    save,
    errorMessage,
    isSaving,
    successMessage,
  };
}
