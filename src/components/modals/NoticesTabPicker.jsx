import React from 'react'

export default function NoticesTabPicker({ 
  open, 
  onClose, 
  categories, 
  activeTabId, 
  onSelect, 
  canManage, 
  onAddCategory, 
  onDeleteCategory 
}) {
  if (!open) return null

  return (
    <div className="notices-modal-overlay" id="noticesTabPicker" role="dialog" aria-modal="true" aria-label="Select category">
      <div className="notices-modal notices-tab-picker">
        <div className="notices-modal-header">
          <h2>Categories</h2>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close">
            <i className="bi bi-x" aria-hidden="true"></i>
          </button>
        </div>
        <div className="notices-modal-body">
          <ul className="notices-tab-picker__list" role="listbox" aria-activedescendant={activeTabId || undefined}>
            {categories.map(c => (
              <li key={c.id} className={`notices-tab-picker__item${c.id === activeTabId ? ' is-active' : ''}`}>
                <button
                  type="button"
                  role="option"
                  aria-selected={c.id === activeTabId}
                  onClick={() => { onSelect(c.id); onClose(); }}
                >
                  {c.name}
                </button>
                {canManage && (
                  <button 
                    type="button" 
                    className="notices-tab-picker__delete" 
                    onClick={() => onDeleteCategory(c.id)} 
                    aria-label={`Delete ${c.name}`}
                  >
                    <i className="bi bi-trash" aria-hidden="true"></i>
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
