# Deployment Guide - Next.js Llama Async Proxy

Comprehensive guide for deploying Next.js Llama Async Proxy in various environments, from development to production.

## Overview

This guide covers deployment strategies for Next.js Llama Async Proxy, including containerization, cloud deployment, and traditional server setups.

## Prerequisites

### System Requirements
- **Node.js**: 18.0 or higher (24.11.1 recommended)
- **Memory**: Minimum 4GB RAM, recommended 16GB+
- **Storage**: 50GB+ for models and logs
- **Network**: Stable internet connection
- **GPU**: Optional but recommended for performance

### Software Dependencies
- **llama-server binary**: Compatible with your system architecture
- **GGUF model files**: Pre-downloaded AI models
- **Package manager**: pnpm (recommended) or npm/yarn
- **tsx**: TypeScript runtime for server execution

## Development Deployment

### Local Development Setup

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

Create `.env.local` for development:

```env
# Application
NODE_ENV=development
PORT=3000
WEBSOCKET_PATH=/llamaproxws

# Performance
METRICS_INTERVAL=10000
MODELS_INTERVAL=30000
LOGS_INTERVAL=15000

# Logging
LOG_LEVEL=debug
LOG_COLORS=true
LOG_VERBOSE=true
```

## Production Deployment

### Production Build

1. **Build Application**
   ```bash
   pnpm build
   ```

   Note: Next.js 16 uses Turbopack for building (not webpack).

2. **Production Environment Variables**

   Create `.env.production`:
   ```env
   # Application
   NODE_ENV=production
   PORT=3000
   WEBSOCKET_PATH=/llamaproxws

   # Performance (optimized for production)
   METRICS_INTERVAL=15000
   MODELS_INTERVAL=60000
   LOGS_INTERVAL=30000

   # Logging
   LOG_LEVEL=info
   LOG_COLORS=false
   LOG_VERBOSE=false
   ```

3. **Start Production Server**
   ```bash
   pnpm start
   ```

   Note: Production server also uses `tsx` for TypeScript execution.

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

2. **Enable and Start Service**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable llama-proxy
   sudo systemctl start llama-proxy
   sudo systemctl status llama-proxy
   ```

3. **View Logs**
   ```bash
   sudo journalctl -u llama-proxy -f
   ```

## Container Deployment

### Docker Setup

#### Dockerfile (Multi-stage build)

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

# Copy tsx configuration if needed
COPY --from=builder /app/package.json ./package.json

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

#### Docker Compose (Full Stack)

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

## Cloud Deployment

### Vercel (Recommended for Frontend)

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

**Note**: Vercel deployment is limited for full-stack application due to server-side requirements. Use for frontend-only or combine with separate backend deployment.

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
   ```yaml
   services:
     - type: web
       name: llama-proxy
       runtime: node
       buildCommand: pnpm install && pnpm build
       startCommand: pnpm start
       envVars:
         - key: NODE_ENV
           value: production
         - key: PORT
           value: 3000
         - key: WEBSOCKET_PATH
           value: /llamaproxws
       disk:
         name: models
         mountPath: /app/models
         sizeGB: 100
   ```

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

4. **Systemd Service**
   Use the systemd configuration from earlier section.

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

3. **Deployment Script**
   ```bash
   #!/bin/bash
   # setup.sh

   # Install dependencies
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   npm install -g pnpm

   # Clone application
   git clone <repository-url>
   cd nextjs-llama-async-proxy

   # Install and build
   pnpm install
   pnpm build

   # Create systemd service
   sudo cp llama-proxy.service /etc/systemd/system/
   sudo systemctl enable llama-proxy
   sudo systemctl start llama-proxy
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

## Kubernetes Deployment

### Kubernetes Manifests

#### Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: llama-proxy
  labels:
    app: llama-proxy
spec:
  replicas: 2
  selector:
    matchLabels:
      app: llama-proxy
  template:
    metadata:
      labels:
        app: llama-proxy
    spec:
      containers:
      - name: llama-proxy
        image: llama-proxy:latest
        ports:
        - containerPort: 3000
          name: http
        - containerPort: 8134
          name: llama-server
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3000"
        - name: WEBSOCKET_PATH
          value: "/llamaproxws"
        volumeMounts:
        - name: config-volume
          mountPath: /app/llama-server-config.json
          subPath: llama-server-config.json
        - name: models-volume
          mountPath: /app/models
        - name: logs-volume
          mountPath: /app/logs
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
      volumes:
      - name: config-volume
        configMap:
          name: llama-proxy-config
      - name: models-volume
        persistentVolumeClaim:
          claimName: models-pvc
      - name: logs-volume
        persistentVolumeClaim:
          claimName: logs-pvc
