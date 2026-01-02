import React from 'react';

interface ConfigTabs {
  id: 'general' | 'modelDefaults';
  label: string;
  icon: string;
}

interface ConfigToolbarProps {
  activeTab: 'general' | 'modelDefaults';
  setActiveTab: React.Dispatch<React.SetStateAction<'general' | 'modelDefaults'>>;
}

export function ConfigToolbar({ activeTab, setActiveTab }: ConfigToolbarProps) {
  const tabs: ConfigTabs[] = [
    { id: 'general', label: 'General Settings', icon: '⚙️' },
    { id: 'modelDefaults', label: 'Model Default Parameters', icon: '🤖' }
  ];

  return (
    <div className="mb-8">
      <div className="border-b border-border">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
