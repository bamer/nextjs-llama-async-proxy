# Deployment Guide - Next.js Llama Async Proxy

Comprehensive guide for deploying the Next.js Llama Async Proxy in various environments, from development to production.

## Overview

This guide covers deployment strategies for the Next.js Llama Async Proxy, including containerization, cloud deployment, and traditional server setups.

## Prerequisites

### System Requirements
- **Node.js**: 18.0 or higher
- **Memory**: Minimum 4GB RAM, recommended 16GB+
- **Storage**: 50GB+ for models and logs
- **Network**: Stable internet connection
- **GPU**: Optional but recommended for performance

### Software Dependencies
- **llama-server binary**: Compatible with your system architecture
- **GGUF model files**: Pre-downloaded AI models
- **Package manager**: pnpm (recommended) or npm/yarn

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

3. **Configure Environment**
   Create `.llama-proxy-config.json`:
   ```json
   {
     "llama_server_host": "localhost",
     "llama_server_port": 8134,
     "llama_server_path": "/usr/local/bin/llama-server",
     "basePath": "./models"
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

# Llama Server
LLAMA_SERVER_HOST=localhost
LLAMA_SERVER_PORT=8134
LLAMA_SERVER_PATH=/usr/local/bin/llama-server
LLAMA_SERVER_TIMEOUT=30000

# Models
LLAMA_MODELS_DIR=./models
LLAMA_DEFAULT_MODEL=

# Performance
METRICS_INTERVAL=10000
MODELS_INTERVAL=30000
LOGS_INTERVAL=15000

# Logging
LOG_LEVEL=debug
LOG_COLORS=true
```

## Production Deployment

### Production Build

1. **Build Application**
   ```bash
   pnpm build
   ```

2. **Production Environment Variables**
   Create `.env.local`:
   ```env
   # Application
   NODE_ENV=production
   PORT=3000

   # Security (when implemented)
   # API_SECRET_KEY=your-secret-key
   # JWT_SECRET=your-jwt-secret

   # Llama Server
   LLAMA_SERVER_HOST=localhost
   LLAMA_SERVER_PORT=8134
   LLAMA_SERVER_PATH=/opt/llama-server/bin/llama-server
   LLAMA_SERVER_TIMEOUT=60000

   # Models
   LLAMA_MODELS_DIR=/opt/models
   LLAMA_DEFAULT_MODEL=llama-2-7b-chat

   # Performance (optimized for production)
   METRICS_INTERVAL=15000
   MODELS_INTERVAL=60000
   LOGS_INTERVAL=30000

   # Logging
   LOG_LEVEL=info
   LOG_COLORS=false
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
       instances: 1,
       autorestart: true,
       watch: false,
       max_memory_restart: '1G',
       env: {
         NODE_ENV: 'production',
         PORT: 3000
       },
       error_file: './logs/err.log',
       out_file: './logs/out.log',
       log_file: './logs/combined.log',
       time: true
     }]
   };
   ```

3. **Start with PM2**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
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
   WorkingDirectory=/opt/llama-proxy
   ExecStart=/usr/bin/node server.js
   Restart=always
   RestartSec=10
   Environment=NODE_ENV=production
   Environment=PORT=3000

   [Install]
   WantedBy=multi-user.target
   ```

2. **Enable and Start Service**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable llama-proxy
   sudo systemctl start llama-proxy
   ```

## Container Deployment

### Docker Setup

#### Dockerfile (Multi-stage build)
```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN pnpm build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

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

CMD ["node", "server.js"]
```

#### Docker Compose (Full Stack)
```yaml
version: '3.8'

services:
  llama-proxy:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - LLAMA_SERVER_HOST=llama-server
      - LLAMA_SERVER_PORT=8080
      - LLAMA_MODELS_DIR=/app/models
    volumes:
      - ./models:/app/models:ro
      - ./logs:/app/logs
    depends_on:
      - llama-server
    restart: unless-stopped

  llama-server:
    image: llama-server:latest
    ports:
      - "8080:8080"
    volumes:
      - ./models:/models:ro
    environment:
      - LLAMA_MODEL=/models/your-model.gguf
      - LLAMA_CTX_SIZE=4096
      - LLAMA_N_GPU_LAYERS=35
    restart: unless-stopped
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

#### Build and Run
```bash
# Build image
docker build -t llama-proxy .

