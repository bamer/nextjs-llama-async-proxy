'use client';

import { useWebSocket } from '@/hooks/useWebSocket';
import { useEffect, useState } from 'react';
import { Button, Card, CardContent, Typography, Box, Chip } from '@mui/material';

export function WebSocketTestComponent() {
  const [manualMessages, setManualMessages] = useState<any[]>([]);
  
  const { 
    isConnected, 
    messages, 
    sendMessage, 
    disconnect,
    reconnect 
  } = useWebSocket({
    url: 'ws://localhost:3000/api/websocket',
    reconnect: true,
    reconnectInterval: 3000,
    maxReconnectAttempts: 5,
    onOpen: () => console.log('WebSocket connected!'),
    onClose: () => console.log('WebSocket disconnected'),
    onError: (error) => console.error('WebSocket error:', error)
  });

  // Send test messages
  const sendTestMessage = (type: string) => {
    const success = sendMessage(type, { test: true, timestamp: Date.now() });
    if (success) {
      setManualMessages(prev => [...prev, { type, timestamp: Date.now(), status: 'sent' }]);
    } else {
      console.warn('Failed to send message - not connected');
    }
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          WebSocket Test Component
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <Chip 
            label={isConnected ? 'Connected' : 'Disconnected'} 
            color={isConnected ? 'success' : 'error'}
            variant="outlined"
          />
          <Chip 
            label={`Messages: ${messages.length}`}
            color="primary"
            variant="outlined"
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => sendTestMessage('getMetrics')}
            disabled={!isConnected}
          >
            Request Metrics
          </Button>
          
          <Button 
            variant="contained" 
            color="secondary" 
            onClick={() => sendTestMessage('getModels')}
            disabled={!isConnected}
          >
            Request Models
          </Button>
          
          <Button 
            variant="outlined" 
            color="error" 
            onClick={disconnect}
          >
            Disconnect
          </Button>
          
          <Button 
            variant="outlined" 
            color="success" 
            onClick={reconnect}
          >
            Reconnect
          </Button>
        </Box>

        <Typography variant="subtitle1" gutterBottom>
          Received Messages:
        </Typography>
        
        {messages.length === 0 ? (
          <Typography color="text.secondary">No messages received yet</Typography>
        ) : (
          <Box sx={{ maxHeight: '300px', overflow: 'auto', border: '1px solid #eee', p: 2, borderRadius: 1 }}>
            {messages.map((message, index) => (
              <Card key={index} variant="outlined" sx={{ mb: 1 }}>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(message.timestamp || Date.now()).toLocaleTimeString()}
                  </Typography>
                  <Typography variant="body2">
                    <strong>{message.type}:</strong> {JSON.stringify(message.data)}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        {manualMessages.length > 0 && (
          <>
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
              Manual Messages Sent:
            </Typography>
            <Box sx={{ maxHeight: '200px', overflow: 'auto', border: '1px solid #eee', p: 2, borderRadius: 1 }}>
              {manualMessages.map((msg, index) => (
                <Typography key={index} variant="body2">
                  {new Date(msg.timestamp).toLocaleTimeString()} - {msg.type} ({msg.status})
                </Typography>
              ))}
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}