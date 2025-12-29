# ModelConfigDialog UI Improvements

## Current State Analysis

### Strengths
- Uses MUI v7 Grid with proper `size` prop (not deprecated `item`)
- Basic form structure with dialogs, fields, and actions
- Handles multiple config types (sampling, memory, gpu, advanced, lora, multimodal)
- Change tracking with `hasChanges` state

### Weaknesses
1. **Basic Controls**: Plain TextField components for all inputs
2. **No Visual Feedback**: No icons, tooltips, or helpful descriptions
3. **No Sliders**: Numeric parameters are text inputs instead of interactive sliders
4. **No Validation**: No error handling, validation states, or type checking
5. **Poor Hierarchy**: Flat parameter list without logical grouping
6. **No Help Text**: Users don't understand what parameters do
7. **No Preset Management**: Can't save/load configuration presets
8. **No Reset Function**: Can't easily reset to defaults
9. **Limited Accessibility**: Missing ARIA labels, proper focus management
10. **No Visual Polish**: Missing hover effects, transitions, animations

## Proposed Improvements

### 1. Modern MUI v7 Components

#### Slider Controls for Numeric Parameters
- Use `@mui/material/Slider` with marks and value labels
- Add min/max/step for intuitive control
- Show current value with inline display

#### Accordion for Grouping
- Use `@mui/material/Accordion` for logical parameter groups
- Collapsible sections to manage complex configurations
- Better organization and visual hierarchy

#### Tooltip & Help Text
- Use `@mui/material/Tooltip` for parameter explanations
- Use `@mui/material/Alert` for validation errors
- Use `@mui/material/FormHelperText` for inline hints

#### Enhanced Switch Controls
- Styled switches with custom icons
- Use `@mui/material/FormGroup` with proper spacing
- Add description text below switches

### 2. User-Friendly Controls

#### Slider with Value Display
```tsx
<Slider
  value={value}
  onChange={(_, newValue) => handleFieldChange(fieldName, newValue)}
  min={0}
  max={2}
  step={0.01}
  marks={[
    { value: 0, label: '0' },
    { value: 1, label: '1' },
    { value: 2, label: '2' }
  ]}
  valueLabelDisplay="auto"
  valueLabelFormat={(value) => value.toFixed(2)}
/>
```

#### Input with Validation
```tsx
<TextField
  fullWidth
  size="small"
  label={field.label}
  value={value}
  onChange={(e) => handleFieldChange(field.name, e.target.value)}
  error={!!errors[field.name]}
  helperText={errors[field.name] || field.description}
  InputProps={{
    startAdornment: field.unit && (
      <InputAdornment position="start">{field.unit}</InputAdornment>
    )
  }}
/>
```

#### Select with Icons
```tsx
<Select
  label={field.label}
  value={value}
  onChange={(e) => handleFieldChange(field.name, e.target.value)}
  startAdornment={
    <InputAdornment position="start">
      <InfoIcon fontSize="small" color="action" />
    </InputAdornment>
  }
>
```

### 3. Professional Layout

#### Section-Based Layout
```tsx
<Box sx={{ mt: 3 }}>
  {/* Core Sampling Parameters */}
  <Accordion
    defaultExpanded
    TransitionProps={{ unmountOnExit: false }}
  >
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <Typography variant="subtitle2" fontWeight={600}>
        Core Sampling Parameters
      </Typography>
    </AccordionSummary>
    <AccordionDetails>
      <Grid container spacing={2}>
        {/* Sampling fields */}
      </Grid>
    </AccordionDetails>
  </Accordion>

  {/* Advanced Sampling */}
  <Accordion>
    {/* Advanced fields */}
  </Accordion>
</Box>
```

#### Improved Dialog Structure
```tsx
<Dialog
  open={open}
  onClose={onClose}
  maxWidth="lg"
  fullWidth
  PaperProps={{
    sx: {
      borderRadius: '16px',
      maxHeight: '85vh',
    }
  }}
  TransitionComponent={Fade}
>
  <DialogTitle>
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <SettingsIcon color="primary" />
        <Typography variant="h6">
          Configure {configTitle} for Model {modelId}
        </Typography>
      </Box>
      <IconButton onClick={onClose} size="small">
        <CloseIcon />
      </IconButton>
    </Box>
  </DialogTitle>
  <DialogContent dividers>
    {/* Config sections */}
  </DialogContent>
  <DialogActions sx={{ px: 3, py: 2 }}>
    <Stack direction="row" spacing={2} sx={{ width: '100%', justifyContent: 'space-between' }}>
      <Button onClick={handleReset} startIcon={<RefreshIcon />}>
        Reset to Defaults
      </Button>
      <Stack direction="row" spacing={2}>
        <Button onClick={onClose}>Cancel</Button>
        <LoadingButton
          onClick={handleSave}
          loading={saving}
          variant="contained"
          color="primary"
          disabled={!hasChanges}
          startIcon={<SaveIcon />}
        >
          Save Configuration
        </LoadingButton>
      </Stack>
    </Stack>
  </DialogActions>
</Dialog>
```

