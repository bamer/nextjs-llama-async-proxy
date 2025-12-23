'use client';

import { useState } from 'react';
import { useConfig } from '@/hooks/use-config';
import { Card, CardContent, Typography, Box, Grid, TextField, Button, Divider, LinearProgress, Tabs, Tab, Switch, FormControlLabel, Slider } from '@mui/material';
import { m } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { Save, Restore, Sync, CheckCircle, ErrorOutline } from '@mui/icons-material';

export default function ModernConfiguration() {
  const { config, loading, updateConfig, resetConfig, syncWithBackend, validateConfig } = useConfig();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [formConfig, setFormConfig] = useState({ ...config });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleModelDefaultsChange = (field: string, value: number) => {
    setFormConfig(prev => ({
      ...prev,
      modelDefaults: {
        ...prev.modelDefaults,
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setValidationErrors([]);

    try {
      // Validate config
      const validation = validateConfig(formConfig);
      if (!validation.valid) {
        setValidationErrors(validation.errors || []);
        throw new Error('Validation failed');
      }

      // Update config
      await updateConfig(formConfig);
      setSaveSuccess(true);
      
      // Show success message
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    resetConfig();
    setFormConfig(config);
  };

  const handleSync = async () => {
    await syncWithBackend();
  };

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>Loading Configuration...</Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <m.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h3" component="h1" fontWeight="bold">
            Configuration Center
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage your application settings and preferences
          </Typography>
        </m.div>
      </Box>

      <Divider sx={{ my: 4, borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }} />

      {/* Tabs */}
      <Card
        sx={{ 
          mb: 4,
          background: isDark ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' : 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
          boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.3)' : '0 4px 20px rgba(0, 0, 0, 0.05)'
        }}
      >
        <Tabs value={activeTab} onChange={handleTabChange} centered>
          <Tab label="General Settings" />
          <Tab label="Model Defaults" />
          <Tab label="Advanced" />
        </Tabs>
      </Card>

      {/* Success Message */}
      {saveSuccess && (
        <m.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card sx={{ mb: 3, background: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CheckCircle color="success" />
                <Typography variant="body1" color="success">
                  Configuration saved successfully!
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </m.div>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <m.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card sx={{ mb: 3, background: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <ErrorOutline color="error" />
                <Typography variant="body1" color="error" fontWeight="medium">
                  Configuration Errors
                </Typography>
              </Box>
              <Box sx={{ ml: 4 }}>
                {validationErrors.map((error, index) => (
                  <Typography key={index} variant="body2" color="error" sx={{ mb: 1 }}>
                    • {error}
                  </Typography>
                ))}
              </Box>
            </CardContent>
          </Card>
        </m.div>
      )}

      {/* Tab Content */}
      {activeTab === 0 && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Card
            sx={{ 
              mb: 4,
              background: isDark ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' : 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
              boxShadow: isDark ? '0 8px 30px rgba(0, 0, 0, 0.3)' : '0 8px 30px rgba(0, 0, 0, 0.1)'
            }}
          >
            <CardContent>
              <Typography variant="h5" fontWeight="bold" mb={4}>
                General Settings
              </Typography>
              
              <Grid container spacing={4}>
                <Grid key="basePath" size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Base Path"
                    name="basePath"
                    value={formConfig.basePath}
                    onChange={handleInputChange}
                    variant="outlined"
                    helperText="Path to your models directory"
                    sx={{ mb: 3 }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Log Level"
                    name="logLevel"
                    value={formConfig.logLevel}
                    onChange={handleInputChange}
                    select
                    SelectProps={{ native: true }}
                    variant="outlined"
                    helperText="Logging verbosity level"
                    sx={{ mb: 3 }}
                  >
                    {['debug', 'info', 'warn', 'error'].map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Max Concurrent Models"
                    name="maxConcurrentModels"
                    type="number"
                    value={formConfig.maxConcurrentModels}
                    onChange={handleInputChange}
                    variant="outlined"
                    helperText="Maximum number of models that can run simultaneously"
                    InputProps={{ inputProps: { min: 1, max: 20 } }}
                    sx={{ mb: 3 }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formConfig.autoUpdate}
                        onChange={(e) => handleInputChange({ 
                          target: { name: 'autoUpdate', checked: e.target.checked, type: 'checkbox' }
                        } as any)}
                        name="autoUpdate"
                        color="primary"
                      />
                    }
                    label="Auto Update"
                    sx={{ mb: 3 }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 0, mb: 3 }}>
                    Automatically update models and dependencies
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formConfig.notificationsEnabled}
                        onChange={(e) => handleInputChange({ 
                          target: { name: 'notificationsEnabled', checked: e.target.checked, type: 'checkbox' }
                        } as any)}
                        name="notificationsEnabled"
                        color="primary"
                      />
                    }
                    label="Notifications Enabled"
                    sx={{ mb: 3 }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 0, mb: 3 }}>
                    Receive system alerts and notifications
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </m.div>
      )}

      {activeTab === 1 && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Card
            sx={{ 
              mb: 4,
              background: isDark ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' : 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
              boxShadow: isDark ? '0 8px 30px rgba(0, 0, 0, 0.3)' : '0 8px 30px rgba(0, 0, 0, 0.1)'
            }}
          >
            <CardContent>
              <Typography variant="h5" fontWeight="bold" mb={4}>
                Model Default Parameters
              </Typography>
              
              <Grid container spacing={4}>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle1" fontWeight="medium" mb={2}>
                    Context Size
                  </Typography>
                  <Slider
                    value={formConfig.modelDefaults.ctx_size}
                    onChange={(_e, value) => handleModelDefaultsChange('ctx_size', value as number)}
                    min={128}
                    max={2000000}
                    step={128}
                    valueLabelDisplay="auto"
                    marks={[
                      { value: 128, label: '128' },
                      { value: 1000000, label: '1M' },
                      { value: 2000000, label: '2M' }
                    ]}
                  />
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    Maximum tokens in context (default: 4096)
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle1" fontWeight="medium" mb={2}>
                    Batch Size
                  </Typography>
                  <Slider
                    value={formConfig.modelDefaults.batch_size}
                    onChange={(_e, value) => handleModelDefaultsChange('batch_size', value as number)}
                    min={1}
                    max={4096}
                    step={128}
                    valueLabelDisplay="auto"
                  />
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    Logical maximum batch size
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle1" fontWeight="medium" mb={2}>
                    Temperature
                  </Typography>
                  <Slider
                    value={formConfig.modelDefaults.temperature}
                    onChange={(_e, value) => handleModelDefaultsChange('temperature', value as number)}
                    min={0}
                    max={2}
                    step={0.1}
                    valueLabelDisplay="auto"
                  />
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    Sampling temperature (0 = deterministic, 2 = very random)
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle1" fontWeight="medium" mb={2}>
                    Top P (Nucleus Sampling)
                  </Typography>
                  <Slider
                    value={formConfig.modelDefaults.top_p}
                    onChange={(_e, value) => handleModelDefaultsChange('top_p', value as number)}
                    min={0}
                    max={1}
                    step={0.05}
                    valueLabelDisplay="auto"
                  />
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    Keep tokens with cumulative probability less than or equal to P
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle1" fontWeight="medium" mb={2}>
                    Top K
                  </Typography>
                  <Slider
                    value={formConfig.modelDefaults.top_k}
                    onChange={(_e, value) => handleModelDefaultsChange('top_k', value as number)}
                    min={0}
                    max={100}
                    step={1}
                    valueLabelDisplay="auto"
                  />
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    Top-K sampling (0 = disabled)
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle1" fontWeight="medium" mb={2}>
                    GPU Layers
                  </Typography>
                  <Slider
                    value={formConfig.modelDefaults.gpu_layers}
                    onChange={(_e, value) => handleModelDefaultsChange('gpu_layers', value as number)}
                    min={-1}
                    max={100}
                    step={1}
                    valueLabelDisplay="auto"
                    marks={[
                      { value: -1, label: 'All' },
                      { value: 0, label: '0' },
                      { value: 50, label: '50' },
                      { value: 100, label: '100' }
                    ]}
                  />
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    Number of layers to offload to GPU (-1 = all layers)
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle1" fontWeight="medium" mb={2}>
                    CPU Threads
                  </Typography>
                  <Slider
                    value={formConfig.modelDefaults.threads}
                    onChange={(_e, value) => handleModelDefaultsChange('threads', value as number)}
                    min={-1}
                    max={32}
                    step={1}
                    valueLabelDisplay="auto"
                    marks={[
                      { value: -1, label: 'Auto' },
                      { value: 4, label: '4' },
                      { value: 16, label: '16' },
                      { value: 32, label: '32' }
                    ]}
                  />
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    Number of CPU threads to use (-1 = auto)
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </m.div>
      )}

      {activeTab === 2 && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Card
            sx={{ 
              mb: 4,
              background: isDark ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' : 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
              boxShadow: isDark ? '0 8px 30px rgba(0, 0, 0, 0.3)' : '0 8px 30px rgba(0, 0, 0, 0.1)'
            }}
          >
            <CardContent>
              <Typography variant="h5" fontWeight="bold" mb={4}>
                Advanced Settings
              </Typography>
              
              <Typography variant="body1" color="text.secondary" mb={3}>
                Advanced configuration options for power users.
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
                <Button
                  variant="outlined"
                  startIcon={<Restore />}
                  onClick={handleReset}
                  disabled={isSaving}
                >
                  Reset to Defaults
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Sync />}
                  onClick={handleSync}
                  disabled={isSaving}
                >
                  Sync with Backend
                </Button>
              </Box>
              
              <Typography variant="body2" color="text.secondary" mb={2}>
                Current configuration version: 2.0
              </Typography>
            </CardContent>
          </Card>
        </m.div>
      )}

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Save />}
          onClick={handleSave}
          disabled={isSaving}
          size="large"
        >
          {isSaving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </Box>
    </Box>
  );
}
