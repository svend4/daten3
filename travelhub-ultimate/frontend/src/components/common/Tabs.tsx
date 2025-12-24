import React, { memo, useState, useCallback, useId, ReactNode } from 'react';

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  defaultActiveTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
}

/**
 * Accessible Tabs component with keyboard navigation.
 * Follows WAI-ARIA tabs pattern.
 */
const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultActiveTab,
  onChange,
  className = '',
}) => {
  const uniqueId = useId();
  const [activeTab, setActiveTab] = useState<string>(defaultActiveTab || tabs[0]?.id || '');

  const handleTabClick = useCallback((tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, currentIndex: number) => {
    const enabledTabs = tabs.filter(tab => !tab.disabled);
    const currentEnabledIndex = enabledTabs.findIndex(tab => tab.id === tabs[currentIndex].id);

    let newIndex: number | null = null;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        newIndex = currentEnabledIndex > 0 ? currentEnabledIndex - 1 : enabledTabs.length - 1;
        break;
      case 'ArrowRight':
        e.preventDefault();
        newIndex = currentEnabledIndex < enabledTabs.length - 1 ? currentEnabledIndex + 1 : 0;
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = enabledTabs.length - 1;
        break;
    }

    if (newIndex !== null) {
      const newTabId = enabledTabs[newIndex].id;
      setActiveTab(newTabId);
      onChange?.(newTabId);
      // Focus the new tab
      document.getElementById(`${uniqueId}-tab-${newTabId}`)?.focus();
    }
  }, [tabs, uniqueId, onChange]);

  const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content;

  return (
    <div className={className}>
      {/* Tab list */}
      <div
        role="tablist"
        aria-label="Tabs"
        className="flex border-b border-gray-200"
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            id={`${uniqueId}-tab-${tab.id}`}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`${uniqueId}-panel-${tab.id}`}
            aria-disabled={tab.disabled}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => !tab.disabled && handleTabClick(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            disabled={tab.disabled}
            className={`
              px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px
              focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
              ${activeTab === tab.id
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
              ${tab.disabled
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {tabs.map((tab) => (
        <div
          key={tab.id}
          id={`${uniqueId}-panel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`${uniqueId}-tab-${tab.id}`}
          hidden={activeTab !== tab.id}
          tabIndex={0}
          className="py-4 focus:outline-none"
        >
          {activeTab === tab.id && activeTabContent}
        </div>
      ))}
    </div>
  );
};

export default memo(Tabs);
