# Presets Logic Fix - Group Model Management

## Problem
The previous preset UI allowed editing individual model parameters within a group. This violated the design principle that:
- **Group models should inherit all parameters from the group**
- **Individual model parameter customization should only happen in Standalone section**

## Solution

### 1. **Removed Individual Model Rendering from Groups**
- Groups no longer expand to show individual models with their parameters
- Instead, groups show a **compact list** of model names

### 2. **New Group UI Structure**
When a group is expanded, users see:

1. **Model List Section** ("Applies to")
   - Compact list of model names
   - Each model has a remove button (×)
   - "Add Model" button to add new models
   - Clear, simple interface

2. **Group Parameters Section** 
   - Shows all group parameters
   - Editable (click to edit)
   - All models in the group inherit these

### 3. **Standalone Models Section**
- Only place where individual model parameters can be edited
- Models here are NOT part of any group
- Users can customize each parameter independently

## Code Changes

### `renderGroupSection()` - Redesigned
- **Removed** rendering of individual model sections inside groups
- **Added** compact models list with just names and remove buttons
- **Separated** group parameters section for clarity
- Models list and parameters are now clearly distinct sections

### `renderModelSection()` - Simplified
- Now only used for standalone models
- Guards prevent editing if model is in a group (redundant safety check)
- Much simpler rendering since no group complexity

### CSS Additions
- `.group-models-section` - Wrapper for models list
- `.models-list-compact` - Flex container
- `.model-list-item` - Individual item with name and remove button
- `.group-params-section` - Wrapper for parameters
- `.btn-remove-model` - Red X button for removal

## User Workflow

### To Create a Group with Models:
1. Click "Create Group" 
2. Name the group
3. Click "Add Model" inside group
4. Select models to add
5. Set group parameters (all models inherit these)

### To Customize Individual Model:
1. Model must be in Standalone section
2. Expand the model
3. Click parameter to edit
4. Save changes

### To Move Model from Group to Standalone:
1. Click × to remove from group
2. Add it to Standalone section
3. Now can customize its parameters

## Benefits

1. **Clear separation of concerns** - Groups apply to multiple, standalone is individual
2. **Prevents confusion** - No redundant model parameter editing in groups
3. **Cleaner UI** - Less nesting, simpler visual hierarchy
4. **Better UX** - Clear workflow for both group and individual settings

## Data Model
Groups and standalone models use same backend structure:
- Group in preset: `{name: "groupname", parameters: {...}, models: [...]}` 
- Standalone model: `{name: "modelname", parameters: {...}, model: "path"}`
- Models in group inherit group's parameters automatically

## Status
✅ **COMPLETE** - Ready for testing and user validation
