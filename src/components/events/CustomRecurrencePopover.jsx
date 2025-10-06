import React, { useState, useEffect, useRef } from 'react'

const DAYS_OF_WEEK = [
  { label: 'S', value: 'SU' },
  { label: 'M', value: 'MO' },
  { label: 'T', value: 'TU' },
  { label: 'W', value: 'WE' },
  { label: 'T', value: 'TH' },
  { label: 'F', value: 'FR' },
  { label: 'S', value: 'SA' }
]

const UNIT_OPTIONS = [
  { label: 'weeks', value: 'week' },
  { label: 'months', value: 'month' },
  { label: 'years', value: 'year' }
]

const ENDS_MODES = [
  { label: 'Never', value: 'NEVER' },
  { label: 'Specific date:', value: 'ON_DATE' },
  { label: 'Occurrences:', value: 'AFTER_OCCURRENCES' }
]

export const CustomRecurrencePopover = ({ 
  isOpen, 
  onClose, 
  onUpdate, 
  initialRecurrence = null 
}) => {
  const [recurrence, setRecurrence] = useState({
    kind: 'CUSTOM',
    interval: 1,
    unit: 'week',
    daysOfWeek: ['MO','TU','WE','TH','FR','SA','SU'],
    ends: { mode: 'NEVER', date: '', count: null }
  })

  const [errors, setErrors] = useState({})
  const popoverRef = useRef(null)

  useEffect(() => {
    if (initialRecurrence) {
      setRecurrence(initialRecurrence)
    }
  }, [initialRecurrence])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  const getTodayDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  const validateForm = () => {
    const newErrors = {}

    if (!recurrence.interval || recurrence.interval < 1) {
      newErrors.interval = 'Interval must be at least 1'
    }

    if (recurrence.unit === 'week' && recurrence.daysOfWeek.length === 0) {
      newErrors.daysOfWeek = 'Select at least one day'
    }

    if (recurrence.ends.mode === 'ON_DATE') {
      if (!recurrence.ends.date) {
        newErrors.endsDate = 'Date is required'
      } else if (recurrence.ends.date < getTodayDate()) {
        newErrors.endsDate = 'Date must be today or later'
      }
    } else if (recurrence.ends.mode === 'AFTER_OCCURRENCES') {
      if (!recurrence.ends.count || recurrence.ends.count < 1) {
        newErrors.endsCount = 'Count must be at least 1'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleStepperIncrement = (field) => {
    if (field === 'ends.count') {
      setRecurrence(prev => ({
        ...prev,
        ends: {
          ...prev.ends,
          count: Math.max(1, (prev.ends.count || 0) + 1)
        }
      }))
    } else {
      setRecurrence(prev => ({
        ...prev,
        [field]: Math.max(1, (prev[field] || 0) + 1)
      }))
    }
  }

  const handleStepperDecrement = (field) => {
    if (field === 'ends.count') {
      setRecurrence(prev => ({
        ...prev,
        ends: {
          ...prev.ends,
          count: Math.max(1, (prev.ends.count || 1) - 1)
        }
      }))
    } else {
      setRecurrence(prev => ({
        ...prev,
        [field]: Math.max(1, (prev[field] || 1) - 1)
      }))
    }
  }

  const handleDayToggle = (dayValue) => {
    setRecurrence(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(dayValue)
        ? prev.daysOfWeek.filter(d => d !== dayValue)
        : [...prev.daysOfWeek, dayValue]
    }))
  }

  const handleUpdate = () => {
    if (validateForm()) {
      onUpdate(recurrence)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div 
      ref={popoverRef}
      className="custom-recurrence-popover"
      role="dialog"
      aria-labelledby="custom-recurrence-title"
    >
      <h3 id="custom-recurrence-title">Custom Recurrence</h3>
      
      <div className="repeat-every">
        <label htmlFor="interval">Repeat every:</label>
        <div className="interval-controls">
          <input
            type="number"
            id="interval"
            min="1"
            value={recurrence.interval}
            onChange={(e) => setRecurrence(prev => ({ 
              ...prev, 
              interval: parseInt(e.target.value) || 1 
            }))}
            aria-invalid={errors.interval ? 'true' : 'false'}
          />
          <div className="stepper">
            <button
              type="button"
              onClick={() => handleStepperIncrement('interval')}
              aria-label="Increase interval"
            >
              <i className="bi bi-chevron-up"></i>
            </button>
            <button
              type="button"
              onClick={() => handleStepperDecrement('interval')}
              aria-label="Decrease interval"
            >
              <i className="bi bi-chevron-down"></i>
            </button>
          </div>
          <select
            value={recurrence.unit}
            onChange={(e) => setRecurrence(prev => ({ 
              ...prev, 
              unit: e.target.value 
            }))}
          >
            {UNIT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {errors.interval && (
          <span className="error-text" role="alert">{errors.interval}</span>
        )}
      </div>

      {recurrence.unit === 'week' && (
        <div className="repeat-on">
          <label>Repeat on:</label>
          <div className="dow">
            {DAYS_OF_WEEK.map(day => (
              <div key={day.value} className="day">
                <input
                  type="checkbox"
                  id={`day-${day.value}`}
                  checked={recurrence.daysOfWeek.includes(day.value)}
                  onChange={() => handleDayToggle(day.value)}
                />
                <label htmlFor={`day-${day.value}`}>{day.label}</label>
              </div>
            ))}
          </div>
          {errors.daysOfWeek && (
            <span className="error-text" role="alert">{errors.daysOfWeek}</span>
          )}
        </div>
      )}

      <fieldset className="ends">
        <legend>Ends:</legend>
        {ENDS_MODES.map(mode => (
          <div key={mode.value} className="ends-option">
            <input
              type="radio"
              id={`ends-${mode.value}`}
              name="ends-mode"
              value={mode.value}
              checked={recurrence.ends.mode === mode.value}
              onChange={(e) => setRecurrence(prev => ({
                ...prev,
                ends: { ...prev.ends, mode: e.target.value }
              }))}
            />
            <label htmlFor={`ends-${mode.value}`}>{mode.label}</label>
            
            {mode.value === 'ON_DATE' && (
              <input
                type="date"
                min={getTodayDate()}
                value={recurrence.ends.date}
                onChange={(e) => setRecurrence(prev => ({
                  ...prev,
                  ends: { ...prev.ends, date: e.target.value }
                }))}
                disabled={recurrence.ends.mode !== 'ON_DATE'}
                aria-invalid={errors.endsDate ? 'true' : 'false'}
              />
            )}
            
            {mode.value === 'AFTER_OCCURRENCES' && (
              <div className="occurrences-controls">
                <input
                  type="number"
                  min="1"
                  value={recurrence.ends.count || ''}
                  onChange={(e) => setRecurrence(prev => ({
                    ...prev,
                    ends: { ...prev.ends, count: parseInt(e.target.value) || null }
                  }))}
                  disabled={recurrence.ends.mode !== 'AFTER_OCCURRENCES'}
                  aria-invalid={errors.endsCount ? 'true' : 'false'}
                />
                <div className="stepper">
                  <button
                    type="button"
                    onClick={() => handleStepperIncrement('ends.count')}
                    disabled={recurrence.ends.mode !== 'AFTER_OCCURRENCES'}
                    aria-label="Increase occurrences"
                  >
                    <i className="bi bi-chevron-up"></i>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStepperDecrement('ends.count')}
                    disabled={recurrence.ends.mode !== 'AFTER_OCCURRENCES'}
                    aria-label="Decrease occurrences"
                  >
                    <i className="bi bi-chevron-down"></i>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {errors.endsDate && (
          <span className="error-text" role="alert">{errors.endsDate}</span>
        )}
        {errors.endsCount && (
          <span className="error-text" role="alert">{errors.endsCount}</span>
        )}
      </fieldset>

      <div className="actions">
        <button
          type="button"
          className="update-btn"
          onClick={handleUpdate}
        >
          Update
        </button>
      </div>
    </div>
  )
}
