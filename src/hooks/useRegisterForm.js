import { useState, useCallback } from 'react';
import { passwordPolicyMissing } from '../helpers/passwordPolicy';

export function useRegisterForm(onSubmitValid) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
    if (!emailPattern.test(email)) {
      setError('Enter a valid email');
      return;
    }
    
    if (!password.trim()) {
      setError('Password is required');
      return;
    }
    
    const missing = passwordPolicyMissing(password);
    if (missing.length) {
      setError(`Password must contain: ${missing.join(', ')}.`);
      return;
    }
    
    setError('');
    onSubmitValid({ email: email.trim(), password: password.trim() });
  }, [email, password, onSubmitValid]);

  return { 
    email, 
    setEmail, 
    password, 
    setPassword, 
    error, 
    setError, 
    handleSubmit 
  };
}
