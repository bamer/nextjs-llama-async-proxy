'use client';

import React from 'react';
import { Config } from '@/hooks/use-configuration-page';

interface GeneralSettingsTabProps {
  config: Config;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSave: () => void;
  isSaving: boolean;
  saveMessage: string;
}

const GeneralSettingsTab: React.FC<GeneralSettingsTabProps> = ({
  config,
  handleInputChange,
  handleSave,
  isSaving,
  saveMessage
}) => {
  return (
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
  );
};

export default GeneralSettingsTab;