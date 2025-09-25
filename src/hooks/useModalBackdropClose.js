import { useRef } from 'react'

export const useModalBackdropClose = (closeFn) => {
  const startedOnBackdropRef = useRef(false)
  const activePointerIdRef = useRef(null)

  const onBackdropPointerDown = (e) => {
    if (e.target === e.currentTarget) {
      startedOnBackdropRef.current = true
      activePointerIdRef.current = e.pointerId
    } else {
      startedOnBackdropRef.current = false
      activePointerIdRef.current = null
    }
  }

  const onBackdropPointerUp = (e) => {
    const started = startedOnBackdropRef.current
    const samePointer = activePointerIdRef.current === e.pointerId
    const endedOnBackdrop = e.target === e.currentTarget
    
    // Close ONLY if started & ended on backdrop with same pointer
    if (started && samePointer && endedOnBackdrop) {
      closeFn()
    }
    
    // Reset
    startedOnBackdropRef.current = false
    activePointerIdRef.current = null
  }

  const onBackdropPointerCancel = () => {
    startedOnBackdropRef.current = false
    activePointerIdRef.current = null
  }

  const stopInsidePointer = (e) => {
    e.stopPropagation()
  }

  return {
    onBackdropPointerDown,
    onBackdropPointerUp,
    onBackdropPointerCancel,
    stopInsidePointer
  }
}
