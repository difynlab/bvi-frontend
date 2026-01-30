import React from 'react'

export default function EventTabPicker({ 
  open, 
  onClose, 
  categories, 
  activeTabId, 
  onSelect, 
  canManage, 
  onAddCategory, 
  onDeleteCategory,
  onEditCategory 
}) {
  if (!open) return null

  return (
    <div className="notices-tab-picker">
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
                  className="notices-tab-picker__edit" 
                  onClick={() => onEditCategory(c.id)} 
                  aria-label={`Edit ${c.name}`}
                >
                  <i className="bi bi-pencil-square" aria-hidden="true"></i>
                </button>
              )}
              {canManage && (
                <button 
                  type="button" 
                  className="notices-tab-picker__delete" 
                  onClick={() => onDeleteCategory(c.id)} 
                  aria-label={`Delete ${c.name}`}
                >
                  <i className="bi bi-x-lg" aria-hidden="true"></i>
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
