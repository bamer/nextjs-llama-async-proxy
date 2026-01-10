# Preset UI Implementation Guide - Phase 1 (Core MVP)

## Overview

This guide provides step-by-step implementation details for Phase 1 of the preset UI, focusing on making all basic CRUD operations work.

## Step 1: Fix Global Defaults Save Handler

### Problem

Current `handleSaveDefaults()` only closes the modal without saving.

### Solution

```javascript
// In presets.js, PresetsPage class

async handleSaveDefaults() {
  console.log("[DEBUG] Saving global defaults");

  try {
    const { globalDefaults } = this.state;

    // Validate required fields
    if (!globalDefaults) {
      showNotification("No defaults to save", "error");
      this.setState({ showGlobalModal: false });
      return;
    }

    // Map camelCase to INI format
    const config = {
      ctxSize: globalDefaults.ctxSize,
      temperature: globalDefaults.temperature,
      nGpuLayers: globalDefaults.nGpuLayers,
      threads: globalDefaults.threads,
      batchSize: globalDefaults.batchSize,
      ubatchSize: globalDefaults.ubatchSize,
      splitMode: globalDefaults.splitMode,
      mainGpu: globalDefaults.mainGpu,
      tensorSplit: globalDefaults.tensorSplit,
      mmp: globalDefaults.mmp,
      seed: globalDefaults.seed,
      loadOnStartup: globalDefaults.loadOnStartup,
    };

    // Call backend
    await this.presetsService.updateDefaults(
      this.state.selectedPreset.name,
      config
    );

    // Refresh data
    await this.loadPresetData(this.state.selectedPreset);

    // Show success
    showNotification("Global defaults saved successfully", "success");

    // Close modal
    this.setState({ showGlobalModal: false });
  } catch (error) {
    console.error("[DEBUG] Failed to save defaults:", error);
    showNotification(`Failed to save: ${error.message}`, "error");
  }
}
```

## Step 2: Implement Group Save Handler

### Problem

`handleSaveGroup()` doesn't actually save to backend.

### Solution

```javascript
async handleSaveGroup() {
  console.log("[DEBUG] Saving group:", this.state.currentGroup);

  try {
    const { currentGroup, editingGroup, selectedPreset } = this.state;
    const groupName = currentGroup.groupName;

    if (!groupName || groupName.trim() === "") {
      showNotification("Group name is required", "error");
      return;
    }

    // Validate name format
    const validName = /^[a-zA-Z0-9_-]+$/.test(groupName);
    if (!validName) {
      showNotification(
        "Group name can only contain letters, numbers, hyphens, and underscores",
        "error"
      );
      return;
    }

    // Check for duplicate names (unless editing)
    const existingGroup = this.state.groups.find(
      (g) => g.name === groupName && g.name !== editingGroup
    );
    if (existingGroup) {
      showNotification(`Group "${groupName}" already exists`, "error");
      return;
    }

    // Build model path for group
    const modelPath = `group-${groupName}`;

    // Map camelCase to INI format
    const config = {
      ctxSize: currentGroup.ctxSize,
      temperature: currentGroup.temperature,
      nGpuLayers: currentGroup.nGpuLayers,
      threads: currentGroup.threads,
      batchSize: currentGroup.batchSize,
      ubatchSize: currentGroup.ubatchSize,
      splitMode: currentGroup.splitMode,
      mainGpu: currentGroup.mainGpu,
      tensorSplit: currentGroup.tensorSplit,
    };

    if (editingGroup) {
      // Update existing group
      console.log("[DEBUG] Updating group:", editingGroup, "→", groupName);

      // Delete old group
      await this.presetsService.removeModel(selectedPreset.name, editingGroup);

      // Add updated group
      await this.presetsService.addModel(
        selectedPreset.name,
        groupName,
        config
      );
    } else {
      // Create new group
      console.log("[DEBUG] Creating new group:", groupName);
      await this.presetsService.addModel(selectedPreset.name, groupName, config);
    }

    // Refresh data
    await this.loadPresetData(selectedPreset);

    // Show success
    showNotification(
      editingGroup
        ? `Group "${groupName}" updated`
        : `Group "${groupName}" created`,
      "success"
    );

    // Close modal
    this.setState({ showGroupModal: false, editingGroup: null, currentGroup: {} });
  } catch (error) {
    console.error("[DEBUG] Failed to save group:", error);
    showNotification(`Failed to save group: ${error.message}`, "error");
  }
}
```

