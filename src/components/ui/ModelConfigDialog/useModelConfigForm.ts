"use client";

import { useState, useEffect } from "react";
import type { ConfigType } from "./types";
import {
  convertConfigFromDatabase,
  convertConfigForDatabase,
  validateAll,
  getDefaultConfig,
  getDefaultSliderMode,
} from "./utils";

export const useModelConfigForm = (
  open: boolean,
  configType: ConfigType | null,
  config: Record<string, unknown>
) => {
  const [editedConfig, setEditedConfig] = useState<Record<string, unknown>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [sliderMode, setSliderMode] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Initialize config when dialog opens
  useEffect(() => {
    if (open && configType && config) {
      // Convert database config to UI format (numbers -> booleans)
      const uiConfig = convertConfigFromDatabase(config);
      setEditedConfig(uiConfig);
      setHasChanges(false);
      setErrors({});
    } else if (open && configType && !config) {
      // Use default values if no config provided
      setEditedConfig(getDefaultConfig(configType));
      setSliderMode(getDefaultSliderMode(configType));
      setHasChanges(false);
      setErrors({});
    }
  }, [open, configType, config]);

  const handleFieldChange = (fieldName: string, value: unknown) => {
    setEditedConfig((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
    setHasChanges(true);

    // Clear error when field is modified
    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const toggleSliderMode = (fieldName: string) => {
    setSliderMode((prev) => ({
      ...prev,
      [fieldName]: !prev[fieldName],
    }));
  };

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle],
    }));
  };

  const handleReset = () => {
    setShowResetDialog(true);
  };

  const confirmReset = () => {
    if (!configType) return;
    setEditedConfig(getDefaultConfig(configType));
    setHasChanges(true);
    setErrors({});
    setShowResetDialog(false);
    setNotification({
      open: true,
      message: "Configuration réinitialisée aux valeurs par défaut",
      severity: "success",
    });
  };

  const handleSave = async (onSave: (config: Record<string, unknown>) => Promise<void>) => {
    // Validate all fields before saving
    const { errors: validationErrors, isValid } = validateAll(
      editedConfig,
      () => {
        // This is a placeholder - actual validation rules should be passed in
        return null;
      }
    );

    if (!isValid) {
      setErrors(validationErrors);
      setNotification({
        open: true,
        message: "Veuillez corriger les erreurs de validation avant de sauvegarder",
        severity: "error",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Convert boolean values to numbers for database compatibility
      const dbConfig = convertConfigForDatabase(editedConfig);
      await onSave(dbConfig);
      setHasChanges(false);
      setNotification({
        open: true,
        message: "Configuration sauvegardée avec succès",
        severity: "success",
      });
    } catch {
      setNotification({
        open: true,
        message: "Échec de la sauvegarde de la configuration",
        severity: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const closeNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  return {
    formState: {
      editedConfig,
      hasChanges,
      sliderMode,
      errors,
      isSaving,
      showResetDialog,
      notification,
      expandedSections,
    },
    actions: {
      handleFieldChange,
      toggleSliderMode,
      toggleSection,
      handleReset,
      confirmReset,
      handleSave,
      closeNotification,
      setShowResetDialog,
    },
  };
};
