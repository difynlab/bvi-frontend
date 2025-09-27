import { useState, useCallback } from 'react';
import { passwordPolicyMissing } from '../helpers/passwordPolicy';

/**
 * Custom hook for handling registration form state and validation
 * @param {Function} onSubmitValid - Callback function called when form is valid
 * @returns {Object} Form state and handlers
 */
export function useRegisterForm(onSubmitValid) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // single string to avoid overlapping messages

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    const missing = passwordPolicyMissing(password);
    if (missing.length) {
      setError(`Password must contain: ${missing.join(', ')}.`);
      return;
    }
    setError('');
    onSubmitValid({ email: email.trim(), password: password.trim() }); // TODO BACKEND
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