## Step 3: Implement Group Delete Handler

### Problem

`handleDeleteGroup()` shows confirmation but doesn't delete.

### Solution

```javascript
async handleDeleteGroup(e) {
  const el = e.target.closest("[data-action=delete-group]");
  if (!el) return;

  const groupName = el.dataset.groupName;

  // Get models in this group
  const group = this.state.groups.find((g) => g.name === groupName);
  const modelCount = group?.models?.length || 0;

  // Custom confirmation message
  const message =
    modelCount > 0
      ? `Delete group "${groupName}" and all ${modelCount} models in it?`
      : `Delete group "${groupName}"?`;

  if (!confirm(message)) return;

  console.log("[DEBUG] Deleting group:", groupName);

  try {
    await this.presetsService.removeModel(this.state.selectedPreset.name, groupName);

    // Refresh data
    await this.loadPresetData(this.state.selectedPreset);

    // Show success
    showNotification(`Group "${groupName}" deleted`, "success");
  } catch (error) {
    console.error("[DEBUG] Failed to delete group:", error);
    showNotification(`Failed to delete: ${error.message}`, "error");
  }
}
```

## Step 4: Implement Model Save Handler

### Problem

`handleSaveModel()` doesn't save to backend.

### Solution

```javascript
async handleSaveModel() {
  console.log("[DEBUG] Saving model:", this.state.currentModel);

  try {
    const { currentModel, editingModel, selectedPreset } = this.state;
    const { modelName, groupName, modelPath } = currentModel;

    // Validate required fields
    if (!modelName || modelName.trim() === "") {
      showNotification("Model name is required", "error");
      return;
    }

    if (!groupName || groupName.trim() === "") {
      showNotification("Group is required", "error");
      return;
    }

    if (!modelPath || modelPath.trim() === "") {
      showNotification("Model path is required", "error");
      return;
    }

    // Build full model identifier (group-name/model-name)
    const fullModelName = `${groupName}/${modelName}`;

    // Validate no duplicate in same group
    const group = this.state.groups.find((g) => g.name === groupName);
    const existingModel = group?.models?.find(
      (m) => m.name === modelName && m.name !== editingModel
    );
    if (existingModel) {
      showNotification(`Model "${modelName}" already exists in this group`, "error");
      return;
    }

    // Map camelCase to INI format
    const config = {
      model: modelPath,
      ctxSize: currentModel.ctxSize,
      temperature: currentModel.temperature,
      nGpuLayers: currentModel.nGpuLayers,
      threads: currentModel.threads,
      batchSize: currentModel.batchSize,
      ubatchSize: currentModel.ubatchSize,
      splitMode: currentModel.splitMode,
      mainGpu: currentModel.mainGpu,
      tensorSplit: currentModel.tensorSplit,
      mmp: currentModel.mmp,
      seed: currentModel.seed,
      loadOnStartup: currentModel.loadOnStartup,
    };

    if (editingModel) {
      // Update existing model
      console.log("[DEBUG] Updating model:", editingModel, "→", fullModelName);

      // Delete old model
      const oldGroupName = this.state.currentModel.editingGroupName || groupName;
      const oldModelName = editingModel;
      await this.presetsService.removeModel(
        selectedPreset.name,
        `${oldGroupName}/${oldModelName}`
      );

      // Add updated model
      await this.presetsService.addModel(selectedPreset.name, fullModelName, config);
    } else {
      // Create new model
      console.log("[DEBUG] Creating new model:", fullModelName);
      await this.presetsService.addModel(selectedPreset.name, fullModelName, config);
    }

    // Refresh data
    await this.loadPresetData(selectedPreset);

    // Show success
    showNotification(
      editingModel
        ? `Model "${modelName}" updated`
        : `Model "${modelName}" created`,
      "success"
    );

    // Close modal
    this.setState({ showModelModal: false, editingModel: null, currentModel: {} });
  } catch (error) {
    console.error("[DEBUG] Failed to save model:", error);
    showNotification(`Failed to save: ${error.message}`, "error");
  }
}
```

