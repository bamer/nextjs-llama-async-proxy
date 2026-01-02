'use client';

import React, { useState } from 'react';
import { ConfigToolbar } from './ConfigToolbar';
import { ConfigSections } from './ConfigSections';
import { ConfigPanel } from './ConfigPanel';

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

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');

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
        setSaveMessage('Failed to save configuration');
      }
    } catch (error) {
      setSaveMessage('Failed to save configuration');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-foreground">Configuration</h1>

      <ConfigToolbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <ConfigSections activeTab={activeTab} config={config} setConfig={setConfig} />

      <ConfigPanel isSaving={isSaving} saveMessage={saveMessage} handleSave={handleSave} />
    </div>
  );
};

export default ConfigurationPage;
