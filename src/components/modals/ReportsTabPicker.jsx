import React from 'react'

export default function ReportsTabPicker({ 
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
    <div className="reports-tab-picker">
      <div className="reports-modal-body">
        <ul className="reports-tab-picker__list" role="listbox" aria-activedescendant={activeTabId || undefined}>
          {categories.map(c => (
            <li key={c} className={`reports-tab-picker__item${c === activeTabId ? ' is-active' : ''}`}>
              <button
                type="button"
                role="option"
                aria-selected={c === activeTabId}
                onClick={() => { onSelect(c); onClose(); }}
              >
                {c}
              </button>
              {canManage && (
                <button 
                  type="button" 
                  className="reports-tab-picker__delete" 
                  onClick={() => onDeleteCategory(c)} 
                  aria-label={`Delete ${c}`}
                >
                  <i className="bi bi-trash" aria-hidden="true"></i>
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
