import { useEffect, useMemo, useState, useCallback } from 'react';
import { getProfile, setProfile } from '../helpers/profileStorage';
import { getSession } from '../helpers/authStorage';
import { useAuth } from '../context/useAuth';
import { updateProfile } from '../services/profileService';

export function useSettingsForm() {
  const ctx = useAuth();
  
  // Get current user data from session or context
  const currentUser = useMemo(() => {
    return ctx?.user || getSession() || {};
  }, [ctx?.user]);
  
  // Helper to extract phone components from unified phone string
  const extractPhoneComponents = useCallback((unifiedPhone, defaultCode = '+54') => {
    if (!unifiedPhone) return { code: defaultCode, number: '' };
    
    const phoneStr = unifiedPhone.toString().replace(/\s+/g, '');
    // Try to match common country codes like +54, +1, etc. (1-3 digits after +)
    const countryCodeMatch = phoneStr.match(/^(\+?\d{1,3})/);
    
    if (countryCodeMatch) {
      const code = countryCodeMatch[1].startsWith('+') ? countryCodeMatch[1] : `+${countryCodeMatch[1]}`;
      const number = phoneStr.replace(/^\+?\d{1,3}/, '');
      return { code, number };
    }
    
    // If no code found, assume default code and use entire string as number
    return { code: defaultCode, number: phoneStr };
  }, []);

  // Get profile data with defaults from registration
  const profileData = useMemo(() => {
    return currentUser.id ? getProfile(currentUser) || {} : {};
  }, [currentUser]);
  
  // Extract phone components if user has unified phone from registration
  const userPhone = currentUser.phone || '';
  
  // Merge user data with profile data, using registration data as defaults
  // Support both snake_case (from backend) and camelCase (from profile storage)
  const baseUser = useMemo(() => {
    // First name: try profile, then snake_case from backend, then camelCase from backend
    const firstName = profileData.firstName || 
                     currentUser.first_name || 
                     currentUser.firstName || 
                     '';
    
    // Last name: try profile, then snake_case from backend, then camelCase from backend
    const lastName = profileData.lastName || 
                    currentUser.last_name || 
                    currentUser.lastName || 
                    '';
    
    // Email: try profile, then currentUser email
    const email = profileData.email || currentUser.email || '';
    
    // Phone: extract from unified phone if exists, otherwise use profile data
    const phoneData = userPhone 
      ? extractPhoneComponents(userPhone, profileData.countryCode || '+54')
      : {
          code: profileData.countryCode || '+54',
          number: profileData.phoneNumber || ''
        };
    
    return {
      firstName,
      lastName,
      email,
      countryCode: phoneData.code,
      phoneNumber: phoneData.number,
      dateFormat: profileData.dateFormat || 'MM/DD/YYYY',
      timeZone: profileData.timeZone || 'EST',
      country: profileData.country || 'Argentina',
      language: profileData.language || 'English (Default)',
      profilePicture: profileData.profilePicture || ''
    };
  }, [profileData, currentUser, extractPhoneComponents, userPhone]);
  
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
           String(form.countryCode || '').length > 0;
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
    
    const r = new FileReader();
    r.onload = () => { 
      const imageDataUrl = String(r.result || '');
      setProfilePreview(imageDataUrl);
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
      
      // Validate phone number if present
      if (form.phoneNumber) {
        const digitsOnly = form.phoneNumber.replace(/[^0-9]/g, '');
        if (digitsOnly && (digitsOnly.length < 8 || digitsOnly.length > 15)) {
          setErrorMessage('Phone number must be between 8 and 15 digits');
          setIsSaving(false);
          return;
        }
      }
      
      // Prepare settings data for backend API
      const settingsData = {
        first_name: form.firstName?.trim() || '',
        last_name: form.lastName?.trim() || '',
        email: form.email?.toLowerCase().trim() || '', // Email no se puede cambiar pero se envía
        countryCode: form.countryCode || '+54',
        phoneNumber: form.phoneNumber?.trim() || '',
        profilePicture: form.profilePicture || null,
        // Preferences (solo frontend, no se envían al backend)
        dateFormat: form.dateFormat || 'MM/DD/YYYY',
        timeZone: form.timeZone || 'EST',
        country: form.country || 'Argentina',
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
        if (!unifiedPhone) return { code: currentCode || '+54', number: '' };
        
        const phoneStr = unifiedPhone.toString().replace(/\s+/g, '');
        // Try to match common country codes like +54, +1, etc.
        const countryCodeMatch = phoneStr.match(/^(\+?\d{1,3})/);
        
        if (countryCodeMatch) {
          const code = countryCodeMatch[1].startsWith('+') ? countryCodeMatch[1] : `+${countryCodeMatch[1]}`;
          const number = phoneStr.replace(/^\+?\d{1,3}/, '');
          return { code, number };
        }
        
        // If no code found, assume current code and use entire string as number
        return { code: currentCode || '+54', number: phoneStr };
      };

      // Extract phone components if backend returned unified phone
      const phoneComponents = updatedProfileData?.phone 
        ? extractPhoneComponents(updatedProfileData.phone, form.countryCode)
        : { code: form.countryCode || '+54', number: form.phoneNumber?.trim() || '' };

      // Update local state with backend response if available
      const localProfileUpdate = {
        firstName: updatedProfileData?.first_name || form.firstName?.trim() || '',
        lastName: updatedProfileData?.last_name || form.lastName?.trim() || '',
        email: updatedProfileData?.email || form.email?.toLowerCase().trim() || '',
        countryCode: phoneComponents.code,
        phoneNumber: phoneComponents.number,
        profilePicture: updatedProfileData?.profile_picture_url || 
                        updatedProfileData?.image_url || 
                        form.profilePicture || '',
        dateFormat: form.dateFormat || 'MM/DD/YYYY',
        timeZone: form.timeZone || 'EST',
        country: form.country || 'Argentina',
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
        });
      }
      
      // Save preferences to localStorage (dateFormat, timeZone, country, language)
      setProfile(currentUser, localProfileUpdate);
      
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
      ? extractPhoneComponents(userPhoneStr, profileData.countryCode || '+54')
      : {
          code: profileData.countryCode || '+54',
          number: profileData.phoneNumber || ''
        };
    
    // Support both snake_case (from backend) and camelCase (from profile)
    const newBaseUser = {
      firstName: profileData.firstName || 
                 currentUser.first_name || 
                 currentUser.firstName || 
                 '',
      lastName: profileData.lastName || 
                currentUser.last_name || 
                currentUser.lastName || 
                '',
      email: profileData.email || currentUser.email || '',
      countryCode: phoneComponents.code,
      phoneNumber: phoneComponents.number,
      dateFormat: profileData.dateFormat || 'MM/DD/YYYY',
      timeZone: profileData.timeZone || 'EST',
      country: profileData.country || 'Argentina',
      language: profileData.language || 'English (Default)',
      profilePicture: profileData.profilePicture || ''
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
    profileData,
    extractPhoneComponents
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
