import { useState, useCallback } from 'react';

export function usePasswordVisibility(initial = false) {
  const [visible, setVisible] = useState(initial);
  const toggle = useCallback(() => setVisible(v => !v), []);
  return { visible, toggle, inputType: visible ? 'text' : 'password' };
}
