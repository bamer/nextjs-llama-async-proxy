# LlamaProxy WebSocket Path Configuration

This document describes the WebSocket path configuration for the LlamaProxy server.

## WebSocket Path

**Path:** `/llamaproxws`

The Socket.IO server is mounted at the `/llamaproxws` path. This path must be preserved in all deployment configurations.

## Server Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LLAMAPROXWS_PORT` | 3000 | HTTP server port |
| `LLAMAPROXWS_PRESETS_DIR` | `./presets` | Directory for preset files |
| `LLAMAPROXWS_STARTUP_TIMEOUT_MS` | 15000 | Startup watchdog timeout (ms) |

### Proxy Configuration

When deploying behind a reverse proxy (nginx, Apache, Caddy, etc.), ensure the `/llamaproxws` path is **not** rewritten or redirected.

#### Nginx Example

```nginx
server {
    listen 80;
    server_name localhost;

    # WebSocket upgrades MUST be allowed for /llamaproxws
    location /llamaproxws/ {
        proxy_pass http://127.0.0.1:3000/llamaproxws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }

    # Static files
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }
}
```

#### Caddy Example

```caddy
localhost:80 {
    # WebSocket route - must be before static files
    reverse_proxy /llamaproxws/* localhost:3000 {
        header_upgrade Upgrade
        header_connection Upgrade
    }

    # Static files
    root * /var/www/html
    try_files {path} {path}/ /index.html
    file_server
}
```

#### Apache Example

```apache
<VirtualHost *:80>
    ServerName localhost

    # Enable WebSocket proxy
    ProxyRequests Off
    ProxyPreserveHost On

    <Location "/llamaproxws">
        ProxyPass "ws://127.0.0.1:3000/llamaproxws"
        ProxyPassReverse "ws://127.0.0.1:3000/llamaproxws"
        Require all granted
    </Location>

    # Static files
    DocumentRoot "/var/www/html"
    <Directory "/var/www/html">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

## Client Configuration

### Frontend (socket-client.js)

```javascript
const socketClient = new SocketClient({
  path: "/llamaproxws",
  transports: ["websocket"],
});
```

### Health Check

Run the health check script to verify the WebSocket path is correctly configured:

```bash
# With server running locally
node scripts/websocket-health-check.js http://localhost:3000

# With custom URL
WEBSOCKET_HEALTH_CHECK_URL=https://my-server.com node scripts/websocket-health-check.js
```

### CI Health Check

The CI pipeline includes a WebSocket health check job that runs after the build:

```bash
# GitHub Actions will run this automatically
pnpm run health:websocket
```

## Troubleshooting

### 404 on WebSocket Connection

If you see a 404 error when connecting to `/llamaproxws`:

1. Verify the server is running: `curl http://localhost:3000/llamaproxws`
2. Check proxy configuration is not rewriting the path
3. Verify no firewall is blocking the connection

### WebSocket Upgrade Failed

If the WebSocket upgrade fails:

1. Verify the proxy is configured for WebSocket upgrades
2. Check that `proxy_set_header Upgrade $http_upgrade` is set
3. Verify `proxy_set_header Connection "upgrade"` is set

### Connection Timeout

If connections timeout:

1. Increase `proxy_read_timeout` and `proxy_send_timeout`
2. Check network latency
3. Verify the server is not overloaded

## Security Considerations

1. **Path Preservation:** Never rewrite `/llamaproxws` to a different path
2. **WebSocket Security:** Use WSS (WebSocket Secure) in production
3. **Rate Limiting:** Implement rate limiting at the proxy level
4. **Connection Limits:** Configure appropriate connection limits