### 4. Accessibility Improvements

#### Proper Labels & ARIA
```tsx
<FormControl fullWidth size="small">
  <InputLabel id={`${field.name}-label`} shrink>
    {field.label}
  </InputLabel>
  <Select
    labelId={`${field.name}-label`}
    id={field.name}
    label={field.label}
    value={value}
    onChange={(e) => handleFieldChange(field.name, e.target.value)}
    aria-describedby={`${field.name}-helper`}
    MenuProps={{
      PaperProps: {
        sx: { maxHeight: 300, mt: 1 }
      }
    }}
  >
```

#### Focus Management
```tsx
const firstFieldRef = useRef<HTMLInputElement>(null);

useEffect(() => {
  if (open && firstFieldRef.current) {
    firstFieldRef.current.focus();
  }
}, [open]);
```

#### Keyboard Navigation
- Add `onKeyDown` handlers for Escape to close
- Support Tab navigation through fields
- Add `role="dialog"` and `aria-modal="true"`

### 5. Visual Feedback

#### Hover Effects & Transitions
```tsx
<TextField
  sx={{
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'translateY(-1px)',
    },
    '&.Mui-focused': {
      transform: 'translateY(-1px)',
    }
  }}
/>
```

#### Disabled States
```tsx
<LoadingButton
  disabled={!hasChanges}
  sx={{
    transition: 'opacity 0.2s ease',
    '&:disabled': {
      opacity: 0.5,
    }
  }}
>
  Save Configuration
</LoadingButton>
```

#### Validation Feedback
```tsx
{errors[field.name] && (
  <Alert severity="error" sx={{ mt: 1 }} icon={<ErrorIcon fontSize="inherit" />}>
    {errors[field.name]}
  </Alert>
)}
```

### 6. Responsive Design

#### Breakpoint-Aware Layout
```tsx
<Grid container spacing={{ xs: 1, sm: 2, md: 3 }}>
  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
    {/* Field */}
  </Grid>
</Grid>

// Dialog responsive sizing
<Dialog
  maxWidth={matches.sm ? 'lg' : 'md'}
  fullWidth
  PaperProps={{
    sx: {
      borderRadius: { xs: '12px', sm: '16px' }
    }
  }}
>
```

### 7. Error Handling & Validation

#### Validation Schema
```typescript
const validationRules: Record<string, ValidationRule> = {
  temperature: {
    min: 0,
    max: 2,
    step: 0.01,
    description: 'Controls randomness in generation. Lower = more deterministic, Higher = more creative'
  },
  top_k: {
    min: 0,
    max: 100,
    step: 1,
    description: 'Limit next token selection to top K probabilities'
  },
  top_p: {
    min: 0,
    max: 1,
    step: 0.01,
    description: 'Nucleus sampling threshold'
  }
};
```

#### Validation Hook
```typescript
const validateField = (name: string, value: any): string | null => {
  const rule = validationRules[name];
  if (!rule) return null;

  if (typeof value === 'number') {
    if (rule.min !== undefined && value < rule.min) {
      return `Value must be at least ${rule.min}`;
    }
    if (rule.max !== undefined && value > rule.max) {
      return `Value must be at most ${rule.max}`;
    }
  }

  return null;
};
```

### 8. Enhanced Field Types

#### Number Field with Slider Toggle
```tsx
<Stack spacing={1}>
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <Typography variant="caption" color="text.secondary">
      {field.label}
    </Typography>
    <IconButton
      size="small"
      onClick={() => toggleSliderMode(field.name)}
      color="primary"
    >
      {useSlider[field.name] ? <KeyboardIcon /> : <TuneIcon />}
    </IconButton>
  </Box>
  {useSlider[field.name] ? (
    <Slider value={value} onChange={...} />
  ) : (
    <TextField type="number" value={value} onChange={...} />
  )}
</Stack>
```

