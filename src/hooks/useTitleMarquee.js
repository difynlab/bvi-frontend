import { useRef } from 'react'

export const useTitleMarquee = () => {
  const titleContainerRef = useRef(null)

  const onMouseEnter = (e) => {
    const container = e.currentTarget
    const inner = container.querySelector('.event-title__inner')
    if (!inner) return

    // Force a reflow to ensure accurate measurements
    container.offsetHeight
    
    // Temporarily remove ellipsis to get true width using classes
    inner.classList.add('marquee-measure')
    
    const containerWidth = container.clientWidth
    const innerWidth = inner.scrollWidth
    
    // Remove measurement class
    inner.classList.remove('marquee-measure')
    
    const overflow = Math.max(0, innerWidth - containerWidth)
    
    if (overflow > 0) {
      container.dataset.marquee = '1'
      container.dataset.overflowPx = `${overflow}px`
      const dur = Math.min(18, Math.max(6, overflow * 0.03)) // 6s–18s
      container.dataset.marqueeDuration = `${dur}s`
      
      container.classList.add('marquee-active')
    } else {
      delete container.dataset.marquee
      container.classList.remove('marquee-active')
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