## Step 5: Implement Model Delete Handler

### Problem

`handleDeleteModel()` shows confirmation but doesn't delete.

### Solution

```javascript
async handleDeleteModel(e) {
  const el = e.target.closest("[data-action=delete-model]");
  if (!el) return;

  const groupName = el.dataset.groupName;
  const modelName = el.dataset.modelName;
  const fullModelName = `${groupName}/${modelName}`;

  if (!confirm(`Delete model "${modelName}"?`)) return;

  console.log("[DEBUG] Deleting model:", fullModelName);

  try {
    await this.presetsService.removeModel(this.state.selectedPreset.name, fullModelName);

    // Refresh data
    await this.loadPresetData(this.state.selectedPreset);

    // Show success
    showNotification(`Model "${modelName}" deleted`, "success");
  } catch (error) {
    console.error("[DEBUG] Failed to delete model:", error);
    showNotification(`Failed to delete: ${error.message}`, "error");
  }
}
```

## Step 6: Add Model Path Selector

### Problem

User has to manually type model paths.

### Solution

Add a dropdown with detected models.

```javascript
// Add to PresetsPage state
this.state = {
  // ... existing state
  availableModels: [],
};

// Add to loadPresetData
async loadPresetData(preset) {
  try {
    const service = this.presetsService;
    const models = await service.getModelsFromPreset(preset.name);
    const defaults = await service.getDefaults(preset.name);

    // Fetch available models from server
    const availableModels = await this.getAvailableModels();

    // ... rest of existing code
    this.setState({
      selectedPreset: preset,
      globalDefaults: defaults,
      groups: Object.values(groups),
      availableModels,
    });
  } catch (error) {
    // ... error handling
  }
}

// New method to get available models
async getAvailableModels() {
  try {
    const response = await stateManager.request("presets:available-models", {});
    return response.data.models || [];
  } catch (error) {
    console.error("[DEBUG] Failed to get available models:", error);
    return [];
  }
}

// Update renderModelForm to include dropdown
renderModelForm() {
  const model = this.state.currentModel || {};
  const availableModels = this.state.availableModels || [];

  return Component.h(
    "div",
    { className: "form-group" },
    Component.h("label", {}, "Model Name"),
    Component.h("input", {
      type: "text",
      className: "form-input",
      value: model.name || "",
      "data-field": "modelName",
      placeholder: "e.g., qwen-7b",
    }),

    Component.h("label", {}, "Group"),
    Component.h(
      "select",
      {
        className: "form-input",
        "data-field": "groupName",
        disabled: !!model.editingGroupName, // Can't change group when editing
      },
      this.renderGroupOptions(model.groupName, model.editingGroupName)
    ),

    Component.h("label", {}, "Model Path"),
    Component.h(
      "select",
      {
        className: "form-input",
        "data-field": "modelPath",
      },
      // Option to manually enter path
      Component.h("option", { value: "" }, "Or type path manually..."),
      // Detected models
      ...availableModels.map((m) =>
        Component.h("option", { value: m.path }, `${m.name} (${m.path})`)
      )
    ),

    // ... rest of form fields
  );
}

renderGroupOptions(selectedGroup, disabled) {
  const options = [
    Component.h("option", { value: "" }, "-- Select Group --"),
    ...this.state.groups.map((g) =>
      Component.h(
        "option",
        { value: g.name, selected: g.name === selectedGroup },
        g.name
      )
    ),
  ];

  return options;
}
```

## Step 7: Add Backend Handler for Available Models

