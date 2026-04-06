import { useState, useCallback, useEffect } from 'react';

export function useReportForm(initialReport = null, isOpen = false, mode = 'add', categories = []) {
  const [form, setForm] = useState({
    title: '',
    typeId: '',
    linkUrl: '',
    fileName: '',
    imagePreviewUrl: '',
    file: null,
    previewImageName: '',
    previewImageUrl: '',
    previewImageFile: null
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

        const existingPreviewImageUrl =
          (typeof initialReport.preview_img === 'object' && initialReport.preview_img?.url
            ? initialReport.preview_img.url
            : null) ||
          (typeof initialReport.preview_image === 'object' && initialReport.preview_image?.url
            ? initialReport.preview_image.url
            : null) ||
          initialReport.preview_img_url ||
          initialReport.preview_img_path ||
          (typeof initialReport.preview_img === 'string' ? initialReport.preview_img : '') ||
          initialReport.preview_image_url ||
          initialReport.preview_image_path ||
          (typeof initialReport.preview_image === 'string' ? initialReport.preview_image : '') ||
          initialReport.previewImageUrl ||
          '';

        let previewImageName = initialReport.preview_img_name || initialReport.preview_image_name || '';
        if (!previewImageName && existingPreviewImageUrl) {
          const urlParts = String(existingPreviewImageUrl).split('/');
          previewImageName = urlParts[urlParts.length - 1] || '';
        }
        
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
          file: null,
          previewImageName: previewImageName,
          previewImageUrl: existingPreviewImageUrl,
          previewImageFile: null
        });
      } else {
        // Reset form for new report
        setForm({
          title: '',
          typeId: '',
          linkUrl: '',
          fileName: '',
          imagePreviewUrl: '',
          file: null,
          previewImageName: '',
          previewImageUrl: '',
          previewImageFile: null
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

  const setPreviewImage = useCallback((file) => {
    if (file) {
      setForm(prev => ({
        ...prev,
        previewImageFile: file,
        previewImageName: file.name,
        previewImageUrl: URL.createObjectURL(file)
      }));
    } else {
      setForm(prev => ({
        ...prev,
        previewImageFile: null,
        previewImageName: '',
        previewImageUrl: ''
      }));
    }
  }, []);

  const validate = useCallback(() => {
    const newErrors = {};

    if (!form.title.trim()) {
      newErrors.title = 'Report title is required';
    } else if (form.title.trim().length < 3) {
      newErrors.title = 'Report title must be at least 3 characters long';
    }

    if (!form.typeId) {
      newErrors.typeId = 'Report type is required';
    }

    const trimmedLink = form.linkUrl.trim();
    if (trimmedLink) {
      if (trimmedLink.length < 3) {
        newErrors.linkUrl = 'Link must be at least 3 characters long';
      } else if (!isValidUrl(trimmedLink)) {
        newErrors.linkUrl = 'Please enter a valid URL';
      }
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

  const toPayload = useCallback(() => {
    return {
      name: form.title.trim(),
      link: form.linkUrl.trim(),
      publish_date: new Date().toISOString().split('T')[0],
      file: form.file,
      preview_img: form.previewImageFile,
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
      file: null,
      previewImageName: '',
      previewImageUrl: '',
      previewImageFile: null
    });
    setErrors({});
  }, []);

  return {
    form,
    errors,
    setField,
    setFile,
    setPreviewImage,
    validate,
    toPayload,
    resetForm
  };
}