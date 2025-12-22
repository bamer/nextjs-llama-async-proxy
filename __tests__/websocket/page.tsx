'use client';

import { WebSocketTestComponent } from '__tests__/websocket/WebSocketTestComponent';
import { Typography, Container, Box } from '@mui/material';
import { MainLayout } from '@/components/layout/main-layout';

export default function WebSocketTestPage() {
  return (
    <MainLayout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            WebSocket Integration Test
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            This page tests the WebSocket hook and server integration. The component below 
            demonstrates real-time WebSocket communication with automatic reconnection.
          </Typography>
        </Box>

        <WebSocketTestComponent />

        <Box sx={{ mt: 4, p: 3, bg: 'background.paper', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Implementation Details
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>WebSocket Hook:</strong> Custom hook that handles connection, reconnection, 
            and message processing with proper TypeScript typing.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>WebSocket Server:</strong> Proper server implementation with single connection 
            per client, async message handling, and efficient resource management.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>Integration:</strong> Seamless integration between client and server with 
            proper message routing and error handling.
          </Typography>
        </Box>
      </Container>
    </MainLayout>
  );
}