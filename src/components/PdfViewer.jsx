import React, { useEffect, useRef, useState } from 'react'

export function PdfViewer({ src, className = '' }) {
  const containerRef = useRef(null)
  const [numPages, setNumPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const scaleRef = useRef(1.5)

  useEffect(() => {
    if (!src) {
      setLoading(false)
      setNumPages(0)
      return
    }
    let cancelled = false
    const canvases = []

    const load = async () => {
      try {
        const pdfjs = await import('pdfjs-dist')
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.js'

        let loadingTask
        if (src.startsWith('/') || src.startsWith('./')) {
          const url = src.startsWith('/') ? `${window.location.origin}${src}` : new URL(src, window.location.href).href
          const res = await fetch(url)
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const contentType = (res.headers.get('content-type') || '').toLowerCase()
          const data = await res.arrayBuffer()
          const bytes = new Uint8Array(data)
          if (bytes.length < 5 || bytes[0] !== 0x25 || bytes[1] !== 0x50 || bytes[2] !== 0x44 || bytes[3] !== 0x46) {
            throw new Error('Server did not return a valid PDF. Check the file path.')
          }
          loadingTask = pdfjs.getDocument({ data: bytes })
        } else {
          loadingTask = pdfjs.getDocument({ url: src })
        }
        const pdf = await loadingTask.promise
        if (cancelled) return
        const n = pdf.numPages
        setNumPages(n)
        setError(null)
        const container = containerRef.current
        if (!container) return
        container.innerHTML = ''
        const containerWidth = container.clientWidth || 800
        const firstPage = await pdf.getPage(1)
        const baseViewport = firstPage.getViewport({ scale: 1 })
        const scale = containerWidth / baseViewport.width
        scaleRef.current = scale
        for (let i = 1; i <= n; i++) {
          if (cancelled) break
          const page = await pdf.getPage(i)
          const viewport = page.getViewport({ scale })
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          canvas.height = viewport.height
          canvas.width = viewport.width
          canvas.style.width = '100%'
          canvas.style.height = 'auto'
          canvas.style.display = 'block'
          container.appendChild(canvas)
          canvases.push(canvas)
          await page.render({ canvasContext: ctx, viewport }).promise
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load PDF')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
      canvases.forEach(c => c.remove())
    }
  }, [src])

  if (!src) {
    return (
      <div className={`pdf-viewer pdf-viewer--empty ${className}`.trim()}>
        <p>No PDF source provided.</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`pdf-viewer pdf-viewer--error ${className}`.trim()}>
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className={`pdf-viewer ${className}`.trim()}>
      {loading && <div className="pdf-viewer__loading">Loading PDF…</div>}
      <div ref={containerRef} className="pdf-viewer__pages" aria-label={`PDF document, ${numPages} page${numPages !== 1 ? 's' : ''}`} />
    </div>
  )
}
