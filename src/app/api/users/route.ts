

interface User {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: string;
  activity: string;
}

export async function GET() {
  const encoder = new TextEncoder();

  const getSystemUsers = async (): Promise<User[]> => {
    try {
      // Get system processes as "users" (active processes)
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      // Get process list (using ps command)
      const { stdout } = await execAsync('ps aux --no-headers | head -10');
      const lines = stdout.trim().split('\n').filter(line => line.trim());

      const users: User[] = lines.map((line) => {
        const parts = line.trim().split(/\s+/);
        const user = parts[0];
        const pid = parts[1];
        const cpu = parseFloat(parts[2]);
        const mem = parseFloat(parts[3]);
        const command = parts.slice(10).join(' ') || 'Unknown';

        // Determine status based on CPU usage
        let status: 'online' | 'offline' | 'away' = 'online';
        if (cpu < 0.1) status = 'away';
        if (cpu === 0) status = 'offline';

        return {
          id: pid,
          name: `${user} (${command.substring(0, 20)}...)`,
          status,
          lastSeen: new Date().toISOString(),
          activity: `PID ${pid}: ${cpu}% CPU, ${mem}% MEM`
        };
      });

      return users;
    } catch (error) {
      console.error('Failed to get system processes:', error);
      // Fallback to mock data
      return [
        { id: '1', name: 'System Process 1', status: 'online', lastSeen: new Date().toISOString(), activity: 'Active system process' },
        { id: '2', name: 'System Process 2', status: 'away', lastSeen: new Date(Date.now() - 3600000).toISOString(), activity: 'Idle process' },
        { id: '3', name: 'System Process 3', status: 'online', lastSeen: new Date().toISOString(), activity: 'Processing requests' },
      ];
    }
  };

  const stream = new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const users = await getSystemUsers();

          const data = {
            type: 'users',
            data: users,
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