### File: server/handlers/presets.js

```javascript
// Add after existing handlers

socket.on("presets:available-models", async (data, ack) => {
  console.log("[DEBUG] Event: presets:available-models");
  try {
    // Get models directory from config or default
    const modelsDir = process.env.MODELS_DIR || path.join(process.cwd(), "models");

    // Scan for GGUF files
    const availableModels = scanModelsDirectory(modelsDir);

    const response = {
      success: true,
      data: { models: availableModels },
    };
    if (typeof ack === "function") ack(response);
  } catch (error) {
    console.error("[DEBUG] Error in presets:available-models:", error.message);
    const response = {
      success: false,
      error: { message: error.message },
    };
    if (typeof ack === "function") ack(response);
  }
});

/**
 * Scan directory for GGUF model files
 */
function scanModelsDirectory(dir) {
  try {
    if (!fs.existsSync(dir)) {
      return [];
    }

    const files = fs.readdirSync(dir);
    const ggufFiles = files.filter((f) => f.endsWith(".gguf") || f.endsWith(".GGUF"));

    return ggufFiles.map((filename) => ({
      name: filename.replace(/\.gguf$/i, ""),
      path: path.join(dir, filename),
      size: fs.statSync(path.join(dir, filename)).size,
    }));
  } catch (error) {
    console.error("[DEBUG] Failed to scan models directory:", error);
    return [];
  }
}
```

## Step 8: Add Preset Service Method

### File: public/js/services/presets.js

```javascript
/**
 * Get available models for selection
 * @returns {Promise<Array>} Array of available model objects
 */
getAvailableModels() {
  return new Promise((resolve, reject) => {
    console.log("[DEBUG] PresetsService: getAvailableModels");
    this.socket.emit("presets:available-models", {}, (response) => {
      if (response.success) {
        resolve(response.data.models);
      } else {
        reject(new Error(response.error.message));
      }
    });
  });
}
```

## Step 9: Add Basic Validation

### Problem

Users can enter invalid values.

### Solution

Add validation helper and integrate into forms.

```javascript
// Add to presets.js, PresetsPage class

/**
 * Validate parameter values
 */
validateParameters(config, type = "model") {
  const errors = [];
  const warnings = [];

  // Required fields
  if (type === "model" && !config.model) {
    errors.push("Model path is required");
  }

  if (type === "group" && !config.groupName) {
    errors.push("Group name is required");
  }

  // Numeric ranges
  if (config.ctxSize !== undefined) {
    const ctxSize = parseInt(config.ctxSize);
    if (isNaN(ctxSize) || ctxSize < 512) {
      errors.push("Context size must be at least 512");
    }
    if (ctxSize > 131072) {
      warnings.push("Context size > 131072 may cause issues");
    }
  }

  if (config.temperature !== undefined) {
    const temp = parseFloat(config.temperature);
    if (isNaN(temp) || temp < 0) {
      errors.push("Temperature must be >= 0");
    }
    if (temp > 2.0) {
      warnings.push("Temperature > 2.0 may produce random output");
    }
  }

  if (config.nGpuLayers !== undefined) {
    const layers = parseInt(config.nGpuLayers);
    if (isNaN(layers) || layers < 0) {
      errors.push("GPU layers must be >= 0");
    }
  }

  if (config.threads !== undefined) {
    const threads = parseInt(config.threads);
    if (isNaN(threads) || threads < 0) {
      errors.push("Threads must be >= 0 (0 = auto)");
    }
  }

  if (config.batchSize !== undefined) {
    const batch = parseInt(config.batchSize);
    if (isNaN(batch) || batch < 1) {
      errors.push("Batch size must be >= 1");
    }
  }

  return { errors, warnings };
}

/**
 * Show validation errors in modal
 */
showValidationInModal(errors, warnings) {
  // Remove old validation messages
  const oldMessages = document.querySelectorAll(".validation-message");
  oldMessages.forEach((m) => m.remove());

  // Add new messages
  const modalBody = document.querySelector(".modal-body");
  if (!modalBody) return;

  const container = document.createElement("div");
  container.className = "validation-messages";

  if (errors.length > 0) {
    errors.forEach((error) => {
      const msg = document.createElement("div");
      msg.className = "validation-message error";
      msg.innerHTML = `❌ ${error}`;
      container.appendChild(msg);
    });
  }

  if (warnings.length > 0) {
    warnings.forEach((warning) => {
      const msg = document.createElement("div");
      msg.className = "validation-message warning";
      msg.innerHTML = `⚠️ ${warning}`;
      container.appendChild(msg);
    });
  }

  modalBody.insertBefore(container, modalBody.firstChild);
}

// Update handlers to use validation
handleSaveDefaults() {
  const { globalDefaults } = this.state;
  const { errors, warnings } = this.validateParameters(globalDefaults, "global");

  if (errors.length > 0) {
    showValidationInModal(errors, warnings);
    return;
  }

  // ... rest of save logic
}
```

