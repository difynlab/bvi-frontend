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
        console.log('🔍 Debug - Populating form with report data:', initialReport);
        
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
        
        console.log('🔍 Debug - Form populated with:', {
          title: initialReport.name || '',
          typeId: categoryTitle,
          linkUrl: initialReport.link || '',
          fileName: fileName,
          imagePreviewUrl: imagePreviewUrl,
          categoryId: initialReport.report_category_id,
          foundCategory: category,
          hasExistingFile: !!(fileName || imagePreviewUrl),
          apiFileField: initialReport.file,
          apiFileNameField: initialReport.file_name,
          apiFileUrlField: initialReport.file_url,
          extractedFileName: fileName
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

    console.log('🔍 Debug - Validating form with data:', form);

    // Validate title
    if (!form.title.trim()) {
      newErrors.title = 'Report title is required';
      console.log('❌ Validation error - Title is empty');
    } else if (form.title.trim().length < 3) {
      newErrors.title = 'Report title must be at least 3 characters long';
      console.log('❌ Validation error - Title too short:', form.title.trim().length, 'chars');
    } else {
      console.log('✅ Validation passed - Title:', form.title.trim());
    }

    // Validate typeId
    if (!form.typeId) {
      newErrors.typeId = 'Report type is required';
      console.log('❌ Validation error - Type is empty');
    } else {
      console.log('✅ Validation passed - Type:', form.typeId);
    }

    // Validate linkUrl
    if (!form.linkUrl.trim()) {
      newErrors.linkUrl = 'Link is required';
      console.log('❌ Validation error - Link is empty');
    } else if (form.linkUrl.trim().length < 3) {
      newErrors.linkUrl = 'Link must be at least 3 characters long';
      console.log('❌ Validation error - Link too short:', form.linkUrl.trim().length, 'chars');
    } else if (!isValidUrl(form.linkUrl.trim())) {
      newErrors.linkUrl = 'Please enter a valid URL';
      console.log('❌ Validation error - Invalid URL:', form.linkUrl.trim());
    } else {
      console.log('✅ Validation passed - Link:', form.linkUrl.trim());
    }

    // Validate file
    if (!form.file && !form.fileName) {
      newErrors.file = 'File is required';
      console.log('❌ Validation error - No file selected');
    } else {
      console.log('✅ Validation passed - File:', form.fileName || 'existing file');
    }

    console.log('🔍 Debug - Validation result:', newErrors);
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
    console.log('🔍 Debug - Form reset');
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