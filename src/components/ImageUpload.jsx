import React, { useState, useRef, useCallback } from 'react';
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

  const handleFile = useCallback((file) => {
    if (file && file.type.startsWith('image/')) {
      setFileName(file.name);
      onFileSelect(file);
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
          <div className="image-upload-status">
            {fileName || 'No File Chosen'}
          </div>
        </div>
      </div>

      <div 
        className={`image-upload-dropzone ${isDragOver ? 'image-upload-dropzone--dragover' : ''}`}
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
