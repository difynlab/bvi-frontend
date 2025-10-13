import React from 'react'

export default function SubscriptionTabPicker({ 
  open, 
  onClose, 
  tabs, 
  activeTab, 
  onSelect 
}) {
  if (!open) return null

  return (
    <div className="subscription-tab-picker">
      <div className="subscription-modal-body">
        <ul className="subscription-tab-picker__list" role="listbox" aria-activedescendant={activeTab || undefined}>
          {tabs.map(tab => (
            <li key={tab} className={`subscription-tab-picker__item${tab === activeTab ? ' is-active' : ''}`}>
              <button
                type="button"
                role="option"
                aria-selected={tab === activeTab}
                onClick={() => { onSelect(tab); onClose(); }}
              >
                {tab}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
