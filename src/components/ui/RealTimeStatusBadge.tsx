import { Box, Typography } from '@mui/material';

interface RealTimeStatusBadgeProps {
  status: 'online' | 'offline' | 'idle' | 'error' | 'away';
  label?: string;
}

export const RealTimeStatusBadge = ({ status, label }: RealTimeStatusBadgeProps) => {
  const baseStyle = 'px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap';
  
  const statusStyles: Record<RealTimeStatusBadgeProps['status'], string> = {
    online: 'bg-green-600 dark:bg-green-500 hover:bg-green-700 text-white',
    offline: 'bg-red-600 dark:bg-red-500 hover:bg-red-700 text-white',
    idle: 'bg-yellow-600 dark:bg-yellow-500 hover:bg-yellow-700 text-black',
    error: 'bg-rose-600 dark:bg-rose-500 hover:bg-rose-700 text-white',
    away: 'bg-yellow-600 dark:bg-yellow-500 hover:bg-yellow-700 text-black',
  };

  const statusTexts: Record<RealTimeStatusBadgeProps['status'], string> = {
    online: 'Active',
    offline: 'Disconnected',
    idle: 'Idle',
    error: 'Error',
    away: 'Away',
  };

  return (
    <Box className={`${baseStyle} ${statusStyles[status]}`}>
      {label && <Typography component="span" className="mr-1">
        {label}
      </Typography>}
      <Typography component="span" className="font-medium">
        {statusTexts[status]}
      </Typography>
      {status === 'online' && (
        <Typography component="span" className="animate-pulse ml-1">
          Active
        </Typography>
      )}
    </Box>
  );
};