# Run container
docker run -d \
  --name llama-proxy \
  -p 3000:3000 \
  -v $(pwd)/models:/app/models \
  -v $(pwd)/logs:/app/logs \
  -e LLAMA_SERVER_HOST=host.docker.internal \
  llama-proxy
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
       "NODE_ENV": "production"
     }
   }
   ```

3. **Environment Variables**
   Set in Vercel dashboard:
   ```
   LLAMA_SERVER_HOST=your-server-host
   LLAMA_SERVER_PORT=8134
   LLAMA_MODELS_DIR=/opt/models
   ```

**Note**: Vercel deployment is limited for the full-stack application due to server-side requirements. Use for frontend-only or combine with separate backend deployment.

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

### Render

1. **Create Web Service**
   - Connect GitHub repository
   - Choose Node.js runtime

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
         - key: LLAMA_SERVER_HOST
           value: your-server-host
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

   # Install Node.js
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
   ```bash
   sudo nano /etc/systemd/system/llama-proxy.service
   # Add service configuration from earlier example
   sudo systemctl enable llama-proxy
   sudo systemctl start llama-proxy
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
     --image=ubuntu-2204-jammy-v20231201 \
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
        env:
        - name: NODE_ENV
          value: "production"
        - name: LLAMA_SERVER_HOST
          value: "llama-server"
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
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
  - port: 3000
    targetPort: 3000
  type: LoadBalancer
```

#### ConfigMap
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: llama-proxy-config
data:
  LLAMA_SERVER_PORT: "8134"
  LLAMA_MODELS_DIR: "/models"
  LOG_LEVEL: "info"
```

#### Persistent Volume
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
```

### Helm Chart

#### Chart Structure
```
llama-proxy/
├── Chart.yaml
├── values.yaml
├── templates/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── configmap.yaml
│   └── ingress.yaml
└── charts/
```

#### values.yaml
```yaml
replicaCount: 2

image:
  repository: llama-proxy
  tag: latest
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 3000

config:
  llamaServerHost: llama-server
  llamaServerPort: 8134
  modelsDir: /models

resources:
  limits:
    cpu: 1000m
    memory: 2Gi
  requests:
    cpu: 250m
    memory: 512Mi
```

## Load Balancing and Scaling

### Nginx Reverse Proxy

#### Configuration
```nginx
upstream llama_proxy_backend {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
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
    }

    # SSL configuration (recommended)
    listen 443 ssl http2;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
}
```

### HAProxy Load Balancer

#### Configuration
```haproxy
frontend llama_proxy_front
    bind *:80
    default_backend llama_proxy_back

backend llama_proxy_back
    balance roundrobin
    server server1 127.0.0.1:3000 check
    server server2 127.0.0.1:3001 check
    server server3 127.0.0.1:3002 check
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
curl http://localhost:3000/api/metrics

# Application metrics
curl http://localhost:3000/api/monitoring
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
cp .env.local $BACKUP_DIR/config_$DATE.env
cp .llama-proxy-config.json $BACKUP_DIR/config_$DATE.json

# Backup logs
tar -czf $BACKUP_DIR/logs_$DATE.tar.gz logs/

# Backup models (optional, can be large)
# tar -czf $BACKUP_DIR/models_$DATE.tar.gz models/

# Clean old backups (keep last 7 days)
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*.env" -mtime +7 -delete
find $BACKUP_DIR -name "*.json" -mtime +7 -delete
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
sudo chmod 644 /opt/llama-proxy/.env.local
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

2. **Database Migration** (if applicable)
   - Backup existing data
   - Run migration scripts
   - Update connection strings

3. **Zero-downtime Deployment**
   ```bash
   # Using blue-green deployment
   pm2 start ecosystem.config.js --env production
   pm2 reload ecosystem.config.js
   pm2 stop old-instance
   ```

---

*Deployment Guide - Next.js Llama Async Proxy*
*Version 0.1.0 - December 26, 2025*