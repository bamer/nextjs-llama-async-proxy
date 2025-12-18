'use client';

import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  IconButton,
  Collapse,
  useTheme,
  alpha
} from '@mui/material';
import {
  Info,
  Warning,
  Error,
  CheckCircle,
  Close,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';

interface NotificationCardProps {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read?: boolean;
  expandable?: boolean;
  actions?: React.ReactNode;
  onMarkAsRead?: (id: string) => void;
  onDismiss?: (id: string) => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  id,
  type,
  title,
  message,
  timestamp,
  read = false,
  expandable = false,
  actions,
  onMarkAsRead,
  onDismiss
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = React.useState(false);

  const getAlertSeverity = () => {
    switch (type) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'success': return 'success';
      default: return 'info';
    }
  };

  const getAlertIcon = () => {
    switch (type) {
      case 'error': return <Error />;
      case 'warning': return <Warning />;
      case 'success': return <CheckCircle />;
      default: return <Info />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card
      sx={{
        mb: 2,
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette[getAlertSeverity()].main, 0.3)}`,
        backgroundColor: alpha(theme.palette[getAlertSeverity()].main, theme.palette.mode === 'dark' ? 0.1 : 0.05),
        opacity: read ? 0.7 : 1,
        transition: 'all 0.2s ease-in-out',
        overflow: 'hidden',
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box display="flex" alignItems="flex-start" gap={2}>
          <Box sx={{ color: theme.palette[getAlertSeverity()].main, mt: 0.5 }}>
            {getAlertIcon()}
          </Box>
          <Box flex={1}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                {title}
              </Typography>
              <Box display="flex" gap={1}>
                {expandable && (
                  <IconButton
                    size="small"
                    onClick={() => setExpanded(!expanded)}
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    {expanded ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                )}
                {onMarkAsRead && !read && (
                  <IconButton
                    size="small"
                    onClick={() => onMarkAsRead(id)}
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    <CheckCircle fontSize="small" />
                  </IconButton>
                )}
                {onDismiss && (
                  <IconButton
                    size="small"
                    onClick={() => onDismiss(id)}
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </Box>
            <Collapse in={!expandable || expanded}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                {message}
              </Typography>
            </Collapse>
            <Box display="flex" alignItems="center" gap={1} mt={1}>
              <Chip
                label={type}
                size="small"
                variant="outlined"
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  borderColor: theme.palette[getAlertSeverity()].main,
                  color: theme.palette[getAlertSeverity()].main,
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.text.secondary,
                  fontSize: '0.7rem'
                }}
              >
                {formatTimestamp(timestamp)}
              </Typography>
              {read && (
                <Chip
                  label="Read"
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    backgroundColor: alpha(theme.palette.success.main, 0.1),
                    color: theme.palette.success.main,
                  }}
                />
              )}
            </Box>
            {actions && (
              <Box mt={2}>
                {actions}
              </Box>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};