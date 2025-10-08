import React, { useState, useRef, useCallback } from 'react';
import { fileToCompressedDataUrl } from '../utils/imageCompression';
import '../styles/components/ImageUpload.scss';

export default function ImageUpload({ 
  onFileSelect, 
  selectedFile, 
  preview, 
  accept = "image/*",
  className = ""
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef(null);

  const handleFile = useCallback(async (file) => {
    if (file && file.type.startsWith('image/')) {
      setFileName(file.name);
      
      try {
        // Compress the image automatically
        const compressedDataUrl = await fileToCompressedDataUrl(file);
        
        // Create a blob from the compressed data URL
        const response = await fetch(compressedDataUrl);
        const blob = await response.blob();
        const compressedFile = new File([blob], file.name, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });
        
        onFileSelect(compressedFile);
      } catch (error) {
        console.error('Error compressing image:', error);
        // Fallback to original file if compression fails
        onFileSelect(file);
      }
    }
  }, [onFileSelect]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleFileInputChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleChooseFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleClearFile = useCallback(() => {
    setFileName('');
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onFileSelect]);

  return (
    <div className={`image-upload ${className}`}>
      <div className="image-upload-header">
        <label className="image-upload-label">
          Profile Picture<span className="image-upload-required">*</span>
        </label>
        <div className="image-upload-buttons">
          <button 
            type="button" 
            className="image-upload-choose-btn"
            onClick={handleChooseFile}
          >
            Choose File
          </button>
        </div>
      </div>

      <div 
        className={`image-upload-dropzone dropzone-surface ${isDragOver ? 'image-upload-dropzone--dragover' : ''}`}
        data-has-file={Boolean(preview)}
        title={fileName || undefined}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleChooseFile}
      >
        {preview ? (
          <div className="image-upload-preview">
            <img src={preview} alt="Preview" className="image-upload-preview-img" />
            <button 
              type="button" 
              className="image-upload-clear-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleClearFile();
              }}
            >
              <i className="bi bi-x" aria-hidden="true"></i>
            </button>
          </div>
        ) : (
          <div className="image-upload-placeholder">
            <div className="image-upload-placeholder-text">
              <p>Drag and drop an image here</p>
              <p>or click to browse</p>
            </div>
          </div>
        )}
      </div>
      <div 
            className="image-upload-status"
            title={fileName || undefined}
          >
            {fileName || 'No File Chosen'}
          </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInputChange}
        className="image-upload-hidden-input"
        aria-hidden="true"
      />
    </div>
  );
}
