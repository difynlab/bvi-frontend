import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/useAuth'
import { can } from '../../auth/acl'
import EmptyPage from '../../components/EmptyPage'
import UploadMediaModal from '../../components/modals/UploadMediaModal'
import { ConfirmDeleteModal } from '../../components/modals/ConfirmDeleteModal'
import galleryService from '../../services/galleryService'
import '../../styles/sections/Gallery.scss'

const MAX_FILE_SIZE = 5120 * 1024

const getYouTubeEmbedUrl = (url) => {
  if (!url || typeof url !== 'string') return null
  const trimmed = url.trim()
  const ytMatch = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
  if (trimmed.includes('youtube.com/embed/')) return trimmed
  return null
}

const Gallery = () => {
  const { user } = useAuth()
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('images')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, perPage: 12, total: 0, lastPage: 1 })
  const [previewImage, setPreviewImage] = useState(null)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [imageAspectRatios, setImageAspectRatios] = useState({})

  const imageItems = items.filter(i => i.type === 'image')
  const videoItems = items.filter(i => i.type === 'video')

  const loadGallery = useCallback(async () => {
    setLoading(true)
    setError(null)
    setImageAspectRatios({})
    try {
      const response = await galleryService.list(pagination.perPage, pagination.page)
      const list = response?.data?.data ?? []
      setItems(Array.isArray(list) ? list : [])
      if (response?.data) {
        setPagination(prev => ({
          ...prev,
          total: response.data.total ?? 0,
          lastPage: response.data.last_page ?? 1,
          page: response.data.current_page ?? prev.page
        }))
      }
    } catch (err) {
      setError(err?.message ?? 'Error loading gallery')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.perPage])

  useEffect(() => {
    loadGallery()
  }, [loadGallery])

  const handleUploadSuccess = useCallback(() => {
    loadGallery()
    setIsUploadModalOpen(false)
  }, [loadGallery])

  const handleConfirmDelete = useCallback(async () => {
    if (!itemToDelete) return
    setDeleteError('')
    setIsDeleting(true)
    try {
      await galleryService.delete(itemToDelete.id)
      setItemToDelete(null)
      loadGallery()
    } catch (err) {
      setDeleteError(err?.message ?? 'Error deleting image')
    } finally {
      setIsDeleting(false)
    }
  }, [itemToDelete, loadGallery])

  const handleCloseDeleteModal = useCallback(() => {
    setItemToDelete(null)
    setDeleteError('')
  }, [])

  const handleDownloadImage = useCallback(async (e, imageUrl, itemId) => {
    e.preventDefault()
    e.stopPropagation()
    if (!imageUrl) return
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(imageUrl, {
        method: 'GET',
        credentials: 'include',
        ...(token && { headers: { Authorization: `Bearer ${token}` } })
      })
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `gallery-${itemId}.jpg`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      const a = document.createElement('a')
      a.href = imageUrl
      a.download = `gallery-${itemId}.jpg`
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }, [])

  const handleImageLoad = useCallback((itemId, e) => {
    const img = e.target
    const aspectRatio = img.naturalWidth / img.naturalHeight
    let orientation = 'square'
    if (aspectRatio > 1.1) {
      orientation = 'horizontal'
    } else if (aspectRatio < 0.9) {
      orientation = 'vertical'
    }
    setImageAspectRatios(prev => ({
      ...prev,
      [itemId]: orientation
    }))
  }, [])

  const renderImageItem = (item) => {
    const src = item.original_image ?? item.blurred_image ?? item.original_file ?? item.blurred_file ?? item.image
    if (!src) return null
    const orientation = imageAspectRatios[item.id] || 'square'
    return (
      <div
        key={item.id}
        className={`gallery-item gallery-item--image gallery-item--${orientation}`}
        onClick={(e) => {
          if (!e.target.closest('.gallery-item__delete-btn') && !e.target.closest('.gallery-item__download-btn')) {
            setPreviewImage(src)
          }
        }}
      >
        <img
          src={item.blurred_image ?? item.blurred_file ?? src}
          data-src={item.original_image ?? item.original_file ?? src}
          alt=""
          className="gallery-item__img"
          loading="lazy"
          onLoad={(e) => {
            handleImageLoad(item.id, e)
            const orig = e.target.dataset.src
            if (orig && e.target.src !== orig) e.target.src = orig
          }}
        />
        <a
          href={src}
          className="gallery-item__download-btn"
          onClick={(e) => handleDownloadImage(e, src, item.id)}
          aria-label="Download image"
        >
          <i className="bi bi-download"></i>
        </a>
        {can(user, 'gallery:create') && (
          <button
            type="button"
            className="gallery-item__delete-btn"
            onClick={(e) => {
              e.stopPropagation()
              setItemToDelete(item)
            }}
            aria-label="Delete image"
          >
            <i className="bi bi-trash"></i>
          </button>
        )}
      </div>
    )
  }

  const canRenderVideo = (item) => {
    const url = typeof item.url === 'string' ? item.url : (typeof item.file === 'string' ? item.file : null)
    if (!url) return false
    if (getYouTubeEmbedUrl(url)) return true
    if (url.startsWith('http') && !url.includes('youtube') && !url.includes('youtu.be')) return true
    return false
  }

  const renderVideoItem = (item) => {
    const url = typeof item.url === 'string' ? item.url : (typeof item.file === 'string' ? item.file : null)
    const embedUrl = url ? getYouTubeEmbedUrl(url) : null
    if (embedUrl) {
      return (
        <div key={item.id} className="gallery-item gallery-item--video-embed">
          <iframe
            width="560"
            height="315"
            src={embedUrl}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            className="gallery-item__iframe"
          />
          {can(user, 'gallery:create') && (
            <button
              type="button"
              className="gallery-item__delete-btn"
              onClick={(e) => {
                e.stopPropagation()
                setItemToDelete(item)
              }}
              aria-label="Delete video"
            >
              <i className="bi bi-trash"></i>
            </button>
          )}
        </div>
      )
    }
    if (url && url.startsWith('http') && !url.includes('youtube') && !url.includes('youtu.be')) {
      return (
        <div key={item.id} className="gallery-item gallery-item--video">
          <video src={url} controls className="gallery-item__video" />
          {can(user, 'gallery:create') && (
            <button
              type="button"
              className="gallery-item__delete-btn"
              onClick={(e) => {
                e.stopPropagation()
                setItemToDelete(item)
              }}
              aria-label="Delete video"
            >
              <i className="bi bi-trash"></i>
            </button>
          )}
        </div>
      )
    }
    return null
  }

  const renderableVideoItems = videoItems.filter(canRenderVideo)

  return (
    <div className="gallery-container">
      <div className="gallery-header">
        <div className="gallery-header-title">
          <h1>Gallery</h1>
          <p>Manage gallery images.</p>
        </div>
        {can(user, 'gallery:create') && (
          <div className="gallery-actions">
            <button
              className="add-gallery-btn gallery-add-btn"
              onClick={() => setIsUploadModalOpen(true)}
              aria-label="Upload Media"
            >
              <i className="bi bi-plus" aria-hidden="true"></i>
              <span className="btn-label">Upload Media</span>
            </button>
          </div>
        )}
      </div>

      <div className="gallery-section-tabs">
        <button
          type="button"
          className={`gallery-section-tab ${activeTab === 'images' ? 'active' : ''}`}
          onClick={() => setActiveTab('images')}
        >
          Images <i className="bi bi-camera"></i>
        </button>
        <button
          type="button"
          className={`gallery-section-tab ${activeTab === 'videos' ? 'active' : ''}`}
          onClick={() => setActiveTab('videos')}
        >
          Videos <i className="bi bi-play-btn"></i>
        </button>
      </div>

      <div className="gallery-content">
        {loading ? (
          <div className="gallery-skeleton-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="gallery-skeleton-item" />
            ))}
          </div>
        ) : error ? (
          <div className="gallery-error" role="alert">{error}</div>
        ) : activeTab === 'images' ? (
          imageItems.length === 0 ? (
            <EmptyPage title="No images uploaded yet..." />
          ) : (
            <div className="gallery-grid">
              {imageItems.map(renderImageItem)}
            </div>
          )
        ) : renderableVideoItems.length === 0 ? (
          <EmptyPage title="No videos yet..." />
        ) : (
          <div className="gallery-grid gallery-grid--videos">
            {renderableVideoItems.map(renderVideoItem)}
          </div>
        )}
      </div>

      {isUploadModalOpen && (
        <UploadMediaModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onUploadSuccess={handleUploadSuccess}
          maxFileSize={MAX_FILE_SIZE}
        />
      )}

      {previewImage && (
        <div
          className="gallery-image-modal-overlay"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="gallery-image-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="gallery-image-modal__close"
              onClick={() => setPreviewImage(null)}
              aria-label="Close image preview"
            >
              <i className="bi bi-x"></i>
            </button>
            <img src={previewImage} alt="" className="gallery-image-modal__img" />
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={!!itemToDelete}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        message="Are you sure you want to delete this image? This action cannot be reversed."
        isDeleting={isDeleting}
        errorMessage={deleteError}
      />
    </div>
  )
}

export { Gallery }
