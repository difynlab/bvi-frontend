import { useState, useEffect, createContext, useContext, useCallback } from 'react'

// Create a context for modal state management
const ModalStateContext = createContext()

// Provider component to wrap the app
export const ModalStateProvider = ({ children }) => {
  const [openModals, setOpenModals] = useState(new Set())

  const registerModal = useCallback((modalId, isOpen) => {
    setOpenModals(prev => {
      const newSet = new Set(prev)
      if (isOpen) {
        newSet.add(modalId)
      } else {
        newSet.delete(modalId)
      }
      return newSet
    })
  }, [])

  const isAnyModalOpen = openModals.size > 0

  return (
    <ModalStateContext.Provider value={{ isAnyModalOpen, registerModal }}>
      {children}
    </ModalStateContext.Provider>
  )
}

// Hook to use modal state
export const useModalState = () => {
  const context = useContext(ModalStateContext)
  if (!context) {
    // Fallback if not wrapped in provider
    return { isAnyModalOpen: false, registerModal: () => {} }
  }
  return context
}

// Hook for individual modals to register their state
export const useModalRegistration = (modalId, isOpen) => {
  const { registerModal } = useModalState()
  
  useEffect(() => {
    registerModal(modalId, isOpen)
  }, [modalId, isOpen, registerModal])
}
