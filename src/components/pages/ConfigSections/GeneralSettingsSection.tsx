import React from "react";
import { Config } from "./types";
import { handleInputChange } from "./form-handlers";

interface GeneralSettingsSectionProps {
  config: Config;
  setConfig: React.Dispatch<React.SetStateAction<Config>>;
}

export function GeneralSettingsSection({ config, setConfig }: GeneralSettingsSectionProps) {
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
            onChange={(e) => handleInputChange(e, config, setConfig)}
            className="border border-border rounded-md px-4 py-2 w-full bg-background text-foreground"
          />
        </div>

        <div className="mb-4">
          <input
            type="text"
            name="logLevel"
            placeholder="Log level (info, debug, error)"
            value={config.logLevel}
            onChange={(e) => handleInputChange(e, config, setConfig)}
            className="border border-border rounded-md px-4 py-2 w-full bg-background text-foreground"
          />
        </div>

        <div className="mb-4">
          <input
            type="number"
            name="maxConcurrentModels"
            placeholder="Maximum concurrent models"
            value={config.maxConcurrentModels}
            onChange={(e) => handleInputChange(e, config, setConfig)}
            className="border border-border rounded-md px-4 py-2 w-full bg-background text-foreground"
          />
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="autoUpdate"
              checked={config.autoUpdate}
              onChange={(e) => handleInputChange(e, config, setConfig)}
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
              onChange={(e) => handleInputChange(e, config, setConfig)}
              className="mr-2"
            />
            <span className="text-foreground">Notifications Enabled</span>
          </div>
        </div>
      </form>
    </div>
  );
}