```

#### Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: llama-proxy-service
spec:
  selector:
    app: llama-proxy
  ports:
  - name: http
    port: 3000
    targetPort: 3000
  - name: llama-server
    port: 8134
    targetPort: 8134
  type: LoadBalancer
```

#### ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: llama-proxy-config
data:
  llama-server-config.json: |
    {
      "host": "localhost",
      "port": 8134,
      "basePath": "/models",
      "serverPath": "/usr/local/bin/llama-server",
      "ctx_size": 8192,
      "batch_size": 512,
      "threads": -1,
      "gpu_layers": -1
    }
```

#### Persistent Volume Claims

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: models-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 100Gi

---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: logs-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 20Gi
```

## Load Balancing and Scaling

### Nginx Reverse Proxy

#### Configuration

```nginx
upstream llama_proxy_backend {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    keepalive 32;
}

server {
    listen 80;
    server_name your-domain.com;

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

        # WebSocket support
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Upgrade $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # SSL configuration (recommended)
    listen 443 ssl http2;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
}
```

### HAProxy Load Balancer

#### Configuration

```haproxy
frontend llama_proxy_front
    bind *:80
    bind *:443 ssl crt /path/to/cert.pem
    default_backend llama_proxy_back

backend llama_proxy_back
    balance roundrobin
    server server1 127.0.0.1:3000 check
    server server2 127.0.0.1:3001 check
    server server3 127.0.0.1:3002 check

    # WebSocket support
    option http-use-htx
    http-check expect status 200
```

## Monitoring and Observability

### Application Monitoring

#### Health Checks
- **HTTP Endpoint**: `GET /api/health`
- **Readiness Probe**: `GET /api/status`
- **Liveness Probe**: Process monitoring

#### Metrics Collection

```bash
# Prometheus metrics (if implemented)
curl http://localhost:3000/api/monitoring

# Application metrics
curl http://localhost:3000/api/health
```

### Log Aggregation

#### Centralized Logging

```bash
# Using rsyslog
sudo apt install rsyslog

# Configure log shipping
echo "*.* @log-server:514" >> /etc/rsyslog.d/50-default.conf
sudo systemctl restart rsyslog
```

### Performance Monitoring

#### APM Tools
- **New Relic**: Application performance monitoring
- **DataDog**: Infrastructure and application monitoring
- **Grafana + Prometheus**: Custom dashboards

## Security Hardening

### Network Security

#### Firewall Configuration

```bash
# UFW (Ubuntu)
sudo ufw allow ssh
sudo ufw allow 3000
sudo ufw allow 8134
sudo ufw --force enable

# iptables
sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables -P INPUT DROP
```

### SSL/TLS Configuration

#### Let's Encrypt (Certbot)

```bash
# Install certbot
sudo apt install certbot

# Get certificate
sudo certbot certonly --standalone -d your-domain.com

# Configure automatic renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Security Headers

#### Nginx Security Headers

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
```

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

## Troubleshooting Deployment

### Common Issues

#### Port Conflicts

```bash
# Check what's using port 3000
sudo lsof -i :3000
sudo netstat -tulpn | grep :3000

# Kill process
sudo kill -9 <PID>
```

#### Memory Issues

```bash
# Check memory usage
free -h
top -o %MEM

# Check application memory
pm2 monit
```

#### Permission Issues

```bash
# Fix permissions
sudo chown -R llama-user:llama-user /opt/llama-proxy
sudo chmod -R 755 /opt/llama-proxy
sudo chmod 644 /opt/llama-proxy/llama-server-config.json
```

#### Startup Failures

```bash
# Check systemd status
sudo systemctl status llama-proxy

# Check logs
sudo journalctl -u llama-proxy -f

# Check PM2 logs
pm2 logs llama-proxy
```

### Performance Tuning

#### Node.js Optimization

```bash
# Environment variables for performance
export NODE_ENV=production
export UV_THREADPOOL_SIZE=64
export NODE_OPTIONS="--max-old-space-size=4096"
```

#### System Tuning

```bash
# Increase file descriptors
echo "fs.file-max = 65536" >> /etc/sysctl.conf
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf

# Apply changes
sudo sysctl -p
```

## Migration Guide

### Upgrading from Development to Production

1. **Environment Setup**
   - Copy production environment variables
   - Update configuration paths
   - Set up proper logging

2. **Configuration Migration**
   - Backup development `llama-server-config.json`
   - Update paths for production
   - Adjust resource limits

3. **Zero-downtime Deployment**
   ```bash
   # Using blue-green deployment
   pm2 start ecosystem.config.js --env production
   pm2 reload ecosystem.config.js
   pm2 stop old-instance
   ```

---

**Deployment Guide - Next.js Llama Async Proxy**
**Version 0.1.0 - December 27, 2025**
