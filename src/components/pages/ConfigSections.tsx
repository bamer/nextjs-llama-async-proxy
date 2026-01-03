"use client";

import React from "react";
import { ConfigSections as ConfigSectionsInner } from "./ConfigSections";
import type { Config, TabType } from "./ConfigSections/types";

interface ConfigSectionsProps {
  activeTab: TabType;
  config: Config;
  setConfig: React.Dispatch<React.SetStateAction<Config>>;
}

export function ConfigSections(props: ConfigSectionsProps) {
  return <ConfigSectionsInner {...props} />;
}

export type { Config, ModelDefaults, TabType } from "./ConfigSections/types";
