import { useState, useCallback } from 'react';
import { isValidUrl } from '../helpers/urlValidation';

export function useReportForm() {
  const [form, setForm] = useState({
    fileName: '',
    type: '',
    fileUrl: '',
    fileBlob: null
  });

  const [errors, setErrors] = useState({});

  const loadFrom = useCallback((item) => {
    if (item) {
      setForm({
        fileName: item.title || '',
        type: item.type || '',
        fileUrl: item.fileUrl || '',
        fileBlob: null
      });
    } else {
      setForm({
        fileName: '',
        type: '',
        fileUrl: '',
        fileBlob: null
      });
    }
    setErrors({});
  }, []);

  const onChange = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    setErrors(prev => {
      if (prev[field]) {
        return { ...prev, [field]: '' };
      }
      return prev;
    });
  }, []);

  const validate = useCallback(() => {
    const newErrors = {};

    if (!form.fileName.trim()) {
      newErrors.fileName = 'File name is required';
    }

    if (!form.type.trim()) {
      newErrors.type = 'Type is required';
    }

    if (!form.fileUrl.trim()) {
      newErrors.fileUrl = 'Link upload is required';
    } else if (!isValidUrl(form.fileUrl)) {
      newErrors.fileUrl = 'Please enter a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const toPayload = useCallback((id = null) => {
    return {
      id: id || Date.now().toString(),
      title: form.fileName.trim(),
      type: form.type,
      fileUrl: form.fileUrl.trim(),
      publishedAt: new Date().toISOString()
    };
  }, [form]);

  const reset = useCallback(() => {
    setForm({
      fileName: '',
      type: '',
      fileUrl: '',
      fileBlob: null
    });
    setErrors({});
  }, []);

  return {
    form,
    errors,
    onChange,
    validate,
    loadFrom,
    toPayload,
    reset
  };
}