## Step 10: Add CSS for Validation Messages

### File: public/css/pages/presets.css

```css
/* Validation Messages */
.validation-messages {
  margin-bottom: 1rem;
  padding: 1rem;
  border-radius: 0.5rem;
  background: #fef2f2;
}

.validation-message {
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

.validation-message.error {
  background: #fef2f2;
  color: #dc2626;
  border-left: 3px solid #dc2626;
}

.validation-message.warning {
  background: #fffbeb;
  color: #d97706;
  border-left: 3px solid #f59e0b;
}

/* Disable Save button on errors */
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Form inputs with validation */
.form-input.invalid {
  border-color: #dc2626;
  background: #fef2f2;
}

.form-input.warning {
  border-color: #f59e0b;
  background: #fffbeb;
}

.form-input.valid {
  border-color: #10b981;
}
```

## Testing Checklist

After implementing all steps, test:

### Global Defaults

- [ ] Open "Edit Global Defaults"
- [ ] Change context size to 4096
- [ ] Click "Save"
- [ ] Verify: Modal closes, notification shows success
- [ ] Reload page, verify value persisted

### Groups

- [ ] Click "+ Add Group"
- [ ] Enter name "gpu-models"
- [ ] Set temp to 0.8
- [ ] Click "Save"
- [ ] Verify: Group appears in list with settings
- [ ] Edit the group, change ctx-size to 8192
- [ ] Save and verify changes persisted
- [ ] Delete the group with confirmation

### Models

- [ ] In a group, click "+ Add Model"
- [ ] Enter name "test-model"
- [ ] Select path from dropdown
- [ ] Set GPU layers to 35
- [ ] Save and verify model appears
- [ ] Edit model, change temperature
- [ ] Save and verify change
- [ ] Delete model with confirmation

### Validation

- [ ] Try to save without required fields → Error
- [ ] Enter negative temperature → Error
- [ ] Enter context size > 131072 → Warning
- [ ] Duplicate group name → Error

### Integration

- [ ] Create preset, edit it, verify INI file updated
- [ ] Restart llama-server with preset, verify models load
- [ ] Check browser console for debug logs
- [ ] Test on different screen sizes

## Common Issues & Solutions

### Issue: Modal doesn't close after save

**Solution**: Check that `setState({ showModal: false })` is called

### Issue: Changes don't persist

**Solution**: Verify backend `savePreset` is called and file is written

### Issue: Validation errors don't show

**Solution**: Check `showValidationInModal` is called before save

### Issue: Dropdowns don't populate

**Solution**: Verify `getAvailableModels()` is called and succeeds

### Issue: Page crashes on save

**Solution**: Check console for errors, wrap in try-catch

## Next Steps (Phase 2)

After Phase 1 MVP is complete:

1. Add inheritance visualization (color coding)
2. Expand parameter forms (all llama.cpp parameters)
3. Add "Reset to Default" buttons
4. Add "Duplicate" functionality
5. Improve empty states and onboarding
6. Add tooltips with parameter descriptions
