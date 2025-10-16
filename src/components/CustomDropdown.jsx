import React, { useState, useRef, useEffect } from 'react'

const CustomDropdown = ({ 
  id, 
  name, 
  value, 
  onChange, 
  options, 
  placeholder = "Select an option",
  className = "",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [isOpen])

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
    }
  }

  const handleOptionClick = (optionValue) => {
    // Create a synthetic event to match the onChange signature
    const syntheticEvent = {
      target: {
        name: name,
        value: optionValue
      }
    }
    onChange(syntheticEvent)
    setIsOpen(false)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleToggle()
    }
  }

  const selectedOption = options.find(option => option.value === value)
  const displayValue = selectedOption ? selectedOption.label : placeholder

  return (
    <div 
      ref={dropdownRef}
      className={`custom-dropdown ${className} ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
    >
      <div
        className="custom-dropdown__trigger"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Select ${name}`}
      >
        <span className="custom-dropdown__value">
          {displayValue}
        </span>
        <i className="bi bi-chevron-down custom-dropdown__icon"></i>
      </div>
      
      {isOpen && (
        <div className="custom-dropdown__menu" role="listbox">
          {options.map((option) => (
            <div
              key={option.value}
              className={`custom-dropdown__option ${value === option.value ? 'selected' : ''}`}
              onClick={() => handleOptionClick(option.value)}
              role="option"
              aria-selected={value === option.value}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CustomDropdown
