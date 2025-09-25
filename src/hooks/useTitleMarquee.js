import { useRef } from 'react'

export const useTitleMarquee = () => {
  const titleContainerRef = useRef(null)

  const onMouseEnter = (e) => {
    const container = e.currentTarget
    const inner = container.querySelector('.event-title__inner')
    if (!inner) return

    // Force a reflow to ensure accurate measurements
    container.offsetHeight
    
    // Temporarily remove ellipsis to get true width
    const originalWhiteSpace = inner.style.whiteSpace
    const originalOverflow = inner.style.overflow
    inner.style.whiteSpace = 'nowrap'
    inner.style.overflow = 'visible'
    
    const containerWidth = container.clientWidth
    const innerWidth = inner.scrollWidth
    
    // Restore original styles
    inner.style.whiteSpace = originalWhiteSpace
    inner.style.overflow = originalOverflow
    
    const overflow = Math.max(0, innerWidth - containerWidth)
    
    if (overflow > 0) {
      container.dataset.marquee = '1'
      container.style.setProperty('--overflow-px', `${overflow}px`)
      const dur = Math.min(18, Math.max(6, overflow * 0.03)) // 6s–18s
      container.style.setProperty('--marquee-duration', `${dur}s`)
    } else {
      delete container.dataset.marquee
    }
  }

  const onMouseLeave = (e) => {
    const container = e.currentTarget
    delete container.dataset.marquee
  }

  return {
    titleContainerRef,
    onMouseEnter,
    onMouseLeave
  }
}
