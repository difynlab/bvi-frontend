import { useEffect, useMemo, useState, useCallback } from 'react';
import { readUserFromStorage, writeUserToStorage, ensureUserDefaults } from '../helpers/profileStorage';

// Optional-context import guarded at runtime
let useAuthHook = null; 
try { 
  ({ useAuth: useAuthHook } = require('../context/AuthContext')); 
} catch {}

export function useSettingsForm() {
  const ctx = typeof useAuthHook === 'function' ? useAuthHook() : null;
  const baseUser = ensureUserDefaults(ctx?.user || readUserFromStorage() || {});
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
    return currentPassword === baseUser.password;
  }, [wantsPasswordChange, currentPassword, newPassword, confirmPassword, baseUser.password]);

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
      setProfilePreview(baseUser.profilePicture || '');
      return;
    }
    const r = new FileReader();
    r.onload = () => { 
      setProfilePreview(String(r.result || '')); 
      setDirty(true); 
    };
    r.readAsDataURL(file);
  }, [baseUser.profilePicture]);

  const resetAfterSave = useCallback((u) => {
    setForm(ensureUserDefaults(u || {}));
    setDirty(false);
    setCurrentPassword(''); 
    setNewPassword(''); 
    setConfirmPassword('');
    setSelectedFile(null);
  }, []);

  const save = useCallback(() => {
    if (!canSave) return;
    const merged = {
      ...baseUser,
      ...form,
      profilePicture: profilePreview || form.profilePicture || baseUser.profilePicture,
      ...(wantsPasswordChange ? { password: newPassword } : {}),
    };
    
    // TODO BACKEND: GET /api/me for hydration and PATCH /api/me for updates
    if (ctx?.updateUserProfile) {
      ctx.updateUserProfile(merged);
    } else {
      writeUserToStorage(merged);
    }
    resetAfterSave(merged);
  }, [canSave, baseUser, form, profilePreview, wantsPasswordChange, newPassword, ctx, resetAfterSave]);

  useEffect(() => {
    const stored = ensureUserDefaults(ctx?.user || readUserFromStorage() || {});
    if (!stored.phoneNumber) {
      const migrated = { ...stored, phoneNumber: '' };
      if (ctx?.updateUserProfile) {
        ctx.updateUserProfile(migrated);
      } else {
        writeUserToStorage(migrated);
      }
    }
  }, []); // mount

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
