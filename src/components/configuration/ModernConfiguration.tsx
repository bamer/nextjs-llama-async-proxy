'use client';

import { Box, LinearProgress, Typography } from "@mui/material";
import { useState } from "react";
import { useConfigurationForm } from "./hooks/useConfigurationForm";
import { ConfigurationHeader } from "./ConfigurationHeader";
import { ConfigurationTabs } from "./ConfigurationTabs";
import { ConfigurationStatusMessages } from "./ConfigurationStatusMessages";
import { GeneralSettingsTab } from "./GeneralSettingsTab";
import { LlamaServerSettingsTab } from "./LlamaServerSettingsTab";
import { AdvancedSettingsTab } from "./AdvancedSettingsTab";
import { LoggerSettingsTab } from "./LoggerSettingsTab";
import { ConfigurationActions } from "./ConfigurationActions";
import { SkeletonSettingsForm } from "@/components/ui";
import { AdvancedSettingsToggle } from "./AdvancedSettingsToggle";
import { ConfigurationSection } from "./ConfigurationSection";

export default function ModernConfiguration() {
  const {
    config,
    loading,
    activeTab,
    formConfig,
    validationErrors,
    fieldErrors,
    isSaving,
    saveSuccess,
    handleTabChange,
    handleInputChange,
    handleLlamaServerChange,
    handleSave,
    handleReset,
    handleSync,
  } = useConfigurationForm();

  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  if (loading) {
    return (
      <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
        <SkeletonSettingsForm fields={8} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <ConfigurationHeader />

      <ConfigurationTabs activeTab={activeTab} onChange={handleTabChange} />

      <ConfigurationStatusMessages
        saveSuccess={saveSuccess}
        validationErrors={validationErrors}
      />

      {/* Advanced Settings Toggle - Progressive Disclosure */}
      <AdvancedSettingsToggle
        onToggle={setShowAdvancedSettings}
        initialShowAdvanced={showAdvancedSettings}
      />

      {/* Tab Content with Progressive Disclosure */}
      <Box sx={{ mb: 4 }}>
        {activeTab === 0 && (
          <ConfigurationSection
            title="General Settings"
            level="basic"
            description="Basic application configuration"
          >
            <GeneralSettingsTab
              formConfig={formConfig}
              onInputChange={handleInputChange}
              fieldErrors={fieldErrors.general}
            />
          </ConfigurationSection>
        )}

        {activeTab === 1 && (
          <>
            <ConfigurationSection
              title="Basic Server Settings"
              level="basic"
              description="Essential llama-server configuration"
            >
              <LlamaServerSettingsTab
                formConfig={formConfig}
                onLlamaServerChange={handleLlamaServerChange}
                fieldErrors={fieldErrors.llamaServer}
                showAdvanced={showAdvancedSettings}
              />
            </ConfigurationSection>

            {showAdvancedSettings && (
              <ConfigurationSection
                title="Advanced Server Configuration"
                level="advanced"
                description="Advanced settings for experienced users"
              >
                <Typography variant="body2" color="warning.dark" sx={{ mb: 2, fontStyle: 'italic' }}>
                  These settings require deep understanding of the system.
                </Typography>
                {/* Advanced settings would go here */}
              </ConfigurationSection>
            )}
          </>
        )}

        {activeTab === 2 && (
          <ConfigurationSection
            title="System Configuration"
            level="expert"
            description="Advanced system-level settings"
          >
            <AdvancedSettingsTab
              isSaving={isSaving}
              onReset={handleReset}
              onSync={handleSync}
            />
          </ConfigurationSection>
        )}

        {activeTab === 3 && (
          <ConfigurationSection
            title="Logging Configuration"
            level="basic"
            description="Configure application logging"
          >
            <LoggerSettingsTab />
          </ConfigurationSection>
        )}
      </Box>

      <ConfigurationActions isSaving={isSaving} onSave={handleSave} />
    </Box>
  );
}
