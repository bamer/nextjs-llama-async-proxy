'use client';

import React from 'react';
import {
  Card,
  CardContent,
  Avatar,
  Typography,
  Box,
  Chip,
  useTheme,
  alpha
} from '@mui/material';
import {
  Person,
  Circle
} from '@mui/icons-material';

interface UserCardProps {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: string;
  activity: string;
  avatar?: string;
  onClick?: () => void;
}

export const UserCard: React.FC<UserCardProps> = ({
  name,
  status,
  lastSeen,
  activity,
  avatar,
  onClick
}) => {
  const theme = useTheme();

  const getStatusColor = () => {
    switch (status) {
      case 'online': return theme.palette.success.main;
      case 'away': return theme.palette.warning.main;
      case 'offline': return theme.palette.text.disabled;
      default: return theme.palette.text.disabled;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'online': return 'Active';
      case 'away': return 'Away';
      case 'offline': return 'Offline';
      default: return 'Unknown';
    }
  };

  const formatLastSeen = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4],
        },
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Box position="relative">
            <Avatar
              src={avatar}
              sx={{
                width: 48,
                height: 48,
                bgcolor: theme.palette.primary.main,
              }}
            >
              {!avatar && <Person />}
            </Avatar>
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 14,
                height: 14,
                borderRadius: '50%',
                backgroundColor: getStatusColor(),
                border: `2px solid ${theme.palette.background.paper}`,
              }}
            />
          </Box>
          <Box flex={1}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              {name}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                mb: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {activity}
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <Circle sx={{ fontSize: 8, color: getStatusColor() }} />
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.text.secondary,
                  fontSize: '0.7rem'
                }}
              >
                {getStatusText()} • {formatLastSeen(lastSeen)}
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};