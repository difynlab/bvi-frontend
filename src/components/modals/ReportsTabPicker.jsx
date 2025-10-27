import React from 'react'

export default function ReportsTabPicker({ 
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
    <div className="reports-tab-picker">
      <div className="reports-modal-body">
        <ul className="reports-tab-picker__list" role="listbox" aria-activedescendant={activeTabId || undefined}>
          {categories.map(c => (
            <li key={c.id} className={`reports-tab-picker__item${c.id === activeTabId ? ' is-active' : ''}`}>
              <button
                type="button"
                role="option"
                aria-selected={c.id === activeTabId}
                onClick={() => { onSelect(c.id); onClose(); }}
              >
                {c.title}
              </button>
              {canManage && (
                <button 
                  type="button" 
                  className="reports-tab-picker__edit" 
                  onClick={() => onEditCategory(c.id)} 
                  aria-label={`Edit ${c.title}`}
                >
                  <i className="bi bi-pencil-square" aria-hidden="true"></i>
                </button>
              )}
              {canManage && (
                <button 
                  type="button" 
                  className="reports-tab-picker__delete" 
                  onClick={() => onDeleteCategory(c.id)} 
                  aria-label={`Delete ${c.title}`}
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
