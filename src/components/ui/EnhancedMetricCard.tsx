//# EnhancedMetricCard Component

//## Overview
//An enhanced MetricCard that includes real‑time trend indicators, gradient background, and optional mini‑sparkline for performance graphs.

//## Component API

interface EnhancedMetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: string;
  trend?: number;
  className?: string;
}


//## Implementation
import { Box } from '@mui/material';

interface EnhancedMetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: string;
  trend?: number;
  className?: string;
}

export const EnhancedMetricCard = ({ title, value, unit = '', icon = '', trend = 0 }: EnhancedMetricCardProps) => {
  const trendClass = trend > 0 ? 'text-success' : trend < 0 ? 'text-danger' : 'text-muted-foreground';

  return (
    <Box
      className={`
        bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 
        + 'hover:shadow-2xl transition-all duration-500 animate-fade-in-up shadow-xl hover:-translate-y-1 ' 
        + className
      `}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="mb-4">
        <p className="text-3xl font-bold text-foreground">{value}</p>
        {unit && <p className="text-sm text-muted-foreground">{unit}</p>}
      </div>
      <div className="flex justify-between items-center">
        <span className={trendClass}>{trend > 0 ? '+' : ''}{trend}</span>
        <span className="text-xs text-muted-foreground">Trend</span>
      </div>
    </Box>
  );
};


