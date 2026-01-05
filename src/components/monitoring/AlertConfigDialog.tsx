"use client";

import { useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Switch, TextField, Box, Typography, FormControl, InputLabel, Select, MenuItem, Grid, IconButton, Divider } from "@mui/material";
import { Close, Add, Delete } from "@mui/icons-material";
import { showSuccess, showError } from "@/utils/toast-helpers";
import { AlertConfig, AlertSeverity, AlertCategory, AlertCondition, ALERT_SEVERITY_LABELS, ALERT_CATEGORY_LABELS, ALERT_CONDITION_LABELS, DEFAULT_ALERTS } from "@/types/alert";

interface AlertConfigDialogProps {
  open: boolean;
  onClose: () => void;
  alerts: AlertConfig[];
  onSave: (alerts: AlertConfig[]) => Promise<void>;
}

const severityOptions: AlertSeverity[] = ['info', 'warning', 'error', 'critical'];
const categoryOptions: AlertCategory[] = ['cpu', 'memory', 'gpu', 'storage', 'temperature', 'network', 'model', 'custom'];
const conditionOptions: AlertCondition[] = ['above', 'below', 'equals', 'not_equals'];

export default function AlertConfigDialog({ open, onClose, alerts, onSave }: AlertConfigDialogProps) {
  const [local, setLocal] = useState<AlertConfig[]>(alerts);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const editingAlert = local.find(a => a.id === editingId);

  const handleAdd = () => {
    const newId = `alert-${Date.now()}`;
    const newAlert: AlertConfig = {
      id: newId,
      name: 'New Alert',
      category: 'cpu',
      severity: 'warning',
      enabled: true,
      threshold: { condition: 'above', value: 80 },
      cooldown: 300,
      actions: [{ type: 'notification', config: {} }],
      triggerCount: 0,
    };
    setLocal(prev => [...prev, newAlert]);
    setEditingId(newId);
  };

  const handleUpdate = (id: string, field: keyof AlertConfig, value: unknown) => {
    setLocal(prev => prev.map(a =>
      a.id === id ? { ...a, [field]: value } : a
    ));
  };

  const handleThresholdUpdate = (id: string, field: keyof AlertConfig['threshold'], value: unknown) => {
    setLocal(prev => prev.map(a =>
      a.id === id ? { ...a, threshold: { ...a.threshold, [field]: value } } : a
    ));
  };

  const handleDelete = (id: string) => {
    setLocal(prev => prev.filter(a => a.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(local);
      showSuccess("Alert Settings", "Alert configuration saved successfully");
      onClose();
    } catch {
      showError("Alert Settings", "Failed to save alert configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setLocal(DEFAULT_ALERTS);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Alert Configuration</Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button startIcon={<Add />} onClick={handleAdd} variant="outlined" size="small">
            Add Alert
          </Button>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {local.map((alert) => (
            <Box
              key={alert.id}
              sx={{
                p: 2,
                borderRadius: 1,
                bgcolor: 'action.hover',
                border: editingId === alert.id ? 2 : 0,
                borderColor: 'primary.main',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Switch
                  checked={alert.enabled}
                  onChange={(_, v) => handleUpdate(alert.id, 'enabled', v)}
                />
                <TextField
                  size="small"
                  value={alert.name}
                  onChange={(e) => handleUpdate(alert.id, 'name', e.target.value)}
                  sx={{ flex: 1 }}
                />
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select
                    value={alert.category}
                    onChange={(e) => handleUpdate(alert.id, 'category', e.target.value)}
                  >
                    {categoryOptions.map((cat) => (
                      <MenuItem key={cat} value={cat}>{ALERT_CATEGORY_LABELS[cat]}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button color="error" onClick={() => handleDelete(alert.id)} size="small">
                  <Delete />
                </Button>
              </Box>
              <Grid container spacing={2} sx={{ pl: 4 }}>
                <Grid size={{ xs: 3 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Severity</InputLabel>
                    <Select
                      value={alert.severity}
                      label="Severity"
                      onChange={(e) => handleUpdate(alert.id, 'severity', e.target.value)}
                    >
                      {severityOptions.map((sev) => (
                        <MenuItem key={sev} value={sev}>{ALERT_SEVERITY_LABELS[sev]}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 3 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Condition</InputLabel>
                    <Select
                      value={alert.threshold.condition}
                      label="Condition"
                      onChange={(e) => handleThresholdUpdate(alert.id, 'condition', e.target.value)}
                    >
                      {conditionOptions.map((cond) => (
                        <MenuItem key={cond} value={cond}>{ALERT_CONDITION_LABELS[cond]}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Value"
                    value={alert.threshold.value}
                    onChange={(e) => handleThresholdUpdate(alert.id, 'value', Number(e.target.value))}
                  />
                </Grid>
                <Grid size={{ xs: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Cooldown (s)"
                    value={alert.cooldown}
                    onChange={(e) => handleUpdate(alert.id, 'cooldown', Number(e.target.value))}
                  />
                </Grid>
              </Grid>
            </Box>
          ))}
          {local.length === 0 && (
            <Box sx={{ p: 4, textAlign: 'center', bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography color="text.secondary">No alerts configured</Typography>
              <Button startIcon={<Add />} onClick={handleAdd} sx={{ mt: 2 }}>
                Add Your First Alert
              </Button>
            </Box>
          )}
        </Box>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleReset} color="secondary">Reset to Default</Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>
          {saving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
