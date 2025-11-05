import { useState, useCallback, useEffect } from 'react';

export function useReportForm(initialReport = null, isOpen = false, mode = 'add', categories = []) {
  const [form, setForm] = useState({
    title: '',
    typeId: '',
    linkUrl: '',
    fileName: '',
    imagePreviewUrl: '',
    file: null
  });

  const [errors, setErrors] = useState({});

  // Reset form when modal opens/closes or mode changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialReport) {
        // Populate form with existing report data from API
        // Find the category title from the report_category_id
        const category = categories.find(cat => cat.id === initialReport.report_category_id);
        const categoryTitle = category ? category.title : '';
        
        // Extract filename from URL if file_name is not available
        let fileName = initialReport.file_name || '';
        let imagePreviewUrl = initialReport.file_url || '';
        
        if (!fileName && initialReport.file) {
          // Extract filename from URL: http://localhost:8000/storage/reports/filename.pdf -> filename.pdf
          const urlParts = initialReport.file.split('/');
          fileName = urlParts[urlParts.length - 1] || '';
        }
        
        if (!imagePreviewUrl && initialReport.file) {
          imagePreviewUrl = initialReport.file;
        }
        
        setForm({
          title: initialReport.name || '',                    // API field: name
          typeId: categoryTitle,                             // Category title for dropdown
          linkUrl: initialReport.link || '',                 // API field: link
          fileName: fileName,                                // Extracted filename
          imagePreviewUrl: imagePreviewUrl,                  // File URL for preview
          file: null // For edit mode, we don't need a File object, just fileName and imagePreviewUrl
        });
      } else {
        // Reset form for new report
        setForm({
          title: '',
          typeId: '',
          linkUrl: '',
          fileName: '',
          imagePreviewUrl: '',
          file: null
        });
      }
      setErrors({});
    }
  }, [isOpen, mode, initialReport]);

  const setField = useCallback((field, value) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  }, [errors]);

  const setFile = useCallback((file) => {
    if (file) {
      setForm(prev => ({
        ...prev,
        file: file,
        fileName: file.name,
        imagePreviewUrl: URL.createObjectURL(file)
      }));
    } else {
      setForm(prev => ({
        ...prev,
        file: null,
        fileName: '',
        imagePreviewUrl: ''
      }));
    }
  }, []);

  const validate = useCallback(() => {
    const newErrors = {};

    // Validate title
    if (!form.title.trim()) {
      newErrors.title = 'Report title is required';
    } else if (form.title.trim().length < 3) {
      newErrors.title = 'Report title must be at least 3 characters long';
    }

    // Validate typeId
    if (!form.typeId) {
      newErrors.typeId = 'Report type is required';
    }

    // Validate linkUrl
    if (!form.linkUrl.trim()) {
      newErrors.linkUrl = 'Link is required';
    } else if (form.linkUrl.trim().length < 3) {
      newErrors.linkUrl = 'Link must be at least 3 characters long';
    } else if (!isValidUrl(form.linkUrl.trim())) {
      newErrors.linkUrl = 'Please enter a valid URL';
    }

    // Validate file
    if (!form.file && !form.fileName) {
      newErrors.file = 'File is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const toPayload = useCallback((existingId = null) => {
    return {
      id: existingId || Date.now(),
      name: form.title.trim(),                    // title → name
      link: form.linkUrl.trim(),                  // linkUrl → link
      report_category_id: form.typeId,            // typeId → report_category_id
      publish_date: new Date().toISOString().split('T')[0], // Auto-generate current date
      file: form.file,                            // File object
      status: 1
    };
  }, [form]);

  const resetForm = useCallback(() => {
    setForm({
      title: '',
      typeId: '',
      linkUrl: '',
      fileName: '',
      imagePreviewUrl: '',
      file: null
    });
    setErrors({});
  }, []);

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