"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Divider,
} from "@mui/material";
import { memo } from "react";
import { useTheme } from "@mui/material/styles";
import type { ModelConfigDialogProps } from "./types";
import { sectionGroups } from "./config-data";
import { useModelConfigForm } from "./useModelConfigForm";
import { ConfigSection } from "./ConfigSection";
import { ResetConfirmationDialog } from "./ResetConfirmationDialog";
import { NotificationSnackbar } from "./NotificationSnackbar";
import { DialogTitleSection } from "./DialogTitleSection";
import { DialogActionButtons } from "./DialogActionButtons";

// Re-export types for external use
export type { ConfigType, ModelConfigDialogProps } from "./types";

const ModelConfigDialogComponent = function ModelConfigDialog({
  open,
  modelId,
  configType,
  config,
  onClose,
  onSave,
}: ModelConfigDialogProps) {
  const theme = useTheme();
  const {
    formState: { editedConfig, hasChanges, sliderMode, errors, isSaving, showResetDialog, notification, expandedSections },
    actions: { handleFieldChange, toggleSliderMode, toggleSection, handleReset, confirmReset, handleSave: handleSaveInternal, closeNotification, setShowResetDialog },
  } = useModelConfigForm(open, configType, config);

  const handleSave = async () => {
    await handleSaveInternal(async (config) => {
      onSave(config);
    });
  };

  if (!configType) {
    return null;
  }

  const configTitle = configType.charAt(0).toUpperCase() + configType.slice(1);
  const isValid = Object.keys(errors).length === 0;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: theme.shadows[10],
            maxHeight: "90vh",
          },
        }}
      >
        <DialogTitle
          sx={{
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            pb: 2,
          }}
        >
          <DialogTitleSection
            configTitle={configTitle}
            modelId={modelId}
            hasChanges={hasChanges}
          />
        </DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          <Box>
            {sectionGroups[configType].map((section) => (
              <ConfigSection
                key={section.title}
                section={section}
                configType={configType}
                editedConfig={editedConfig}
                errors={errors}
                sliderMode={sliderMode}
                isExpanded={expandedSections[section.title] !== false}
                onToggle={() => toggleSection(section.title)}
                onFieldChange={handleFieldChange}
                onToggleSlider={toggleSliderMode}
              />
            ))}
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <DialogActionButtons
            onReset={handleReset}
            onClose={onClose}
            onSave={handleSave}
            hasChanges={hasChanges}
            isValid={isValid}
            isSaving={isSaving}
          />
        </DialogActions>
      </Dialog>

      <ResetConfirmationDialog
        open={showResetDialog}
        configType={configType}
        onConfirm={confirmReset}
        onClose={() => setShowResetDialog(false)}
      />

      <NotificationSnackbar
        open={notification.open}
        message={notification.message}
        severity={notification.severity}
        onClose={closeNotification}
      />
    </>
  );
};

// Memoize the entire component to prevent unnecessary re-renders and re-export sectionGroups for ModelsPage sidebar
export default memo(ModelConfigDialogComponent);
export { sectionGroups };
