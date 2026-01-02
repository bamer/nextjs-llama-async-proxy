import React from "react";
import { GeneralSettingsSection } from "./GeneralSettingsSection";
import { ModelDefaultsSection } from "./ModelDefaultsSection";
import type { Config, TabType } from "./types";

interface ConfigSectionsProps {
  activeTab: TabType;
  config: Config;
  setConfig: React.Dispatch<React.SetStateAction<Config>>;
}

export function ConfigSections({ activeTab, config, setConfig }: ConfigSectionsProps) {
  if (activeTab === "general") {
    return <GeneralSettingsSection config={config} setConfig={setConfig} />;
  }

  return <ModelDefaultsSection config={config} setConfig={setConfig} />;
}
