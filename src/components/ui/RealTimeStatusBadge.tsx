import { Box, Typography, Chip, ChipProps } from '@mui/material';

interface RealTimeStatusBadgeProps {
  status: 'online' | 'offline' | 'idle' | 'error' | 'away';
  label?: string;
}

export const RealTimeStatusBadge = ({ status, label }: RealTimeStatusBadgeProps) => {
  const styleClasses: Record<RealTimeStatusBadgeProps['status'], string> = {
    online: 'bg-green-600 dark:bg-green-500 hover:bg-green-700 text-white',
    offline: 'bg-red-600 dark:bg-red-500 hover:bg-red-700 text-white',
    idle: 'bg-yellow-600 dark:bg-yellow-500 hover:bg-yellow-700 text-black',
    error: 'bg-rose-600 dark:bg-rose-500 hover:bg-rose-700 text-white',
    away: 'bg-yellow-600 dark:bg-yellow-500 hover:bg-yellow-700 text-black',
  };

  const chipColor: 'success' | 'error' | 'warning' | 'default' = 
    status === 'online' ? 'success' : 
    status === 'offline' ? 'error' : 
    status === 'idle' || status === 'away' ? 'default' : 'default';

  const chipProps: ChipProps = {
    label,
    color: chipColor,
    variant: 'filled',
  };

  const className = ['px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap', styleClasses[status]].join(' ');

  return (
    <Box className={className}>
      {label && <Typography component="span" className="mr-1">{label}</Typography>}
      {status === 'online' && (
        <Typography component="span" className="animate-pulse">Active</Typography>
      )}
      {status === 'offline' && (
        <Typography component="span" className="font-medium">Disconnected</Typography>
      )}
      {status === 'idle' && (
        <Typography component="span" className="italic">Idle</Typography>
      )}
      {status === 'error' && (
        <Typography component="span" className="font-medium">Error</Typography>
      )}
      {status === 'away' && (
        <Typography component="span" className="italic">Away</Typography>
      )}
      <Chip 
        {...chipProps} 
        aria-label={status} 
        className="self-center"
        sx={{ 
          fontSize: '0.75rem',
          fontWeight: 500,
          textTransform: 'capitalize',
          mr: 0.5,
          mb: 0.5
        }}
      />
    </Box>
  );
};