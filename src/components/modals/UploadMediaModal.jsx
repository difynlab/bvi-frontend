import React, { useState, useRef } from 'react'
import { useModalBackdropClose } from '../../hooks/useModalBackdropClose'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import ModalLifecycleLock from './ModalLifecycleLock'
import galleryService from '../../services/galleryService'
import '../../styles/components/UploadMediaModal.scss'

const UploadMediaModal = ({ isOpen, onClose, onUploadSuccess, maxFileSize = 5120 * 1024 }) => {
  const [activeTab, setActiveTab] = useState('images')
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedImages, setSelectedImages] = useState([])
  const [selectedVideoUrl, setSelectedVideoUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  const fileInputRef = useRef(null)

  useBodyScrollLock(isOpen)
  const modalBackdropClose = useModalBackdropClose(onClose)

  if (!isOpen) return null

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'))
    if (files.length > 0) {
      handleFiles(files)
    }
  }

  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files).filter(file => file.type.startsWith('image/'))
    if (files.length > 0) {
      handleFiles(files)
    }
  }

  const handleFiles = (files) => {
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name
    }))
    setSelectedImages(prev => [...prev, ...newImages])
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  const removeImage = (index) => {
    const imageToRemove = selectedImages[index]
    if (imageToRemove.preview) {
      URL.revokeObjectURL(imageToRemove.preview)
    }
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleClose = () => {
    selectedImages.forEach(img => {
      if (img.preview) {
        URL.revokeObjectURL(img.preview)
      }
    })
    setSelectedImages([])
    setSelectedVideoUrl('')
    setErrorMessage('')
    setUploading(false)
    setUploadProgress(0)
    setActiveTab('images')
    onClose()
  }

  const getYouTubeEmbedUrl = (url) => {
    if (!url || typeof url !== 'string') return null
    const trimmed = url.trim()
    const ytMatch = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
    if (trimmed.includes('youtube.com/embed/')) return trimmed
    return null
  }

  const handleVideoUrlChange = (e) => {
    const url = e.target.value
    setSelectedVideoUrl(url)
    setErrorMessage('')
  }

  const isValidYouTubeUrl = (url) => {
    if (!url || typeof url !== 'string') return false
    const trimmed = url.trim()
    return !!(
      trimmed.includes('youtube.com/watch') ||
      trimmed.includes('youtu.be/') ||
      trimmed.includes('youtube.com/embed/')
    )
  }

  const handleSubmit = async () => {
    setErrorMessage('')
    if (activeTab === 'images') {
      if (selectedImages.length === 0) {
        setErrorMessage('Please select at least one image.')
        return
      }
      const oversized = selectedImages.find(img => img.file.size > maxFileSize)
      if (oversized) {
        setErrorMessage('Each file must be 5 MB or less.')
        return
      }
      setUploading(true)
      try {
        for (let i = 0; i < selectedImages.length; i++) {
          const result = await galleryService.create('image', selectedImages[i].file, 1, (p) => {
            setUploadProgress(Math.round(((i / selectedImages.length) * 100) + (p / selectedImages.length)))
          })
          if (result?.http_status !== 200 && result?.data === undefined) {
            throw new Error(result?.message || 'Upload failed')
          }
          setUploadProgress(Math.round(((i + 1) / selectedImages.length) * 100))
        }
        handleClose()
        onUploadSuccess?.()
      } catch (err) {
        setErrorMessage(err?.message ?? 'Upload failed.')
      } finally {
        setUploading(false)
        setUploadProgress(0)
      }
      return
    }
    if (activeTab === 'video') {
      const trimmedUrl = selectedVideoUrl.trim()
      if (!trimmedUrl) {
        setErrorMessage('Please enter a YouTube URL.')
        return
      }
      if (!isValidYouTubeUrl(trimmedUrl)) {
        setErrorMessage('Please enter a valid YouTube URL.')
        return
      }
      setUploading(true)
      try {
        await galleryService.create('video', trimmedUrl, 1)
        handleClose()
        onUploadSuccess?.()
      } catch (err) {
        setErrorMessage(err?.message ?? 'Upload failed.')
      } finally {
        setUploading(false)
        setUploadProgress(0)
      }
    }
  }

  const canSubmitImages = selectedImages.length > 0 && !uploading
  const canSubmitVideo = selectedVideoUrl.trim().length > 0 && isValidYouTubeUrl(selectedVideoUrl.trim()) && !uploading

  return (
    <div
      className="gallery-upload-modal-overlay"
      onPointerDown={modalBackdropClose.onBackdropPointerDown}
      onPointerUp={modalBackdropClose.onBackdropPointerUp}
      onPointerCancel={modalBackdropClose.onBackdropPointerCancel}
    >
      <ModalLifecycleLock />
      <div
        className="gallery-upload-modal"
        onPointerDown={modalBackdropClose.stopInsidePointer}
        onClick={modalBackdropClose.stopInsidePointer}
      >
        <button
          className="close-btn"
          onClick={handleClose}
          aria-label="Close modal"
        >
          <i className="bi bi-x"></i>
        </button>

        <div className="gallery-upload-modal-header">
          <h2>Upload Media</h2>
        </div>

        <div className="gallery-upload-modal-tabs">
          <button
            type="button"
            className={`gallery-upload-tab ${activeTab === 'images' ? 'active' : ''}`}
            onClick={() => setActiveTab('images')}
          >
            Images <i className="bi bi-camera"></i>
          </button>
          <button
            type="button"
            className={`gallery-upload-tab ${activeTab === 'video' ? 'active' : ''}`}
            onClick={() => setActiveTab('video')}
          >
            Video <i className="bi bi-play-btn"></i>
          </button>
        </div>

        {errorMessage && (
          <div className="gallery-upload-modal-error" role="alert">
            {errorMessage}
          </div>
        )}

        <div className="gallery-upload-modal-content">
          {activeTab === 'images' ? (
            <div className="gallery-upload-images">
              <div
                className={`dropzone dropzone-surface ${isDragOver ? 'drag-over' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileInputChange}
                  className="hidden-file-input"
                />
                <div className="dropzone-content">
                  <i className="bi bi-cloud-upload dropzone-icon"></i>
                  <p className="dropzone-label">Drag and drop images here</p>
                  <p className="dropzone-separator">or</p>
                  <button
                    type="button"
                    className="dropzone-browse-btn"
                    onClick={handleBrowseClick}
                  >
                    Browse Files
                  </button>
                </div>
              </div>

              {selectedImages.length > 0 && (
                <div className="selected-images-preview">
                  <h3>Selected Images ({selectedImages.length})</h3>
                  <div className="images-grid">
                    {selectedImages.map((image, index) => (
                      <div key={index} className="image-preview-item">
                        <img src={image.preview} alt={image.name} />
                        <button
                          type="button"
                          className="remove-image-btn"
                          onClick={() => removeImage(index)}
                          aria-label={`Remove ${image.name}`}
                        >
                          <i className="bi bi-x"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {uploading && (
                <div className="gallery-upload-progress">
                  <progress value={uploadProgress} max={100} />
                  <span>{uploadProgress}%</span>
                </div>
              )}

              <div className="gallery-upload-submit-container">
                <button
                  type="button"
                  className="upload-now-btn"
                  onClick={handleSubmit}
                  disabled={!canSubmitImages}
                >
                  {uploading ? 'Uploading...' : 'Submit'}
                </button>
              </div>
            </div>
          ) : (
            <div className="gallery-upload-video">
              <div className="form-group">
                <label htmlFor="videoUrl">YouTube URL</label>
                <input
                  type="text"
                  id="videoUrl"
                  value={selectedVideoUrl}
                  onChange={handleVideoUrlChange}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="gallery-upload-video-input"
                />
              </div>

              {uploading && (
                <div className="gallery-upload-progress">
                  <progress value={uploadProgress} max={100} />
                  <span>{uploadProgress}%</span>
                </div>
              )}

              <div className="gallery-upload-submit-container">
                <button
                  type="button"
                  className="upload-now-btn"
                  onClick={handleSubmit}
                  disabled={!canSubmitVideo}
                >
                  {uploading ? 'Uploading...' : 'Submit'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UploadMediaModal
