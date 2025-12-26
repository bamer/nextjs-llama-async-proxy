"use client";

import { Card, CardContent, CardHeader, Typography, Box, Chip } from "@mui/material";
import { useStore } from "@/lib/store";
import { Memory, Warning, CheckCircle } from "@mui/icons-material";
import { useTheme } from "@/contexts/ThemeContext";

export function ModelInfoCard() {
  const models = useStore((state) => state.models);
  const { isDark } = useTheme();

  const runningModel = models.find(m => m.status === 'running');
  const loadingModel = models.find(m => m.status === 'loading');

  return (
    <Card sx={{ 
      background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)',
      backdropFilter: 'blur(10px)',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
      height: '100%'
    }}>
      <CardHeader 
        title="Model Information"
        subheader="Currently loaded model status"
      />
      <CardContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Loaded Model
          </Typography>
          {loadingModel ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <Warning color="warning" />
              <Typography variant="h5" fontWeight="bold" color="warning.main">
                Loading {loadingModel.name}...
              </Typography>
            </Box>
          ) : runningModel ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <CheckCircle color="success" />
              <Typography variant="h5" fontWeight="bold" color="success.main">
                {runningModel.name}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <Warning color="info" />
              <Typography variant="h5" fontWeight="bold" color="text.secondary">
                No model loaded
              </Typography>
            </Box>
          )}
        </Box>

        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Available Models
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
            <Chip label={`Total: ${models.length}`} size="small" />
            <Chip label={`Running: ${models.filter(m => m.status === 'running').length}`} size="small" color="success" />
            <Chip label={`Loading: ${models.filter(m => m.status === 'loading').length}`} size="small" color="warning" />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
