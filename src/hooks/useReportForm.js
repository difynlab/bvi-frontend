import { useState, useCallback, useEffect } from 'react';
import { isValidUrl } from '../helpers/urlValidation';

const EMPTY_FORM = {
  id: null,
  title: '',
  typeId: '',
  linkUrl: '',
  imagePreviewUrl: '',
  fileName: '',
  file: null
};

export function useReportForm(initialReport, isOpen, mode) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  // Initialize form only when modal opens or target report changes
  useEffect(() => {
    if (!isOpen) return;
    
    if (mode === 'edit' && initialReport?.id) {
      setForm({ 
        ...EMPTY_FORM, 
        ...initialReport,
        title: initialReport.title || '',
        typeId: initialReport.typeId || '',
        linkUrl: initialReport.fileUrl || initialReport.linkUrl || '',
        fileName: initialReport.title || ''
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
  }, [isOpen, initialReport?.id, mode]);

  // Clean up object URL when modal closes
  useEffect(() => {
    return () => {
      if (form.imagePreviewUrl) {
        URL.revokeObjectURL(form.imagePreviewUrl);
      }
    };
  }, [isOpen]);

  const setField = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    setErrors(prev => {
      if (prev[field]) {
        return { ...prev, [field]: '' };
      }
      return prev;
    });
  }, []);

  const setFile = useCallback((file) => {
    if (file) {
      const url = URL.createObjectURL(file);
      setForm(prev => ({ 
        ...prev, 
        file, 
        imagePreviewUrl: url, 
        fileName: file.name 
      }));
    }
  }, []);

  const validate = useCallback(() => {
    const newErrors = {};

    if (!form.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!form.typeId || typeof form.typeId !== 'string' || form.typeId.trim() === '') {
      newErrors.typeId = 'Category is required';
    }

    if (!form.linkUrl.trim()) {
      newErrors.linkUrl = 'Link is required';
    } else if (!isValidUrl(form.linkUrl)) {
      newErrors.linkUrl = 'Please enter a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const toPayload = useCallback((id = null) => {
    return {
      id: id || Date.now().toString(),
      title: form.title.trim(),
      // Note: type and typeName should be set by caller using categories context
      fileUrl: form.linkUrl.trim(),
      imagePreviewUrl: form.imagePreviewUrl,
      fileName: form.fileName,
      publishedAt: new Date().toISOString()
      // TODO BACKEND: Add file upload handling here
    };
  }, [form]);

  const resetForm = useCallback(() => {
    if (form.imagePreviewUrl) {
      URL.revokeObjectURL(form.imagePreviewUrl);
    }
    setForm(EMPTY_FORM);
    setErrors({});
  }, [form.imagePreviewUrl]);

  return {
    form,
    errors,
    setField,
    setFile,
    validate,
    toPayload,
    resetForm
  };
}
