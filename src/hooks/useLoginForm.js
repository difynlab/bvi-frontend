import { useState, useCallback } from 'react';

/**
 * Custom hook for handling login form state and validation
 * @param {Function} onSubmitValid - Callback function called when form is valid
 * @returns {Object} Form state and handlers
 */
export function useLoginForm(onSubmitValid) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // single string

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
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
