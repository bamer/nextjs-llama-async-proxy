'use client';

import { useState } from 'react';

export interface Config {
  basePath: string;
  logLevel: string;
  maxConcurrentModels: number;
  autoUpdate: boolean;
  notificationsEnabled: boolean;
  modelDefaults: ModelDefaults;
}

export interface ModelDefaults {
  ctx_size: number;
  batch_size: number;
  temperature: number;
  top_p: number;
  top_k: number;
  gpu_layers: number;
  threads: number;
}

export type TabType = 'general' | 'modelDefaults';

export const useConfigurationPage = () => {
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

  const handleModelDefaultsChange = (field: keyof ModelDefaults, value: number) => {
    setConfig(prev => ({
      ...prev,
      modelDefaults: { ...prev.modelDefaults, [field]: value }
    }));
  };

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

  return {
    activeTab,
    setActiveTab,
    config,
    setConfig,
    isSaving,
    saveMessage,
    handleInputChange,
    handleModelDefaultsChange,
    handleSave
  };
};