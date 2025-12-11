import { useState, useCallback } from 'react';

export function useLoginForm(onSubmitValid) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

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