#### Boolean Switch with Description
```tsx
<FormControlLabel
  control={
    <Switch
      checked={Boolean(value)}
      onChange={(e) => handleFieldChange(field.name, e.target.checked)}
      color="primary"
    />
  }
  label={
    <Box>
      <Typography variant="body2">{field.label}</Typography>
      {field.description && (
        <Typography variant="caption" color="text.secondary" display="block">
          {field.description}
        </Typography>
      )}
    </Box>
  }
  sx={{ alignItems: 'flex-start', ml: 0 }}
/>
```

### 9. Preset Management

#### Preset Selector
```tsx
<FormControl fullWidth size="small" sx={{ mb: 2 }}>
  <InputLabel>Configuration Preset</InputLabel>
  <Select
    value={selectedPreset}
    onChange={(e) => loadPreset(e.target.value)}
  >
    <MenuItem value="">Custom Configuration</MenuItem>
    <MenuItem value="balanced">Balanced</MenuItem>
    <MenuItem value="creative">Creative</MenuItem>
    <MenuItem value="precise">Precise</MenuItem>
    <MenuItem value="fast">Fast</MenuItem>
  </Select>
</FormControl>
```

#### Save Preset Dialog
```tsx
<Button
  onClick={() => setShowSavePreset(true)}
  startIcon={<BookmarkAddIcon />}
  variant="outlined"
  size="small"
>
  Save as Preset
</Button>
```

### 10. Theme Integration

#### Dark Mode Aware
```tsx
<Box
  sx={{
    background: (theme) => theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.03)'
      : 'rgba(0, 0, 0, 0.02)',
    borderRadius: 2,
    p: 2
  }}
>
```

#### Using Theme Colors
```tsx
<Typography
  variant="caption"
  sx={{
    color: (theme) => theme.palette.text.secondary,
    fontFamily: 'monospace'
  }}
>
  {field.name}
</Typography>
```

## Specific Config Type Improvements

### Sampling Parameters
- **Core Group**: Temperature, Top P, Top K (with sliders, marks)
- **Repetition Control**: Repeat Penalty, Repeat Last N (with value display)
- **Advanced**: DRY parameters, Dynatemp, Mirostat (accordion section)
- **Output Control**: Grammar, JSON Schema, Seed (textarea for complex inputs)

### Memory Parameters
- **Cache Settings**: Cache RAM, Cache Type K/V (with memory indicators)
- **Memory Management**: MMap, MLock (switches with descriptions)
- **Performance**: Defrag Threshold, NUMA (with tooltips)

### GPU Parameters
- **Device Selection**: Device, List Devices (with refresh capability)
- **Layer Distribution**: GPU Layers, Split Mode (slider with visual feedback)
- **Multi-GPU**: Tensor Split, Main GPU (array input for split values)

### Advanced Parameters
- **Model Behavior**: Pooling, Context Shift (with description)
- **Performance**: Op Offload, Fit parameters (accordion for performance tuning)
- **Debugging**: Check Tensors, Polling settings (collapsible section)

### LoRA Parameters
- **LoRA Models**: LoRA, LoRA Scaled (with model selector)
- **Draft Models**: Model Draft, Draft Max/Min (with configuration presets)
- **Advanced Draft**: CPU MoE Draft, GPU Layers Draft (accordion)

### Multimodal Parameters
- **Projection**: MMPROJ, MMPROJ URL (with file picker)
- **Token Control**: Image Min/Max Tokens (slider with visual feedback)
- **Auto-detection**: MMPROJ Auto (switch with description)

## Implementation Priority

### Phase 1: Core UI Improvements (High Priority)
1. Add Slider controls for key numeric parameters
2. Add Accordion grouping for parameter sections
3. Add tooltips and help text for all parameters
4. Add Reset to Defaults button
5. Improve Dialog styling and layout

### Phase 2: UX Enhancements (Medium Priority)
1. Add validation with error messages
2. Add Loading states for save operations
3. Add preset management system
4. Add slider/number input toggle
5. Improve accessibility (ARIA labels, focus management)

### Phase 3: Advanced Features (Low Priority)
1. Add configuration import/export
2. Add configuration history
3. Add configuration diff viewer
4. Add keyboard shortcuts
5. Add configuration templates

## Code Examples

See implementation examples in the improved component code.
