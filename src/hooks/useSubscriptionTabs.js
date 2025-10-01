import { useState, useCallback } from 'react';

const TABS = [
  { id: 'important', label: 'Important Info' },
  { id: 'general', label: 'General Details' },
  { id: 'membership', label: 'Membership Details' },
  { id: 'company', label: 'Company Details' },
  { id: 'contact', label: 'Contact Person Details' },
  { id: 'officer', label: 'Membership License Officer' },
  { id: 'plans', label: 'Membership Plans' }
];

export function useSubscriptionTabs(defaultId = 'important') {
  const [activeTab, setActiveTab] = useState(defaultId);

  const activeLabel = TABS.find(tab => tab.id === activeTab)?.label || '';

  const handleKeyDown = useCallback((e, tabId) => {
    const currentIndex = TABS.findIndex(tab => tab.id === tabId);
    
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        setActiveTab(tabId);
        break;
        
      case 'ArrowLeft':
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : TABS.length - 1;
        const prevTab = TABS[prevIndex];
        document.getElementById(`tab-${prevTab.id}`)?.focus();
        break;
        
      case 'ArrowRight':
        e.preventDefault();
        const nextIndex = currentIndex < TABS.length - 1 ? currentIndex + 1 : 0;
        const nextTab = TABS[nextIndex];
        document.getElementById(`tab-${nextTab.id}`)?.focus();
        break;
        
      case 'Home':
        e.preventDefault();
        document.getElementById(`tab-${TABS[0].id}`)?.focus();
        break;
        
      case 'End':
        e.preventDefault();
        document.getElementById(`tab-${TABS[TABS.length - 1].id}`)?.focus();
        break;
    }
  }, []);

  const tabPropsFor = useCallback((tabId) => ({
    id: `tab-${tabId}`,
    role: 'tab',
    'aria-selected': activeTab === tabId,
    'aria-controls': `panel-${tabId}`,
    onClick: () => setActiveTab(tabId),
    onKeyDown: (e) => handleKeyDown(e, tabId)
  }), [activeTab, handleKeyDown]);

  const panelPropsFor = useCallback((tabId) => ({
    id: `panel-${tabId}`,
    role: 'tabpanel',
    'aria-labelledby': `tab-${tabId}`
  }), []);

  return {
    tabs: TABS,
    activeTab,
    activeLabel,
    setActiveTab,
    tabPropsFor,
    panelPropsFor
  };
}
