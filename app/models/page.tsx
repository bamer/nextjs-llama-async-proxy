"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Box } from "@mui/material";
import { useTheme } from "@/contexts/ThemeContext";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { ModelsFallback } from "@/components/ui/error-fallbacks";
import ModelConfigSidebar from "@/components/ui/ModelConfigSidebar";
import { useModels } from "./hooks/use-models";
import { useModelConfig } from "./hooks/use-model-config";
import { useModelActions } from "./hooks/use-model-actions";
import { ModelsGrid } from "./components/ModelsGrid";
import { ModelsHeader } from "./components/ModelsHeader";
import { EmptyState } from "./components/EmptyState";
import { ModelSkeletonLoader } from "./components/ModelSkeletonLoader";
import { ModelActionsMenu } from "./components/ModelActionsMenu";
import { ConfigDisplay } from "./components/ConfigDisplay";
import { ErrorMessage } from "./components/ErrorMessage";

export default function ModelsPage() {
  const { isDark } = useTheme();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const {
    configSidebarOpen,
    setConfigSidebarOpen,
    editingConfigType,
    setEditingConfigType,
    editedConfig,
    selectedModel,
    notification,
    handleConfigure,
    handleSaveConfig,
    handleFieldChange,
    handleReset,
    handleDismissNotification,
    handleConfigSaved,
    handleConfigLoaded,
  } = useModelConfig();

  const {
    models,
    loading,
    error,
    setLoading,
    setError,
    handleStartModel,
    handleStopModel,
    handleSaveModel,
    handleDeleteModel,
    requestModels,
    sendMessage,
  } = useModels({
    onConfigSaved: handleConfigSaved,
    onConfigLoaded: handleConfigLoaded,
  });

  const {
    analyzingModelId,
    anchorEl,
    handleAnalyze,
    handleMenuClick,
    handleMenuClose,
    handleDeleteClick: handleDeleteClickWithCallback,
  } = useModelActions({ setError });

  useEffect(() => {
    requestModels();
    setTimeout(() => setIsInitialLoading(false), 1000);
  }, [requestModels]);

  const handleRefresh = () => {
    setRefreshing(true);
    sendMessage("rescanModels", {});
    setTimeout(() => setRefreshing(false), 1500);
  };

  const handleDeleteClick = () => {
    handleDeleteClickWithCallback(handleDeleteModel);
  };

  const handleAddModel = () => {
    console.log("Add new model - feature coming soon");
  };

  if (isInitialLoading && models.length === 0) {
    return <ModelSkeletonLoader />;
  }

  return (
    <MainLayout>
      <ErrorBoundary fallback={<ModelsFallback />}>
        <Box sx={{ p: 4 }}>
          {error && <ErrorMessage message={error} isDark={isDark} />}

          <ModelsHeader
            isDark={isDark}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            onAddModel={handleAddModel}
          />

          <ModelsGrid
            models={models}
            isDark={isDark}
            loading={loading}
            analyzingModelId={analyzingModelId}
            onMenuClick={handleMenuClick}
            onConfigure={handleConfigure}
            onStart={handleStartModel}
            onStop={handleStopModel}
            onAnalyze={handleAnalyze}
          />

          <ModelActionsMenu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            onDelete={handleDeleteClick}
          />

          <ModelConfigSidebar
            open={configSidebarOpen}
            onClose={() => setConfigSidebarOpen(false)}
            modelId={selectedModel?.id}
            configType={editingConfigType as "sampling" | "memory" | "gpu" | "advanced" | "lora" | "multimodal" | null}
            config={editedConfig}
            onSave={handleSaveConfig}
            editedConfig={editedConfig}
            onFieldChange={handleFieldChange}
            hasChanges={false}
            isSaving={loading !== null}
            error={error}
            notification={
              notification.open
                ? {
                    open: notification.open,
                    message: notification.message,
                    severity: notification.severity,
                  }
                : { open: false, message: "", severity: "error" }
            }
            onDismissNotification={handleDismissNotification}
            onReset={handleReset}
          >
            <ConfigDisplay
              isDark={isDark}
              editingConfigType={editingConfigType}
              editedConfig={editedConfig}
              setEditingConfigType={setEditingConfigType}
            />
          </ModelConfigSidebar>

          {models.length === 0 && <EmptyState isDark={isDark} onAddModel={handleAddModel} />}
        </Box>
      </ErrorBoundary>
    </MainLayout>
  );
}
