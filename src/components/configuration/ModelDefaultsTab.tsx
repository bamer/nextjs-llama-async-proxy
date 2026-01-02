'use client';

import React from 'react';
import { ModelDefaults } from '@/hooks/use-configuration-page';

interface ModelDefaultsTabProps {
  modelDefaults: ModelDefaults;
  handleModelDefaultsChange: (field: keyof ModelDefaults, value: number) => void;
  handleSave: () => void;
  isSaving: boolean;
  saveMessage: string;
}

const ModelDefaultsTab: React.FC<ModelDefaultsTabProps> = ({
  modelDefaults,
  handleModelDefaultsChange,
  handleSave,
  isSaving,
  saveMessage
}) => {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6 text-foreground">Model Default Parameters</h2>
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">Context Size</label>
            <input
              type="number"
              value={modelDefaults.ctx_size}
              onChange={(e) => handleModelDefaultsChange('ctx_size', parseInt(e.target.value) || 4096)}
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
              value={modelDefaults.batch_size}
              onChange={(e) => handleModelDefaultsChange('batch_size', parseInt(e.target.value) || 2048)}
              className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground"
              min="1"
            />
            <p className="text-xs text-muted-foreground mt-1">Logical batch size</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">Temperature</label>
            <input
              type="number"
              value={modelDefaults.temperature}
              onChange={(e) => handleModelDefaultsChange('temperature', parseFloat(e.target.value) || 0.8)}
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
              value={modelDefaults.top_p}
              onChange={(e) => handleModelDefaultsChange('top_p', parseFloat(e.target.value) || 0.9)}
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
              value={modelDefaults.top_k}
              onChange={(e) => handleModelDefaultsChange('top_k', parseInt(e.target.value) || 40)}
              className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground"
              min="0"
            />
            <p className="text-xs text-muted-foreground mt-1">Top-K sampling</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">GPU Layers</label>
            <input
              type="number"
              value={modelDefaults.gpu_layers}
              onChange={(e) => handleModelDefaultsChange('gpu_layers', parseInt(e.target.value) || -1)}
              className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground"
            />
            <p className="text-xs text-muted-foreground mt-1">Layers on GPU (-1 = all)</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">CPU Threads</label>
            <input
              type="number"
              value={modelDefaults.threads}
              onChange={(e) => handleModelDefaultsChange('threads', parseInt(e.target.value) || -1)}
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

          {saveMessage && (
            <div className={`mt-4 p-3 rounded-md ${saveMessage.includes('successfully') ? 'bg-success text-white border border-success' : 'bg-warning text-white border border-warning'}`}>
              {saveMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModelDefaultsTab;