# Production Setup Guide

## Package Manager: pnpm (Required)

**This project uses pnpm exclusively. Do NOT use npm or yarn.**

Install pnpm if you don't have it:
```bash
npm install -g pnpm
```

Verify installation:
```bash
pnpm --version  # Should be 9.x or higher
```

## Development vs Production

### Development Mode
```bash
pnpm dev
```
- Starts Next.js dev server + Express + Socket.IO on port 3000
- Mock data available as fallback
- Hot reload enabled
- Useful for testing and development

### Production Build
```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

For production with specific port:
```bash
PORT=8080 pnpm start
```

## Configuration

### Environment Variables

Create `.env.local` file in project root:

```env
# Frontend Configuration
NEXT_PUBLIC_WS_URL=ws://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api

# Server Configuration
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
```

### Next.js Configuration

The application uses `next.config.ts` with:
- Standalone output mode
- Emotion/styled-components compilation
- Production source maps disabled
- Security headers configured
- CORS enabled for WebSocket

## Architecture

### Server Structure (server.js)

The application uses an integrated Express + Socket.IO architecture:

```javascript
// server.js
- HTTP Server (Express)
  - Next.js request handler
  - WebSocket path: /llamaproxws
  - Socket.IO with connection state recovery
  - CORS enabled for all origins
  - Automatic metrics/models/logs broadcasting
```

### Update Intervals (Configurable in server.js)

```javascript
const UPDATE_CONFIG = {
  METRICS_INTERVAL: 10000,  // 10 seconds
  MODELS_INTERVAL: 30000,   // 30 seconds
  LOGS_INTERVAL: 15000,     // 15 seconds
};
```

## Deployment

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy files
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Build
RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
```

Build and run:
```bash
docker build -t llama-proxy .
docker run -p 3000:3000 llama-proxy
```

### Vercel (Recommended for Next.js)

1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_WS_URL`
   - `NEXT_PUBLIC_API_BASE_URL`
3. Deploy automatically on push

**Note**: WebSocket on Vercel requires Vercel Functions or a separate service.

### Self-Hosted (VPS/Dedicated Server)

1. Install Node.js 18+ and pnpm
2. Clone repository
3. Install dependencies: `pnpm install --frozen-lockfile`
4. Build: `pnpm build`
5. Use process manager (PM2, systemd, etc.)

#### PM2 Configuration

Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [
    {
      name: "llama-proxy",
      script: "./server.js",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      instances: 1,
      watch: false,
      max_memory_restart: "500M",
    },
  ],
};
```

Start with PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Nginx Reverse Proxy

```nginx
upstream llama_proxy {
    server localhost:3000;
}

server {
    listen 80;
    server_name your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # WebSocket support
    location / {
        proxy_pass http://llama_proxy;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Socket.IO specific path
    location /llamaproxws {
        proxy_pass http://llama_proxy;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_buffering off;
    }
}
```

## Performance Optimization

### Build Optimization
- Next.js automatically optimizes builds with Turbopack
- Images are optimized to AVIF/WebP formats
- CSS optimization enabled
- Console logs removed in production
- Source maps disabled

### Runtime Optimization
- `standalone` output for minimal bundle
- Helmet for security headers
- Compression enabled by default
- Emotion compiler configured
- Connection state recovery for WebSocket

### Monitoring

The application includes built-in logging:
```javascript
// Server logs to console
logger.info('Server started');
logger.error('Connection failed');

// Access logs via monitoring endpoint
GET /api/monitoring - Current metrics
GET /api/monitoring/history - Historical data
```

## Security Best Practices

1. **Environment Variables**:
   - Never commit `.env.local`
   - Use `.env.example` for documentation
   - Set different values per environment

2. **WebSocket Security**:
   - Use `wss://` (secure WebSocket) in production
   - Validate incoming messages
   - Implement rate limiting if needed
   - Set appropriate CORS policies

3. **Headers Security**:
   - X-Content-Type-Options: nosniff
   - X-Frame-Options: SAMEORIGIN
   - X-XSS-Protection: 1; mode=block

4. **No Authentication (By Design)**:
   - This project has no authentication layer
   - Use a reverse proxy for authentication if needed
   - Consider VPN/private network access for production

## Troubleshooting

### Port Already in Use
```bash
# Use different port
PORT=3001 pnpm start

# Or kill the process on port 3000
lsof -i :3000
kill -9 <PID>
```

### WebSocket Connection Failed
- Check `NEXT_PUBLIC_WS_URL` matches your deployment URL
- Verify reverse proxy passes WebSocket headers
- Check firewall rules allow WebSocket
- Review server logs for errors

### High Memory Usage
- Check `max_memory_restart` in PM2 config
- Monitor Socket.IO client count
- Review update intervals in `server.js`
- Consider horizontal scaling

### Build Fails
```bash
# Clean rebuild
rm -rf .next node_modules pnpm-lock.yaml
pnpm install --frozen-lockfile
pnpm build
```

### TypeScript Errors
```bash
pnpm type:check
```

## Monitoring & Logging

### Server Logs
```bash
# With PM2
pm2 logs llama-proxy

# Direct stderr/stdout
NODE_ENV=production pnpm start 2>&1 | tee server.log
```

### Application Monitoring
```javascript
// Available metrics endpoints
GET /api/monitoring          // Current metrics
GET /api/monitoring/history  // Historical data
WebSocket: /llamaproxws      // Real-time streaming
```

## Scaling

### Horizontal Scaling
1. Multiple Node.js instances behind load balancer
2. Shared state via Redis (if needed)
3. Sticky sessions for WebSocket connections
4. Load balancer configuration for `/llamaproxws`

### Database Integration
The application uses in-memory caching with Node Cache. For production:
1. Replace Node Cache with Redis for shared state
2. Implement database layer for persistence
3. Add message queue (RabbitMQ, Bull, etc.) for async tasks

## Maintenance

### Regular Tasks
- Monitor disk space for logs
- Update dependencies: `pnpm update`
- Backup configuration files
- Rotate logs regularly
- Monitor WebSocket connections

### Update Process
```bash
# Update all dependencies
pnpm update

# Update specific package
pnpm update <package-name>

# Rebuild and restart
pnpm build
pnpm start
```

## Support & Documentation

- [README.md](README.md) - Project overview
- [AGENTS.md](AGENTS.md) - Development guidelines
- [CONFIGURATION.md](CONFIGURATION.md) - Configuration options
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues
- [SECURITY_NOTICE.md](SECURITY_NOTICE.md) - Security information
