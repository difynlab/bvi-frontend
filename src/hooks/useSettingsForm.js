import { useEffect, useMemo, useState, useCallback } from 'react';
import { getProfile, setProfile } from '../helpers/profileStorage';
import { getSession } from '../helpers/authStorage';
import { useAuth } from '../context/useAuth';

export function useSettingsForm() {
  const ctx = useAuth();
  
  // Get current user data from session or context
  const currentUser = useMemo(() => {
    return ctx?.user || getSession() || {};
  }, [ctx?.user]);
  
  // Get profile data with defaults from registration
  const profileData = useMemo(() => {
    return currentUser.id ? getProfile(currentUser) || {} : {};
  }, [currentUser]);
  
  // Merge user data with profile data, using registration data as defaults
  const baseUser = useMemo(() => ({
    name: profileData.name || `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || '',
    email: profileData.email || currentUser.email || '',
    countryCode: profileData.countryCode || '+54',
    phoneNumber: profileData.phoneNumber || currentUser.phoneNumber || '',
    dateFormat: profileData.dateFormat || 'MM/DD/YYYY',
    timeZone: profileData.timeZone || 'EST',
    country: profileData.country || 'Argentina',
    language: profileData.language || 'English (Default)',
    profilePicture: profileData.profilePicture || ''
  }), [profileData, currentUser]);
  
  const [form, setForm] = useState(baseUser);
  const [dirty, setDirty] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profilePreview, setProfilePreview] = useState(baseUser.profilePicture || '');
  const [selectedFile, setSelectedFile] = useState(null);

  const requiredOk = useMemo(() => 
    Boolean(form.name?.trim()) && 
    Boolean(form.email?.trim()) && 
    String(form.countryCode || '').length > 0, 
    [form]
  );

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
    setSelectedFile(file);
    if (!file) {
      // When clearing, set to empty string to show default placeholder
      setProfilePreview('');
      setDirty(true);
      return;
    }
    const r = new FileReader();
    r.onload = () => { 
      const imageDataUrl = String(r.result || '');
      setProfilePreview(imageDataUrl); 
      setDirty(true); 
    };
    r.readAsDataURL(file);
  }, []);

  const resetAfterSave = useCallback((updatedProfile) => {
    setForm(updatedProfile);
    setDirty(false);
    setCurrentPassword(''); 
    setNewPassword(''); 
    setConfirmPassword('');
    setSelectedFile(null);
  }, []);

  const save = useCallback(() => {
    if (!canSave || !currentUser.id) return;
    
    // Validate email format if changed
    if (form.email && form.email !== baseUser.email) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i
      if (!emailPattern.test(form.email)) {
        console.error('Invalid email format')
        return
      }
    }
    
    // Validate phone number if present (digits only)
    if (form.phoneNumber && form.phoneNumber !== baseUser.phoneNumber) {
      const digitsOnly = form.phoneNumber.replace(/[^0-9]/g, '')
      if (digitsOnly && (digitsOnly.length < 8 || digitsOnly.length > 15)) {
        console.error('Invalid phone number format')
        return
      }
    }
    
    // Build partial from current inputs: firstName, lastName, email (lowercased), phoneNumber (trimmed)
    const partial = {}
    
    // Extract firstName and lastName from name field
    const nameParts = (form.name || '').trim().split(' ')
    if (nameParts.length > 0) {
      partial.firstName = nameParts[0]?.trim() || ''
    }
    if (nameParts.length > 1) {
      partial.lastName = nameParts.slice(1).join(' ').trim() || ''
    }
    
    // Add other fields if they have values
    if (form.email) {
      partial.email = form.email.toLowerCase().trim()
    }
    if (form.phoneNumber) {
      partial.phoneNumber = form.phoneNumber.trim()
    }
    
    // Add profile picture if it has changed
    const imagePreviewUrl = profilePreview || ''
    const imageFileName = selectedFile?.name || ''
    if (imagePreviewUrl !== baseUser.profilePicture) {
      // Save the actual image data for display, but handle storage carefully
      partial.profilePicture = imagePreviewUrl
      partial.profilePictureFileName = imageFileName
    }
    
    // Update AuthContext with partial - this will handle persistence
    if (ctx?.updateProfile) {
      ctx.updateProfile(partial);
    }
    
    // Also save to profile storage for additional settings
    const updatedProfile = {
      ...form,
      profilePicture: profilePreview || '',
    };
    setProfile(currentUser, updatedProfile);
    
    resetAfterSave(updatedProfile);
  }, [canSave, currentUser.id, form, profilePreview, baseUser, ctx, resetAfterSave]);

  // Initialize form when user data changes
  useEffect(() => {
    const newBaseUser = {
      name: profileData.name || `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || '',
      email: profileData.email || currentUser.email || '',
      countryCode: profileData.countryCode || '+54',
      phoneNumber: profileData.phoneNumber || currentUser.phoneNumber || '',
      dateFormat: profileData.dateFormat || 'MM/DD/YYYY',
      timeZone: profileData.timeZone || 'EST',
      country: profileData.country || 'Argentina',
      language: profileData.language || 'English (Default)',
      profilePicture: profileData.profilePicture || ''
    };
    
    setForm(newBaseUser);
    setProfilePreview(newBaseUser.profilePicture || '');
  }, [currentUser.id, currentUser.firstName, currentUser.lastName, currentUser.email, currentUser.phoneNumber, profileData]);

  return {
    form, 
    onChange,
    profilePreview, 
    selectedFile,
    onSelectFile,
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
  };
}
