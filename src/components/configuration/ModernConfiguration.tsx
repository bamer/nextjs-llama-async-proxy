'use client';

import { Box, LinearProgress, Typography } from "@mui/material";
import { useConfigurationForm } from "./hooks/useConfigurationForm";
import { ConfigurationHeader } from "./ConfigurationHeader";
import { ConfigurationTabs } from "./ConfigurationTabs";
import { ConfigurationStatusMessages } from "./ConfigurationStatusMessages";
import { GeneralSettingsTab } from "./GeneralSettingsTab";
import { LlamaServerSettingsTab } from "./LlamaServerSettingsTab";
import { AdvancedSettingsTab } from "./AdvancedSettingsTab";
import { LoggerSettingsTab } from "./LoggerSettingsTab";
import { ConfigurationActions } from "./ConfigurationActions";

export default function ModernConfiguration() {
  const {
    config,
    loading,
    activeTab,
    formConfig,
    validationErrors,
    isSaving,
    saveSuccess,
    handleTabChange,
    handleInputChange,
    handleLlamaServerChange,
    handleSave,
    handleReset,
    handleSync,
  } = useConfigurationForm();

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Loading Configuration...
        </Typography>
        <LinearProgress />
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

      {/* Tab Content */}
      {activeTab === 0 && (
        <GeneralSettingsTab
          formConfig={formConfig}
          onInputChange={handleInputChange}
        />
      )}

      {activeTab === 1 && (
        <LlamaServerSettingsTab
          formConfig={formConfig}
          onLlamaServerChange={handleLlamaServerChange}
        />
      )}

      {activeTab === 2 && (
        <AdvancedSettingsTab
          isSaving={isSaving}
          onReset={handleReset}
          onSync={handleSync}
        />
      )}

      {activeTab === 3 && <LoggerSettingsTab />}

      <ConfigurationActions isSaving={isSaving} onSave={handleSave} />
    </Box>
  );
}
