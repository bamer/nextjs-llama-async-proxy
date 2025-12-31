"use client";

import React, { Suspense } from "react";
import { Box, Typography } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import { GeneralSettingsTab } from "@/components/configuration/GeneralSettingsTab";
import { LlamaServerSettingsTab } from "@/components/configuration/LlamaServerSettingsTab";
import { AdvancedSettingsTab } from "@/components/configuration/AdvancedSettingsTab";
import { LoggerSettingsTab } from "@/components/configuration/LoggerSettingsTab";
import { useTheme } from "@/contexts/ThemeContext";

export type TabType = "general" | "llamaServer" | "advanced" | "logger";

interface ConfigurationTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  formConfig: any;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLlamaServerChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
  onSync: () => void;
  isSaving: boolean;
  fieldErrors: Record<string, string>;
}

export function ConfigurationTabs({
  activeTab,
  onTabChange,
  formConfig,
  onInputChange,
  onLlamaServerChange,
  onReset,
  onSync,
  isSaving,
  fieldErrors,
}: ConfigurationTabsProps): React.ReactNode {
  const { isDark } = useTheme();

  const tabs = [
    { id: "general" as TabType, label: "General", icon: "⚙️" },
    { id: "llamaServer" as TabType, label: "Llama Server", icon: "🖥️" },
    { id: "advanced" as TabType, label: "Advanced", icon: "🔧" },
    { id: "logger" as TabType, label: "Logger", icon: "📝" },
  ];

  return (
    <Box>
      {/* Tab Navigation */}
      <Box
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          mb: 3,
        }}
      >
        <Box
          sx={{
            display: "flex",
            gap: 2,
          }}
        >
          {tabs.map((tab) => (
            <Box
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              sx={{
                py: 2,
                px: 3,
                cursor: "pointer",
                borderBottom: activeTab === tab.id ? 2 : 0,
                borderColor: activeTab === tab.id ? "primary.main" : "transparent",
                color:
                  activeTab === tab.id
                    ? "primary.main"
                    : isDark
                      ? "text.secondary"
                      : "text.primary",
                fontWeight: activeTab === tab.id ? 600 : 400,
                transition: "all 0.2s",
                "&:hover": {
                  color: "primary.main",
                  borderColor: "primary.main",
                },
              }}
            >
              <Typography variant="body2" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <span>{tab.icon}</span>
                {tab.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Tab Content with Suspense */}
      <Suspense
        fallback={
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        }
      >
        {activeTab === "general" && (
          <GeneralSettingsTab
            formConfig={formConfig}
            onInputChange={onInputChange}
            fieldErrors={fieldErrors}
          />
        )}
        {activeTab === "llamaServer" && (
          <LlamaServerSettingsTab
            formConfig={formConfig}
            onLlamaServerChange={onLlamaServerChange}
            fieldErrors={fieldErrors}
          />
        )}
        {activeTab === "advanced" && (
          <AdvancedSettingsTab isSaving={isSaving} onReset={onReset} onSync={onSync} />
        )}
        {activeTab === "logger" && <LoggerSettingsTab fieldErrors={fieldErrors} />}
      </Suspense>
    </Box>
  );
}
