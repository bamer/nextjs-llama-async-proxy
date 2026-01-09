# Presets UI Structure - Corrected

## Overview
The preset system now has a clear separation of concerns:

1. **Global Defaults** - Apply to all models unless overridden
2. **Groups** - Apply parameters to multiple models at once
3. **Standalone Models** - Individual models with custom parameters

## UI Layout

### Global Defaults Section
- Expandable section
- Shows default parameters that apply to all models
- Editable (click parameter to edit)

### Groups Section
When expanded, each group shows:

```
📁 Group Name [model count] ▼ [Delete]
   ├─ Applies to (section title)
   │  ├─ [Model 1] [×]
   │  ├─ [Model 2] [×]
   │  └─ [Model 3] [×]
   │  [+ Add Model]
   │
   └─ Group Parameters (section title)
      ├─ [Parameter 1 value] [Copy]
      ├─ [Parameter 2 value] [Copy]
      └─ etc...
```

**Key Points:**
- Models list shows only names, no individual parameter editing
- Remove button (×) lets you remove model from group
- Add Model button to add new models to group
- Group parameters are below the model list
- All models in group inherit group parameters

### Standalone Models Section
When expanded, each model shows:

```
📄 Model Name [model-path] ▼ [×]
   ├─ [Parameter 1 value] [Copy]
   ├─ [Parameter 2 value] [Copy]
   └─ etc...
```

**Key Points:**
- Expandable to show/edit individual parameters
- Click parameter value to edit it
- Parameters can be different from group or defaults
- Models here are not part of any group

## Data Flow

### Adding a Model to a Group
1. Click "+ Add Model" in group
2. Select model from available models
3. Model is added to group's model list
4. Model inherits group parameters

### Customizing Model Parameters
1. Model must be in Standalone Models section
2. Expand the model
3. Click parameter value to edit
4. Save changes

### Moving Model from Group to Standalone
1. Remove from group (click × in model list)
2. Add to standalone section (click "+ Add Standalone Model")
3. Now can customize its parameters

## CSS Classes Used

- `.group-models-section` - Models list wrapper
- `.models-list-compact` - Flex container for model items
- `.model-list-item` - Individual model in list
- `.model-name` - Model name text
- `.btn-remove-model` - Remove button
- `.group-params-section` - Parameters wrapper
