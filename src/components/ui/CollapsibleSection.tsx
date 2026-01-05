"use client";

import { useState, ReactNode } from 'react';
import { Box, Typography, IconButton, Collapse } from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';

export interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  description?: string;
  level?: 'basic' | 'advanced' | 'expert';
}

export function CollapsibleSection({
  title,
  children,
  defaultExpanded = false,
  description,
  level = 'basic'
}: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const getLevelStyles = () => {
    switch (level) {
      case 'advanced':
        return {
          borderLeft: '4px solid #FFD700',
          backgroundColor: 'rgba(255, 215, 0, 0.05)'
        };
      case 'expert':
        return {
          borderLeft: '4px solid #FF6B6B',
          backgroundColor: 'rgba(255, 107, 107, 0.05)'
        };
      default:
        return {
          borderLeft: '4px solid #4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.05)'
        };
    }
  };

  return (
    <Box sx={{ mb: 2, ...getLevelStyles(), borderRadius: '4px' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 2,
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: 'action.hover'
          }
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <IconButton size="small" sx={{ mr: 1 }}>
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
        <Typography variant="subtitle1" sx={{ fontWeight: 'medium', flexGrow: 1 }}>
          {title}
        </Typography>
        {level !== 'basic' && (
          <Box
            sx={{
              px: 1.5,
              py: 0.5,
              borderRadius: '12px',
              backgroundColor: level === 'advanced' ? 'warning.light' : 'error.light',
              color: level === 'advanced' ? 'warning.dark' : 'error.dark',
              fontSize: '0.75rem',
              fontWeight: 'bold'
            }}
          >
            {level.toUpperCase()}
          </Box>
        )}
      </Box>

      {description && !expanded && (
        <Box sx={{ px: 6, pb: 2, color: 'text.secondary', fontSize: '0.875rem' }}>
          {description}
        </Box>
      )}

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box sx={{ px: 2, pb: expanded ? 2 : 0 }}>
          {children}
        </Box>
      </Collapse>
    </Box>
  );
}