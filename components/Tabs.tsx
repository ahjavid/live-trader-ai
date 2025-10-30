import React from 'react';

type Tab = 'dashboard' | 'history' | 'performance';

interface TabsProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const Tabs: React.FC<TabsProps> = ({ activeTab, setActiveTab }) => {
  const tabs: { id: Tab; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'history', label: 'Trade History' },
    { id: 'performance', label: 'Performance' },
  ];

  return (
    <div className="mt-8 border-b border-brand-secondary">
      <nav className="-mb-px flex space-x-6" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
              ${
                activeTab === tab.id
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-brand-text-secondary hover:text-brand-text hover:border-gray-500'
              }
            `}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Tabs;