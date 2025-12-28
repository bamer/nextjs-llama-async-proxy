'use client';

import React, { useState } from 'react';

interface Config {
  basePath: string;
  logLevel: string;
  maxConcurrentModels: number;
  autoUpdate: boolean;
  notificationsEnabled: boolean;
  modelDefaults: ModelDefaults;
}

interface ModelDefaults {
  ctx_size: number;
  batch_size: number;
  temperature: number;
  top_p: number;
  top_k: number;
  gpu_layers: number;
  threads: number;
}

type TabType = 'general' | 'modelDefaults';

const ConfigurationPage = () => {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [config, setConfig] = useState<Config>({
    basePath: '/home/user/models',
    logLevel: 'info',
    maxConcurrentModels: 5,
    autoUpdate: true,
    notificationsEnabled: true,
    modelDefaults: {
      ctx_size: 4096,
      batch_size: 2048,
      temperature: 0.8,
      top_p: 0.9,
      top_k: 40,
      gpu_layers: -1,
      threads: -1
    }
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) : value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');

    try {
      // Save to localStorage using batch storage (normal priority)
      batchSetItem('app-config', JSON.stringify(config));

      // Also try to save to API if available
      try {
        const response = await fetch('/api/config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(config),
        });

        if (response.ok) {
          setSaveMessage('Configuration saved successfully!');
        } else {
          setSaveMessage('Configuration saved locally (API unavailable)');
        }
      } catch (apiError) {
        setSaveMessage('Configuration saved locally (API unavailable)');
      }
    } catch (error) {
      setSaveMessage('Failed to save configuration');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const tabs = [
    { id: 'general' as TabType, label: 'General Settings', icon: '⚙️' },
    { id: 'modelDefaults' as TabType, label: 'Model Default Parameters', icon: '🤖' }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-foreground">Configuration</h1>

      {/* Tabs */}
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

      {/* Tab Content */}
      {activeTab === 'general' && (
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6 text-foreground">General Settings</h2>
        <form>
          <div className="mb-4">
            <input
              type="text"
              name="basePath"
              placeholder="Base path for models"
              value={config.basePath}
              onChange={handleInputChange}
              className="border border-border rounded-md px-4 py-2 w-full bg-background text-foreground"
            />
          </div>

          <div className="mb-4">
            <input
              type="text"
              name="logLevel"
              placeholder="Log level (info, debug, error)"
              value={config.logLevel}
              onChange={handleInputChange}
              className="border border-border rounded-md px-4 py-2 w-full bg-background text-foreground"
            />
          </div>

          <div className="mb-4">
            <input
              type="number"
              name="maxConcurrentModels"
              placeholder="Maximum concurrent models"
              value={config.maxConcurrentModels}
              onChange={handleInputChange}
              className="border border-border rounded-md px-4 py-2 w-full bg-background text-foreground"
            />
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="autoUpdate"
                checked={config.autoUpdate}
                onChange={handleInputChange}
                className="mr-2"
              />
              <span className="text-foreground">Auto Update</span>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="notificationsEnabled"
                checked={config.notificationsEnabled}
                onChange={handleInputChange}
                className="mr-2"
              />
              <span className="text-foreground">Notifications Enabled</span>
            </div>
          </div>
          
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-primary text-primary-foreground hover:bg-primary/80 disabled:opacity-50 px-4 py-2 rounded-md transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>

          {saveMessage && (
            <div className={`mt-4 p-3 rounded-md ${saveMessage.includes('successfully') ? 'bg-success text-white border border-success' : 'bg-warning text-white border border-warning'}`}>
              {saveMessage}
            </div>
          )}
        </form>
        </div>
      )}

      {/* Model Defaults Tab */}
      {activeTab === 'modelDefaults' && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-6 text-foreground">Model Default Parameters</h2>
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Context Size</label>
                <input
                  type="number"
                  value={config.modelDefaults.ctx_size}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    modelDefaults: { ...prev.modelDefaults, ctx_size: parseInt(e.target.value) || 4096 }
                  }))}
                  className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground"
                  min="128"
                  max="2000000"
                />
                <p className="text-xs text-muted-foreground mt-1">Maximum tokens in context</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Batch Size</label>
                <input
                  type="number"
                  value={config.modelDefaults.batch_size}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    modelDefaults: { ...prev.modelDefaults, batch_size: parseInt(e.target.value) || 2048 }
                  }))}
                  className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground"
                  min="1"
                />
                <p className="text-xs text-muted-foreground mt-1">Logical batch size</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Temperature</label>
                <input
                  type="number"
                  value={config.modelDefaults.temperature}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    modelDefaults: { ...prev.modelDefaults, temperature: parseFloat(e.target.value) || 0.8 }
                  }))}
                  className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground"
                  min="0"
                  max="2"
                  step="0.1"
                />
                <p className="text-xs text-muted-foreground mt-1">Sampling temperature</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Top P</label>
                <input
                  type="number"
                  value={config.modelDefaults.top_p}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    modelDefaults: { ...prev.modelDefaults, top_p: parseFloat(e.target.value) || 0.9 }
                  }))}
                  className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground"
                  min="0"
                  max="1"
                  step="0.05"
                />
                <p className="text-xs text-muted-foreground mt-1">Nucleus sampling</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Top K</label>
                <input
                  type="number"
                  value={config.modelDefaults.top_k}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    modelDefaults: { ...prev.modelDefaults, top_k: parseInt(e.target.value) || 40 }
                  }))}
                  className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground"
                  min="0"
                />
                <p className="text-xs text-muted-foreground mt-1">Top-K sampling</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">GPU Layers</label>
                <input
                  type="number"
                  value={config.modelDefaults.gpu_layers}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    modelDefaults: { ...prev.modelDefaults, gpu_layers: parseInt(e.target.value) || -1 }
                  }))}
                  className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground"
                />
                <p className="text-xs text-muted-foreground mt-1">Layers on GPU (-1 = all)</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">CPU Threads</label>
                <input
                  type="number"
                  value={config.modelDefaults.threads}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    modelDefaults: { ...prev.modelDefaults, threads: parseInt(e.target.value) || -1 }
                  }))}
                  className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground"
                />
                <p className="text-xs text-muted-foreground mt-1">CPU threads (-1 = auto)</p>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-primary text-primary-foreground hover:bg-primary/80 disabled:opacity-50 px-6 py-2 rounded-md transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save Model Defaults'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfigurationPage;