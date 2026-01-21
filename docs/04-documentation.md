# Document New Services & Plugins

## Overview
This document describes the newly implemented real-time services and the required plugins.

## Services

### Users Service (SSE)
- Endpoint: `/api/users`
- Streams user objects every 10 seconds.
- Data format: `{ type: 'users', data: [...], timestamp: number }`
- Example consumption:
  ```ts
  const es = new EventSource('/api/users');
  es.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.type === 'users') {
      setUsers(msg.data);
    }
  };
  ```

### Notifications Service (SSE)
- Endpoint: `/api/notifications`
- Streams notification objects every 15 seconds.
- Data format: `{ type: 'notifications', data: [...], timestamp: number }`
- Example consumption:
  ```ts
  const es = new EventSource('/api/notifications');
  es.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.type === 'notifications') {
      setNotifications(msg.data);
    }
  };
  ```

### Analytics Service (SSE)
- Endpoint: `/api/analytics`
- Streams analytics metrics every 5 seconds.
- Data format: `{ type: 'analytics', data: {...}, timestamp: number }`
- Example consumption:
  ```ts
  const es = new EventSource('/api/analytics');
  es.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.type === 'analytics') {
      setAnalytics(msg.data);
    }
  };
  ```

## Plugins

- **socket.io-client**: Used for fallback WebSocket connections and real-time features.
- **axios**: HTTP client for fallback polling or non-SSE calls.
- **supabase-js**: Optional real-time database integration.
- **date-fns**: Date formatting utilities.

## Installation
```bash
pnpm add socket.io-client axios supabase-js date-fns
```

## Usage Examples
- Import axios: `import axios from 'axios'`
- Initialize socket.io-client: `const socket = io('/socket');`
- Use supabase client: `createClient(supabaseUrl, supabaseAnonKey)`
- Format dates with date-fns: `format(new Date(), 'yyyy-MM-dd')`

## Verification
- Ensure all streams are reachable via browser dev tools.
- Verify network events show regular SSE updates.

*Prepared by: Development Agent*