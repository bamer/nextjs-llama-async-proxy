# Deployment Guide - Next.js Llama Async Proxy

Complete deployment guide for Next.js Llama Async Proxy, covering local, cloud, and production deployments.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Development Deployment](#development-deployment)
- [Local Production Deployment](#local-production-deployment)
- [Container Deployment](#container-deployment)
- [Cloud Deployment](#cloud-deployment)
- [Reverse Proxy Setup](#reverse-proxy-setup)
- [Production Monitoring](#production-monitoring)
- [Security Considerations](#security-considerations)
- [Backup and Recovery](#backup-and-recovery)
- [Troubleshooting Deployment](#troubleshooting-deployment)

---

## Overview

This guide covers deployment strategies for Next.js Llama Async Proxy in various environments.

### Deployment Options

1. **Development** - Local development with hot reload
2. **Local Production** - Production server on local machine
3. **Docker** - Containerized deployment
4. **Cloud Platforms** - Vercel, Railway, Render, AWS, GCP, Azure
5. **Kubernetes** - Orchestration for scalability

### Architecture

```
User → Web Interface (Next.js 16) → WebSocket/REST API → Llama Server → Model Files
                                                    ↓
                                            Winston Logs
                                                    ↓
                                            SQLite Database
```

---

## Prerequisites

### System Requirements

| Component | Minimum | Recommended |
|-----------|----------|-------------|
| **CPU** | 4 cores | 8+ cores |
| **RAM** | 8 GB | 16 GB+ |
| **Storage** | 50 GB SSD | 100 GB+ SSD |
| **GPU** | None (CPU-only) | 8 GB+ VRAM |
| **Network** | 10 Mbps | 1 Gbps |

### Software Dependencies

- **Node.js**: 18.0 or higher (24.11.1 recommended)
- **llama-server**: Compiled binary for your system
- **GGUF models**: Pre-downloaded AI models
- **Package manager**: pnpm (recommended)

### Operating Systems

- ✅ **Linux** (Ubuntu 22.04+, Debian 12+)
- ✅ **macOS** (Monterey 12+)
- ✅ **Windows** (Windows 10/11 with WSL2)

### Hardware Considerations

#### CPU-Only Deployment
- **Models**: Small to medium (1-7B parameters)
- **Performance**: Slower inference
- **Cost**: Lower hardware requirements
- **Use case**: Testing, development, small-scale usage

#### GPU-Accelerated Deployment
- **Models**: Large models (7B+ parameters)
- **Performance**: Much faster inference
- **Cost**: Higher hardware requirements
- **Use case**: Production, heavy usage, large models

---

## Development Deployment

### Quick Start

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd nextjs-llama-async-proxy
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Configure llama-server**
   Create `llama-server-config.json`:
   ```json
   {
     "host": "localhost",
     "port": 8134,
     "basePath": "./models",
     "serverPath": "/path/to/llama-server",
     "ctx_size": 8192,
     "batch_size": 512,
     "threads": -1,
     "gpu_layers": -1
   }
   ```

4. **Start Development Server**
   ```bash
   pnpm dev
   ```

5. **Access Application**
   Open `http://localhost:3000` in your browser

### Development Environment Variables

Create `.env.local`:

```env
NODE_ENV=development
PORT=3000
WEBSOCKET_PATH=/llamaproxws
METRICS_INTERVAL=10000
MODELS_INTERVAL=30000
LOGS_INTERVAL=15000
LOG_LEVEL=debug
LOG_COLORS=true
LOG_VERBOSE=true
```

### Development Workflow

```bash
# Start dev server
pnpm dev

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Type checking
pnpm type:check

# Linting
pnpm lint
pnpm lint:fix
```

---

## Local Production Deployment

### Production Build

1. **Build Application**
   ```bash
   pnpm build
   ```

   **Note**: Next.js 16 uses Turbopack for building (not webpack).

2. **Production Environment Variables**

   Create `.env.production`:
   ```env
   NODE_ENV=production
   PORT=3000
   WEBSOCKET_PATH=/llamaproxws
   METRICS_INTERVAL=15000
   MODELS_INTERVAL=60000
   LOGS_INTERVAL=30000
   LOG_LEVEL=info
   LOG_COLORS=false
   LOG_VERBOSE=false
   ```

3. **Start Production Server**
   ```bash
   pnpm start
   ```

### Process Management

#### Using PM2 (Recommended)

1. **Install PM2**
   ```bash
   npm install -g pm2
   ```

2. **Create PM2 Configuration**
   `ecosystem.config.js`:
   ```javascript
   module.exports = {
     apps: [{
       name: 'llama-proxy',
       script: 'server.js',
       interpreter: 'node',
       interpreter_args: '--require tsx/cjs',
       instances: 1,
       autorestart: true,
       watch: false,
       max_memory_restart: '2G',
       env: {
         NODE_ENV: 'production',
         PORT: 3000,
         WEBSOCKET_PATH: '/llamaproxws'
       },
       error_file: './logs/err.log',
       out_file: './logs/out.log',
       log_file: './logs/combined.log',
       time: true,
       merge_logs: true
     }]
   };
   ```

3. **Start with PM2**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

4. **Monitor with PM2**
   ```bash
   pm2 logs llama-proxy
   pm2 monit
   pm2 status
   ```

5. **Common PM2 Commands**
   ```bash
   pm2 restart llama-proxy  # Restart
   pm2 stop llama-proxy     # Stop
   pm2 delete llama-proxy   # Remove
   pm2 reload llama-proxy   # Zero-downtime reload
   pm2 reset llama-proxy    # Reset restart count
   ```

#### Using systemd

1. **Create Service File**
   `/etc/systemd/system/llama-proxy.service`:
   ```ini
   [Unit]
   Description=Next.js Llama Async Proxy
   After=network.target

   [Service]
   Type=simple
   User=llama-user
   Group=llama-user
   WorkingDirectory=/opt/llama-proxy
   ExecStart=/usr/bin/tsx server.js
   Restart=always
   RestartSec=10
   Environment=NODE_ENV=production
   Environment=PORT=3000
   Environment=WEBSOCKET_PATH=/llamaproxws

   # Logging
   StandardOutput=journal
   StandardError=journal
   SyslogIdentifier=llama-proxy

   # Security
   NoNewPrivileges=yes
   PrivateTmp=yes
   ProtectSystem=strict
   ProtectHome=yes
   ReadWritePaths=/opt/llama-proxy/logs
   ReadWritePaths=/opt/llama-proxy/models

   [Install]
   WantedBy=multi-user.target
   ```

2. **Create User**
   ```bash
   sudo useradd -r -s /bin/false llama-proxy
   sudo mkdir -p /opt/llama-proxy
   sudo chown -R llama-proxy:llama-proxy /opt/llama-proxy
   ```

3. **Enable and Start Service**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable llama-proxy
   sudo systemctl start llama-proxy
   sudo systemctl status llama-proxy
   ```

4. **View Logs**
   ```bash
   sudo journalctl -u llama-proxy -f
   ```

5. **Common systemctl Commands**
   ```bash
   sudo systemctl restart llama-proxy  # Restart
   sudo systemctl stop llama-proxy     # Stop
   sudo systemctl reload llama-proxy   # Reload (if supported)
   sudo systemctl status llama-proxy   # Status
   ```

### Production Setup Checklist

- [ ] Install Node.js 18+
- [ ] Install pnpm
- [ ] Clone repository
- [ ] Install dependencies (`pnpm install`)
- [ ] Build application (`pnpm build`)
- [ ] Configure `llama-server-config.json`
- [ ] Create `.env.production`
- [ ] Set up process manager (PM2 or systemd)
- [ ] Configure firewall rules
- [ ] Set up reverse proxy (nginx/caddy)
- [ ] Configure SSL/TLS
- [ ] Set up log rotation
- [ ] Configure backups
- [ ] Monitor application logs

---

## Container Deployment

### Docker Setup

#### Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build application (Turbopack)
RUN pnpm build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Install dependencies
RUN npm install -g pnpm tsx

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 llama-proxy

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/server.js ./server.js

# Create necessary directories
RUN mkdir -p logs models
RUN chown -R llama-proxy:nodejs /app

USER llama-proxy

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV WEBSOCKET_PATH=/llamaproxws

CMD ["node", "--require", "tsx/cjs", "server.js"]
```

#### Docker Compose

```yaml
version: '3.8'

services:
  llama-proxy:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - WEBSOCKET_PATH=/llamaproxws
      - LOG_LEVEL=info
    volumes:
      - ./models:/app/models:ro
      - ./logs:/app/logs
      - ./llama-server-config.json:/app/llama-server-config.json:ro
    depends_on:
      - llama-server
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  llama-server:
    image: llama-server:latest
    build:
      context: ./llama.cpp
      dockerfile: Dockerfile
    ports:
      - "8134:8134"
    volumes:
      - ./models:/models:ro
    environment:
      - LLAMA_MODEL=/models/your-model.gguf
      - LLAMA_CTX_SIZE=8192
      - LLAMA_N_GPU_LAYERS=-1
      - LLAMA_PORT=8134
    restart: unless-stopped
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

volumes:
  models:
  logs:
```

#### Build and Run

```bash
# Build image
docker build -t llama-proxy:latest .

# Run container
docker run -d \
  --name llama-proxy \
  -p 3000:3000 \
  -v $(pwd)/models:/app/models:ro \
  -v $(pwd)/logs:/app/logs \
  -v $(pwd)/llama-server-config.json:/app/llama-server-config.json:ro \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e WEBSOCKET_PATH=/llamaproxws \
  llama-proxy:latest

# View logs
docker logs -f llama-proxy

# Stop container
docker stop llama-proxy

# Remove container
docker rm llama-proxy
```

#### Docker Compose Commands

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart services
docker-compose restart

# Rebuild and restart
docker-compose up -d --build
```

### Podman (Alternative to Docker)

```bash
# Build with Podman
podman build -t llama-proxy .

# Run with GPU support
podman run -d \
  --name llama-proxy \
  --device nvidia.com/gpu=all \
  -p 3000:3000 \
  -v $(pwd)/models:/app/models:ro \
  -v $(pwd)/logs:/app/logs \
  -e NODE_ENV=production \
  llama-proxy
```

---

## Cloud Deployment

### Vercel

**Note**: Vercel deployment is limited for full-stack application due to server-side requirements. Use for frontend-only or combine with separate backend deployment.

1. **Connect Repository**
   - Import your GitHub repository to Vercel
   - Configure build settings

2. **Vercel Configuration**
   `vercel.json`:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "package.json",
         "use": "@vercel/next"
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "/api/$1"
       },
       {
         "src": "/(.*)",
         "dest": "/$1"
       }
     ],
     "env": {
       "NODE_ENV": "production",
       "PORT": "3000"
     }
   }
   ```

3. **Environment Variables**
   Set in Vercel dashboard:
   ```
   WEBSOCKET_PATH=/llamaproxws
   LOG_LEVEL=info
   ```

### Railway

1. **Deploy to Railway**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli

   # Login and deploy
   railway login
   railway deploy
   ```

2. **Railway Configuration**
   - Set environment variables in Railway dashboard
   - Configure build and start commands
   - Set up persistent volumes for models and logs
   - Build command: `pnpm build`
   - Start command: `pnpm start`

### Render

1. **Create Web Service**
   - Connect GitHub repository
   - Choose Node.js runtime (18+)

2. **Render Configuration**
   - **Build Command**: `pnpm install && pnpm build`
   - **Start Command**: `pnpm start`
   - **Environment Variables**:
     ```
     NODE_ENV=production
     PORT=3000
     WEBSOCKET_PATH=/llamaproxws
     ```
   - **Disk Volume**: 100 GB for models

### AWS EC2

#### EC2 Instance Setup

1. **Launch EC2 Instance**
   ```bash
   # Ubuntu 22.04 LTS, t3.medium or larger
   aws ec2 run-instances \
     --image-id ami-0abcdef1234567890 \
     --instance-type t3.large \
     --key-name your-key-pair \
     --security-groups llama-proxy-sg
   ```

2. **Security Group Configuration**
   ```bash
   aws ec2 authorize-security-group-ingress \
     --group-id sg-12345678 \
     --protocol tcp \
     --port 22 \
     --cidr 0.0.0.0/0

   aws ec2 authorize-security-group-ingress \
     --group-id sg-12345678 \
     --protocol tcp \
     --port 3000 \
     --cidr 0.0.0.0/0
   ```

3. **Instance Configuration**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y

   # Install Node.js 18
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install pnpm
   npm install -g pnpm

   # Install llama-server dependencies
   sudo apt install -y build-essential cmake git

   # Clone and setup application
   git clone <repository-url>
   cd nextjs-llama-async-proxy
   pnpm install
   pnpm build
   ```

### Google Cloud Platform

#### GCE Instance

1. **Create VM Instance**
   ```bash
   gcloud compute instances create llama-proxy \
     --zone=us-central1-a \
     --machine-type=n1-standard-4 \
     --network-tier=PREMIUM \
     --maintenance-policy=MIGRATE \
     --image=ubuntu-2204-jammy-v20241201 \
     --image-project=ubuntu-os-cloud \
     --boot-disk-size=100GB \
     --boot-disk-type=pd-standard \
     --boot-disk-device-name=llama-proxy
   ```

2. **Firewall Configuration**
   ```bash
   gcloud compute firewall-rules create allow-llama-proxy \
     --allow tcp:3000 \
     --source-ranges 0.0.0.0/0 \
     --description "Allow llama-proxy access"
   ```

### Microsoft Azure

#### Azure VM

1. **Create Virtual Machine**
   ```bash
   az vm create \
     --resource-group llama-proxy-rg \
     --name llama-proxy-vm \
     --image Ubuntu2204 \
     --admin-username azureuser \
     --generate-ssh-keys \
     --size Standard_D4s_v3 \
     --public-ip-sku Standard
   ```

2. **Network Security Group**
   ```bash
   az network nsg rule create \
     --resource-group llama-proxy-rg \
     --nsg-name llama-proxy-nsg \
     --name allow-llama-proxy \
     --priority 1001 \
     --destination-port-ranges 3000 \
     --access Allow \
     --protocol Tcp \
     --description "Allow llama-proxy access"
   ```

---

## Reverse Proxy Setup

### Nginx

#### Installation

```bash
# Ubuntu/Debian
sudo apt install nginx

# Start and enable
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### Configuration

`/etc/nginx/sites-available/llama-proxy`:
```nginx
upstream llama_proxy_backend {
    server 127.0.0.1:3000;
    keepalive 32;
}

server {
    listen 80;
    server_name your-domain.com;

    # Redirect to HTTPS (recommended)
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL certificates (obtain from Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Proxy settings
    location / {
        proxy_pass http://llama_proxy_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket support
    location /llamaproxws {
        proxy_pass http://llama_proxy_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
}
```

#### Enable Configuration

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/llama-proxy /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### Caddy

#### Installation

```bash
# Ubuntu/Debian
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

#### Configuration

`/etc/caddy/Caddyfile`:
```caddyfile
your-domain.com {
    # Automatic HTTPS
    encode zstd gzip

    # Security headers
    header {
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        Referrer-Policy "no-referrer-when-downgrade"
    }

    # Reverse proxy to Next.js
    reverse_proxy 127.0.0.1:3000

    # WebSocket support
    @websockets {
        header Connection Upgrade
        header Upgrade websocket
    }

    reverse_proxy @websockets 127.0.0.1:3000
}
```

### SSL/TLS with Let's Encrypt

```bash
# Install certbot
sudo apt install certbot

# Get certificate
sudo certbot certonly --standalone -d your-domain.com

# Configure automatic renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## Production Monitoring

### Health Checks

```bash
# HTTP health check
curl http://localhost:3000/api/health

# Detailed status
curl http://localhost:3000/api/status
```

### Log Monitoring

```bash
# Application logs
tail -f logs/application-$(date +%Y-%m-%d).log

# Error logs
tail -f logs/errors-$(date +%Y-%m-%d).log

# PM2 logs (if using PM2)
pm2 logs llama-proxy

# Systemd logs (if using systemd)
sudo journalctl -u llama-proxy -f
```

### Metrics Monitoring

Use the Monitoring page in the web interface:
- CPU usage over time
- Memory consumption trends
- GPU utilization (if available)
- Request throughput
- Model performance metrics

### External Monitoring Tools

- **Grafana + Prometheus**: Custom metrics dashboards
- **DataDog**: Infrastructure monitoring
- **New Relic**: APM and monitoring
- **UptimeRobot**: External uptime monitoring

---

## Security Considerations

### Current Security State

**Important**: Current implementation does not include authentication or encryption features.

### Recommended Security Practices

1. **Network Security**
   - Run on trusted networks only
   - Use firewall to restrict access
   - Consider VPN for remote access

2. **Reverse Proxy**
   - Use nginx/caddy as front-end
   - Enable SSL/TLS encryption
   - Add security headers

3. **Access Control**
   - Restrict to specific IPs
   - Use VPN for remote access
   - Monitor access logs

4. **Updates**
   - Keep dependencies updated
   - Apply security patches promptly
   - Monitor security advisories

### Future Security Features

- JWT-based authentication
- API rate limiting
- IP whitelist/blacklist
- Audit logging
- HTTPS/TLS enforcement

---

## Backup and Recovery

### Configuration Backup

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/opt/backups/llama-proxy"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup configuration
cp llama-server-config.json $BACKUP_DIR/config_$DATE.json

# Backup model templates
cp src/config/model-templates.json $BACKUP_DIR/templates_$DATE.json

# Backup database
pnpm db:export

# Backup environment files
cp .env.production $BACKUP_DIR/env_$DATE.env 2>/dev/null

# Backup logs
tar -czf $BACKUP_DIR/logs_$DATE.tar.gz logs/

# Clean old backups (keep last 7 days)
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*.env" -mtime +7 -delete
find $BACKUP_DIR -name "*.json" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/config_$DATE.json"
```

### Automated Backups

```bash
# Add to crontab
crontab -e
# 0 2 * * * /opt/llama-proxy/backup.sh
```

### Recovery

```bash
#!/bin/bash
# restore.sh

BACKUP_DIR="/opt/backups/llama-proxy"
BACKUP_DATE=$1

if [ -z "$BACKUP_DATE" ]; then
  echo "Usage: ./restore.sh <YYYYMMDD_HHMMSS>"
  exit 1
fi

# Restore configuration
cp $BACKUP_DIR/config_$BACKUP_DATE.json llama-server-config.json

# Restore templates
cp $BACKUP_DIR/templates_$BACKUP_DATE.json src/config/model-templates.json

# Restore database
cp $BACKUP_DIR/llama-dashboard-backup.db ./data/llama-dashboard.db

# Restore environment
cp $BACKUP_DIR/env_$BACKUP_DATE.env .env.production

echo "Restore completed"
```

---

## Troubleshooting Deployment

### Port Conflicts

```bash
# Check what's using port 3000
sudo lsof -i :3000
sudo netstat -tulpn | grep :3000

# Kill process
sudo kill -9 <PID>
```

### Memory Issues

```bash
# Check memory usage
free -h
top -o %MEM

# Check application memory
pm2 monit
```

### Permission Issues

```bash
# Fix permissions
sudo chown -R llama-user:llama-user /opt/llama-proxy
sudo chmod -R 755 /opt/llama-proxy
sudo chmod 644 /opt/llama-proxy/llama-server-config.json
```

### Startup Failures

```bash
# Check systemd status
sudo systemctl status llama-proxy

# Check logs
sudo journalctl -u llama-proxy -f

# Check PM2 logs
pm2 logs llama-proxy
```

### Network Issues

```bash
# Test connectivity
curl http://localhost:3000/api/health

# Test WebSocket
wscat -c ws://localhost:3000/llamaproxws

# Check firewall
sudo ufw status
sudo iptables -L -n
```

---

**Deployment Guide - Next.js Llama Async Proxy**
**Version 0.2.0 - December 30, 2025**
