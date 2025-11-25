import React from 'react'

const TABS_ORDER = [
  "Important Info",
  "Membership Plans",
  "Membership Details", 
  "Company Details", 
  "Contact Person Details", 
  "Membership License Officer"
];

const MEMBERSHIP_DETAILS_TAB_INDEX = TABS_ORDER.indexOf('Membership Details');

export default function SubscriptionTabPicker({ 
  open, 
  onClose, 
  tabs, 
  activeTab, 
  onSelect,
  isMembershipDetailsComplete = false
}) {
  if (!open) return null

  const isTabDisabled = (tab) => {
    const tabIndex = TABS_ORDER.indexOf(tab);
    return tabIndex > MEMBERSHIP_DETAILS_TAB_INDEX && !isMembershipDetailsComplete;
  };

  return (
    <div className="subscription-tab-picker">
      <div className="subscription-modal-body">
        <ul className="subscription-tab-picker__list" role="listbox" aria-activedescendant={activeTab || undefined}>
          {tabs.map(tab => {
            const disabled = isTabDisabled(tab);
            return (
              <li key={tab} className={`subscription-tab-picker__item${tab === activeTab ? ' is-active' : ''}${disabled ? ' is-disabled' : ''}`}>
                <button
                  type="button"
                  role="option"
                  aria-selected={tab === activeTab}
                  disabled={disabled}
                  onClick={() => { 
                    if (!disabled) {
                      onSelect(tab); 
                      onClose(); 
                    }
                  }}
                  title={disabled ? 'Please complete Membership Details first' : ''}
                >
                  {tab}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  )
}
