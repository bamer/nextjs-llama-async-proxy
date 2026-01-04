/**
 * Shared test utilities for ModernConfiguration tests
 */

import React from "react";

export const mockHandleTabChange = jest.fn();
export const mockHandleInputChange = jest.fn();
export const mockHandleLlamaServerChange = jest.fn();
export const mockHandleSave = jest.fn();
export const mockHandleReset = jest.fn();
export const mockHandleSync = jest.fn();

export function createDefaultHookValue() {
  return {
    config: {},
    loading: false,
    activeTab: 0,
    formConfig: {},
    validationErrors: null,
    fieldErrors: {
      general: {},
      llamaServer: {},
    },
    isSaving: false,
    saveSuccess: false,
    handleTabChange: mockHandleTabChange,
    handleInputChange: mockHandleInputChange,
    handleLlamaServerChange: mockHandleLlamaServerChange,
    handleSave: mockHandleSave,
    handleReset: mockHandleReset,
    handleSync: mockHandleSync,
  };
}

export function getModernConfiguration() {
  return require("@/components/configuration/ModernConfiguration").default;
}
