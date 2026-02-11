import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../../context/useAuth'
import { can } from '../../auth/acl'
import EmptyPage from '../../components/EmptyPage'
import UploadMediaModal from '../../components/modals/UploadMediaModal'
import { ConfirmDeleteModal } from '../../components/modals/ConfirmDeleteModal'
import galleryService from '../../services/galleryService'
import '../../styles/sections/Gallery.scss'

const MAX_FILE_SIZE = 5120 * 1024
const GALLERY_COLS = 5
const PLACEHOLDER_LOGO = '/images/bvi-logo-downloads.png'

const key = (r, c) => `${r},${c}`

const findFirstFit = (occupied, orientation) => {
  for (let r = 0; r < 500; r++) {
    for (let c = 0; c < GALLERY_COLS; c++) {
      if (orientation === 'square') {
        if (!occupied.has(key(r, c))) return [r, c]
      } else if (orientation === 'horizontal') {
        if (c <= GALLERY_COLS - 2 && !occupied.has(key(r, c)) && !occupied.has(key(r, c + 1))) return [r, c]
      } else if (orientation === 'vertical') {
        if (!occupied.has(key(r, c)) && !occupied.has(key(r + 1, c))) return [r, c]
      }
    }
  }
  return [0, 0]
}

const buildPlacements = (imageItems, imageAspectRatios) => {
  const occupied = new Set()
  const placedImages = []

  for (const item of imageItems) {
    const orientation = imageAspectRatios[item.id] || 'square'
    const [row, col] = findFirstFit(occupied, orientation)
    if (orientation === 'square') {
      occupied.add(key(row, col))
    } else if (orientation === 'horizontal') {
      occupied.add(key(row, col))
      occupied.add(key(row, col + 1))
    } else if (orientation === 'vertical') {
      occupied.add(key(row, col))
      occupied.add(key(row + 1, col))
    }
    placedImages.push({ item, row, col, orientation })
  }

  let maxRow = 0
  for (const p of placedImages) {
    const endRow = p.orientation === 'vertical' ? p.row + 1 : p.row
    if (endRow > maxRow) maxRow = endRow
  }

  const emptyRuns = []
  for (let r = 0; r <= maxRow; r++) {
    let runStart = null
    for (let c = 0; c <= GALLERY_COLS; c++) {
      const isEmpty = c < GALLERY_COLS && !occupied.has(key(r, c))
      if (isEmpty && runStart === null) runStart = c
      if (!isEmpty || c === GALLERY_COLS) {
        if (runStart !== null) {
          const runLen = c - runStart
          if (runLen === 1 || runLen === 2) {
            for (let j = runStart; j < c; j++) emptyRuns.push({ row: r, col: j })
          }
          runStart = null
        }
      }
    }
  }

  const byRow = {}
  for (const cell of emptyRuns) {
    if (!byRow[cell.row]) byRow[cell.row] = []
    byRow[cell.row].push(cell)
  }
  const maxTwoPerRow = []
  for (let r = 0; r <= maxRow; r++) {
    const rowCells = (byRow[r] || []).sort((a, b) => a.col - b.col)
    maxTwoPerRow.push(...rowCells.slice(0, 2))
  }

  const placeholderSet = new Set(maxTwoPerRow.map(({ row, col }) => key(row, col)))
  const sorted = [...maxTwoPerRow].sort((a, b) => a.row !== b.row ? a.row - b.row : a.col - b.col)
  const colors = {}
  const getNeighborKeys = (r, c) => [key(r, c - 1), key(r, c + 1), key(r - 1, c), key(r + 1, c)].filter(k => placeholderSet.has(k))
  for (const { row, col } of sorted) {
    const k = key(row, col)
    let color = 0
    for (const nk of getNeighborKeys(row, col)) {
      if (colors[nk] === 0) { color = 1; break }
    }
    colors[k] = color
  }

  const placeholders = sorted.map(({ row, col }) => ({ row, col, color: colors[key(row, col)] === 0 ? 'blue' : 'red' }))
  return { placedImages, placeholders }
}

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
  const [pagination, setPagination] = useState({ page: 1, perPage: 20, total: 0, lastPage: 1 })
  const [paginationStart, setPaginationStart] = useState(1)
  const [previewImage, setPreviewImage] = useState(null)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [imageAspectRatios, setImageAspectRatios] = useState({})

  const imageItems = items.filter(i => i.type === 'image')
  const videoItems = items.filter(i => i.type === 'video')

  const totalPages = Math.max(1, pagination.lastPage)
  const visiblePages = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    const endPage = Math.min(paginationStart + 4, totalPages)
    return Array.from({ length: endPage - paginationStart + 1 }, (_, i) => paginationStart + i)
  }, [totalPages, paginationStart])

  useEffect(() => {
    if (pagination.page > totalPages && totalPages > 0) {
      setPagination(prev => ({ ...prev, page: 1 }))
      setPaginationStart(1)
    }
  }, [totalPages, pagination.page])

  useEffect(() => {
    if (totalPages <= 5) {
      setPaginationStart(1)
    } else {
      if (pagination.page < paginationStart) {
        setPaginationStart(pagination.page)
      } else if (pagination.page > paginationStart + 4) {
        setPaginationStart(pagination.page - 4)
      }
    }
  }, [pagination.page, totalPages])

  const showLeftArrow = totalPages > 5 && paginationStart > 1
  const showRightArrow = totalPages > 5
  const isRightArrowDisabled = totalPages > 5 && paginationStart + 4 >= totalPages

  const handlePreviousPage = () => {
    if (pagination.page > 1) {
      setPagination(prev => ({ ...prev, page: prev.page - 1 }))
    }
  }

  const handleNextPage = () => {
    if (pagination.page < totalPages) {
      setPagination(prev => ({ ...prev, page: prev.page + 1 }))
    }
  }

  const { placedImages, placeholders } = useMemo(
    () => buildPlacements(imageItems, imageAspectRatios),
    [imageItems, imageAspectRatios]
  )

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

  const getGridStyle = (row, col, orientation) => {
    if (orientation === 'horizontal') {
      return { gridColumn: `${col + 1} / ${col + 3}`, gridRow: row + 1 }
    }
    if (orientation === 'vertical') {
      return { gridColumn: col + 1, gridRow: `${row + 1} / ${row + 3}` }
    }
    return { gridColumn: col + 1, gridRow: row + 1 }
  }

  const renderImageItem = (item, placement) => {
    const src = item.original_image ?? item.blurred_image ?? item.original_file ?? item.blurred_file ?? item.image
    if (!src) return null
    const blurredSrc = item.blurred_image ?? item.blurred_file ?? src
    const originalSrc = item.original_image ?? item.original_file ?? src
    const orientation = placement?.orientation ?? imageAspectRatios[item.id] ?? 'square'
    const style = placement ? getGridStyle(placement.row, placement.col, orientation) : undefined
    return (
      <div
        key={item.id}
        className={`gallery-item gallery-item--image gallery-item--${orientation}`}
        style={style}
        onClick={(e) => {
          if (!e.target.closest('.gallery-item__delete-btn') && !e.target.closest('.gallery-item__download-btn')) {
            setPreviewImage(originalSrc)
          }
        }}
      >
        <img
          src={blurredSrc}
          data-src={originalSrc}
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
          href={originalSrc}
          className="gallery-item__download-btn"
          onClick={(e) => handleDownloadImage(e, originalSrc, item.id)}
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
            <>
              <div className="gallery-grid gallery-grid--fixed">
                {placedImages.map((p) => renderImageItem(p.item, p))}
                {placeholders.map(({ row, col, color }, i) => (
                  <div
                    key={`ph-${row}-${col}`}
                    className={`gallery-placeholder gallery-placeholder--${color}`}
                    style={getGridStyle(row, col, 'square')}
                    aria-hidden
                  >
                    <img src={PLACEHOLDER_LOGO} alt="" className="gallery-placeholder__img" />
                  </div>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="gallery-pagination">
                  <div className="pagination__buttons">
                    {showLeftArrow && (
                      <button
                        className="pagination__arrow"
                        type="button"
                        onClick={handlePreviousPage}
                        aria-label="Previous pages"
                      >
                        <i className="bi bi-chevron-left" aria-hidden="true"></i>
                      </button>
                    )}
                    {visiblePages.map((page) => (
                      <button
                        key={page}
                        className={`pagination__button ${pagination.page === page ? 'pagination__button--active' : ''}`}
                        type="button"
                        onClick={() => setPagination(prev => ({ ...prev, page }))}
                      >
                        {page}
                      </button>
                    ))}
                    {showRightArrow && (
                      <button
                        className="pagination__arrow"
                        type="button"
                        onClick={handleNextPage}
                        disabled={isRightArrowDisabled}
                        aria-label="Next pages"
                      >
                        <i className="bi bi-chevron-right" aria-hidden="true"></i>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
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
