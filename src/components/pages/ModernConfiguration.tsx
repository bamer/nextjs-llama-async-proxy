'use client';

import { useState } from 'react';
import { useConfig } from '@/hooks/use-config';
import { Card, CardContent, Typography, Box, Grid, TextField, Button, Divider, LinearProgress, Tabs, Tab, Switch, FormControlLabel, Slider } from '@mui/material';
import { m } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { Save, Restore, Sync, CheckCircle, ErrorOutline } from '@mui/icons-material';

// Default llama-server configuration
const defaultLlamaServerConfig = {
  host: '127.0.0.1',
  port: 8080,
  timeout: 30000,
  ctx_size: 4096,
  batch_size: 2048,
  ubatch_size: 512,
  threads: -1,
  threads_batch: -1,
  n_predict: -1,
  seed: -1,
  gpu_layers: -1,
  n_cpu_moe: 0,
  cpu_moe: false,
  main_gpu: 0,
  tensor_split: '',
  split_mode: 'layer',
  no_mmap: false,
  temperature: 0.7,
  top_k: 40,
  top_p: 0.9,
  min_p: 0.0,
  xtc_probability: 0.0,
  xtc_threshold: 0.1,
  typical_p: 1.0,
  repeat_last_n: 64,
  repeat_penalty: 1.0,
  presence_penalty: 0.0,
  frequency_penalty: 0.0,
  dry_multiplier: 0.0,
  dry_base: 1.75,
  dry_allowed_length: 2,
  dry_penalty_last_n: 20,
  dry_sequence_breaker: '["\\n", ":", "\"", "*"]',
  max_tokens: 100,
  max_seq_len: 0,
  embedding: false,
  memory_f16: false,
  memory_f32: false,
  memory_auto: true,
  vocab_only: false,
  rope_freq_base: 0.0,
  rope_freq_scale: 0.0,
  yarn_ext_factor: 0.0,
  yarn_attn_factor: 0.0,
  yarn_beta_fast: 0.0,
  yarn_beta_slow: 0.0,
  api_keys: '',
  ssl_cert_file: '',
  ssl_key_file: '',
  cors_allow_origins: '',
  system_prompt: '',
  chat_template: '',
  log_format: 'text',
  log_level: 'info',
  log_colors: true,
  log_verbose: false,
  cache_reuse: 0,
  cache_type_k: 'f16',
  cache_type_v: 'f16',
  ml_lock: false,
  no_kv_offload: false,
};

export default function ModernConfiguration() {
  const { config, loading, updateConfig, resetConfig, syncWithBackend, validateConfig } = useConfig();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [formConfig, setFormConfig] = useState<any>(() => {
    const initialConfig = { ...config };
    // Ensure llamaServer has default values if not present
    if (!initialConfig.llamaServer) {
      initialConfig.llamaServer = {} as any; // Will be populated by the form
    }
    return initialConfig;
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormConfig((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleLlamaServerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const fieldName = name.split('.')[1];
    setFormConfig((prev: any) => ({
      ...prev,
      llamaServer: {
        ...prev.llamaServer,
        [fieldName]: type === 'number' ? parseFloat(value) : value
      }
    }));
  };

  const handleModelDefaultsChange = (field: string, value: number) => {
    setFormConfig((prev: any) => ({
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
           <Tab label="Llama-Server Settings" />
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

                 <Grid size={{ xs: 12 }}>
                   <TextField
                     fullWidth
                     label="Llama-Server Path"
                     name="llamaServerPath"
                     value={formConfig.llamaServerPath || ''}
                     onChange={handleInputChange}
                     variant="outlined"
                     helperText="Path to llama-server executable"
                     sx={{ mb: 3 }}
                   />
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
                Llama-Server Settings
              </Typography>
              
              <Grid container spacing={4}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Host"
                    name="llamaServer.host"
                    value={formConfig.llamaServer?.host || '127.0.0.1'}
                    onChange={handleLlamaServerChange}
                    variant="outlined"
                    helperText="Server hostname or IP address"
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Port"
                    name="llamaServer.port"
                    type="number"
                    value={formConfig.llamaServer?.port || 8080}
                    onChange={handleLlamaServerChange}
                    variant="outlined"
                    helperText="Server port number"
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Context Size"
                    name="llamaServer.ctx_size"
                    type="number"
                    value={formConfig.llamaServer?.ctx_size || 4096}
                    onChange={handleLlamaServerChange}
                    variant="outlined"
                    helperText="Maximum context window size"
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Batch Size"
                    name="llamaServer.batch_size"
                    type="number"
                    value={formConfig.llamaServer?.batch_size || 2048}
                    onChange={handleLlamaServerChange}
                    variant="outlined"
                    helperText="Batch size for processing"
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Temperature"
                    name="llamaServer.temperature"
                    type="number"
                    value={formConfig.llamaServer?.temperature || 0.8}
                    onChange={handleLlamaServerChange}
                    variant="outlined"
                    inputProps={{ step: 0.1, min: 0, max: 2 }}
                    helperText="Sampling temperature (0-2)"
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Top-P"
                    name="llamaServer.top_p"
                    type="number"
                    value={formConfig.llamaServer?.top_p || 0.9}
                    onChange={handleLlamaServerChange}
                    variant="outlined"
                    inputProps={{ step: 0.1, min: 0, max: 1 }}
                    helperText="Nucleus sampling parameter"
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="GPU Layers"
                    name="llamaServer.gpu_layers"
                    type="number"
                    value={formConfig.llamaServer?.gpu_layers || -1}
                    onChange={handleLlamaServerChange}
                    variant="outlined"
                    helperText="Number of layers to offload to GPU (-1 = auto)"
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Threads"
                    name="llamaServer.threads"
                    type="number"
                    value={formConfig.llamaServer?.threads || -1}
                    onChange={handleLlamaServerChange}
                    variant="outlined"
                    helperText="Number of CPU threads (-1 = auto)"
                  />
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
