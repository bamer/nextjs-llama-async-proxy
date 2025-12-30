"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Typography,
  Box,
  Button,
  Chip,
  Grid,
  Switch,
  Stack,
  Alert,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useTheme } from '@/contexts/ThemeContext';
import type { FitParamsData } from '@/hooks/use-fit-params';

export interface FitParamsDialogProps {
  open: boolean;
  onClose: () => void;
  modelName: string;
  fitParams: FitParamsData | null;
  onApply?: (selectedParams: string[]) => void;
}

export default function FitParamsDialog({
  open,
  onClose,
  modelName,
  fitParams,
  onApply,
}: FitParamsDialogProps) {
  const { isDark } = useTheme();
  const [selectedParams, setSelectedParams] = useState<Set<string>>(new Set());

  const hasRecommendations = fitParams !== null && (
    fitParams.recommended_ctx_size !== null ||
    fitParams.recommended_gpu_layers !== null ||
    fitParams.recommended_tensor_split !== null ||
    fitParams.projected_cpu_memory_mb !== null ||
    fitParams.projected_gpu_memory_mb !== null
  );

  const toggleParam = (paramName: string) => {
    setSelectedParams((prev) => {
      const next = new Set(prev);
      if (next.has(paramName)) {
        next.delete(paramName);
      } else {
        next.add(paramName);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const allParams: string[] = [];
    if (fitParams?.recommended_ctx_size !== null) allParams.push('ctx_size');
    if (fitParams?.recommended_gpu_layers !== null) allParams.push('gpu_layers');
    if (fitParams?.recommended_tensor_split !== null) allParams.push('tensor_split');
    if (fitParams?.projected_cpu_memory_mb !== null) allParams.push('cpu_memory');
    if (fitParams?.projected_gpu_memory_mb !== null) allParams.push('gpu_memory');
    setSelectedParams(new Set(allParams));
  };

  const handleApply = () => {
    const selectedArray = Array.from(selectedParams);
    onApply?.(selectedArray);
    onClose();
  };

  const handleClose = () => {
    setSelectedParams(new Set());
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          background: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.98)',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight="bold">
          Llama-Fit Parameters for {modelName}
        </Typography>
      </DialogTitle>

      <DialogContent>
        {!fitParams || fitParams.fit_params_error ? (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                {fitParams?.fit_params_error || 'No fit-params analysis available. Run "Analyze model with llama-fit-params" first.'}
              </Typography>
            </Alert>
          </Box>
        ) : !hasRecommendations ? (
          <Box>
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2">
                Analysis completed but no parameter recommendations were found. This may indicate the model is already well-optimized.
              </Typography>
            </Alert>
          </Box>
        ) : (
          <Stack spacing={3}>
            {/* Analysis Status */}
            <Box sx={{ mb: 3, p: 2, bgcolor: isDark ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.06)', borderRadius: 1 }}>
              <Typography variant="body2" fontWeight="medium" color={fitParams.fit_params_success ? 'success.main' : 'text.primary'}>
                <InfoIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 1, color: fitParams.fit_params_success ? 'success' : 'info' }} />
                {fitParams.fit_params_success ? 'Analysis completed successfully' : 'Analysis completed with warnings'}
              </Typography>
              {fitParams.fit_params_error && (
                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                  Error: {fitParams.fit_params_error}
                </Typography>
              )}
            </Box>

            {/* Recommended Parameters */}
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
              Recommended Parameters
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select which parameters to apply. All parameters will be applied together.
            </Typography>

            <Grid container spacing={2}>
              {/* Context Size */}
              {fitParams.recommended_ctx_size !== null && (
                <Grid item xs={12}>
                  <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        Context Size
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {fitParams.recommended_ctx_size.toLocaleString()} tokens
                      </Typography>
                    </Box>
                    <Switch
                      checked={selectedParams.has('ctx_size')}
                      onChange={() => toggleParam('ctx_size')}
                      color="primary"
                      size="small"
                    />
                  </Stack>
                </Grid>
              )}

              {/* GPU Layers */}
              {fitParams.recommended_gpu_layers !== null && (
                <Grid item xs={12}>
                  <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        GPU Layers
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {fitParams.recommended_gpu_layers} layers
                      </Typography>
                    </Box>
                    <Switch
                      checked={selectedParams.has('gpu_layers')}
                      onChange={() => toggleParam('gpu_layers')}
                      color="primary"
                      size="small"
                    />
                  </Stack>
                </Grid>
              )}

              {/* Tensor Split */}
              {fitParams.recommended_tensor_split !== null && (
                <Grid item xs={12}>
                  <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        Tensor Split
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {fitParams.recommended_tensor_split}
                      </Typography>
                    </Box>
                    <Switch
                      checked={selectedParams.has('tensor_split')}
                      onChange={() => toggleParam('tensor_split')}
                      color="primary"
                      size="small"
                    />
                  </Stack>
                </Grid>
              )}

              {/* CPU Memory Projection */}
              {fitParams.projected_cpu_memory_mb !== null && (
                <Grid item xs={12}>
                  <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        Projected CPU Memory
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {fitParams.projected_cpu_memory_mb < 1024
                          ? `${Math.round(fitParams.projected_cpu_memory_mb)} MB`
                          : `${(fitParams.projected_cpu_memory_mb / 1024).toFixed(1)} GB`
                        }
                      </Typography>
                    </Box>
                    <Switch
                      checked={selectedParams.has('cpu_memory')}
                      onChange={() => toggleParam('cpu_memory')}
                      color="primary"
                      size="small"
                    />
                  </Stack>
                </Grid>
              )}

              {/* GPU Memory Projection */}
              {fitParams.projected_gpu_memory_mb !== null && (
                <Grid item xs={12}>
                  <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        Projected GPU Memory
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {fitParams.projected_gpu_memory_mb < 1024
                          ? `${Math.round(fitParams.projected_gpu_memory_mb)} MB`
                          : `${(fitParams.projected_gpu_memory_mb / 1024).toFixed(1)} GB`
                        }
                      </Typography>
                    </Box>
                    <Switch
                      checked={selectedParams.has('gpu_memory')}
                      onChange={() => toggleParam('gpu_memory')}
                      color="primary"
                      size="small"
                    />
                  </Stack>
                </Grid>
              )}
            </Grid>

            {/* Quick Actions */}
            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                size="small"
                onClick={handleSelectAll}
                sx={{ mr: 1 }}
                disabled={selectedParams.size === 0}
              >
                Select All
              </Button>
              <Button
                size="small"
                onClick={() => setSelectedParams(new Set())}
                disabled={selectedParams.size === 0}
              >
                Clear All
              </Button>
            </Box>

            {/* Raw Output (expandable) */}
            {fitParams.fit_params_raw_output && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}>
                  <InfoIcon sx={{ fontSize: 14 }} />
                  Raw Analysis Output
                </Typography>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.1)',
                    borderRadius: 1,
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    maxHeight: 200,
                    overflowY: 'auto',
                  }}
                >
                  <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
                    {fitParams.fit_params_raw_output}
                  </pre>
                </Box>
              </Box>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'space-between' }}>
        <Button onClick={handleClose} startIcon={<CloseIcon />}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleApply}
          startIcon={<CheckIcon />}
          disabled={!fitParams || selectedParams.size === 0 || !fitParams.fit_params_success}
        >
          Apply {selectedParams.size} Selected
        </Button>
      </DialogActions>
    </Dialog>
  );
}
