import { NextRequest } from 'next/server';

interface User {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: string;
  activity: string;
}

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const mockUsers = [
            { id: '1', name: 'Alice Johnson', status: 'online', lastSeen: new Date().toISOString(), activity: 'Active in chat' },
            { id: '2', name: 'Bob Smith', status: 'away', lastSeen: new Date(Date.now() - 3600000).toISOString(), activity: 'Away for lunch' },
            { id: '3', name: 'Charlie Brown', status: 'online', lastSeen: new Date().toISOString(), activity: 'Processing requests' },
            { id: '4', name: 'Diana Prince', status: 'offline', lastSeen: new Date(Date.now() - 86400000).toISOString(), activity: 'Offline' },
            { id: '5', name: 'Eve Wilson', status: 'online', lastSeen: new Date().toISOString(), activity: 'Monitoring system' },
          ];

          // Simulate status changes
          mockUsers.forEach(user => {
            if (Math.random() > 0.7) {
              user.status = user.status === 'online' ? 'away' : 'online';
              user.lastSeen = new Date().toISOString();
            }
          });

          const data = {
            type: 'users',
            data: mockUsers,
            timestamp: Date.now()
          };

          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          
          await new Promise(resolve => setTimeout(resolve, 10000));
        }
      } catch (error) {
        controller.error(error);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}