# Deployment Documentation

## Llama Async Proxy Dashboard - Production Deployment Guide

This document provides comprehensive deployment instructions for the Llama Async Proxy Dashboard. Whether you're deploying on a bare metal server, in containers, or behind a reverse proxy, this guide covers all deployment scenarios with production-ready configurations.

---

## 1. Overview

The Llama Async Proxy Dashboard is a self-hosted, production-grade management interface for llama.cpp servers running in router mode. The application enables seamless management of multiple LLM models with real-time monitoring, WebSocket-based updates, and persistent storage for configuration and metrics.

### 1.1 Deployment Philosophy

This project follows a minimalist deployment philosophy centered on self-containment and operational simplicity. Unlike cloud-dependent solutions that require external services, subscriptions, or vendor lock-in, this dashboard operates entirely on infrastructure you control. Every component—from the SQLite database to the Socket.IO real-time communication layer—runs locally without external dependencies. This approach ensures data sovereignty, eliminates ongoing SaaS costs, and provides complete operational control. Organizations in regulated industries, research environments, or privacy-conscious settings benefit significantly from this architecture since no data ever leaves your infrastructure. The deployment model also aligns with air-gapped or isolated network requirements where internet connectivity cannot be guaranteed.

### 1.2 Self-Hosted Model

The self-hosted nature of this application means you maintain full ownership of your computational resources and data. Model files, conversation histories, configuration data, and operational metrics remain on your servers exclusively. This model suits scenarios where model weights are large (often exceeding 10GB), inference costs must be controlled, or compliance requirements mandate local processing. The router mode architecture allows serving multiple models from a single llama-server instance, maximizing resource utilization while simplifying operational overhead. You can scale horizontally by deploying additional instances behind a load balancer, though most deployments operate effectively on a single server due to the efficient resource management of llama.cpp.

### 1.3 No External Dependencies

The application intentionally avoids external service dependencies that could introduce availability risks or recurring costs. Socket.IO handles all real-time communication directly between clients and the server without requiring third-party services. SQLite provides ACID-compliant storage through a single file, eliminating database server complexity. All application dependencies install via pnpm and bundle with the application, ensuring reproducible deployments. Even SSL/TLS certificates can be self-signed for internal deployments or obtained free via Let's Encrypt without intermediary services. This dependency-free approach means your deployment remains functional during network outages and immune to third-party service changes or deprecations.

### 1.4 Supported Platforms

The application supports deployment across major server operating systems with consistent behavior. Linux distributions form the primary deployment target, with Ubuntu 20.04 LTS, Ubuntu 22.04 LTS, Debian 11 (Bullseye), Debian 12 (Bookworm), and RHEL 9/Rocky Linux 9 being extensively tested. macOS 12 (Monterey) and later versions support direct installation via Homebrew or pnpm, making local development and small-scale deployments straightforward. Windows Server 2022 and Windows 11 support direct installation through WSL2 (Windows Subsystem for Linux), which provides a full Linux environment essential for the application. Direct Windows native deployment is possible but not recommended due to path handling differences and filesystem behaviors that may cause unexpected issues. ARM64 architecture is fully supported on Apple Silicon Macs and ARM Linux servers including AWS Graviton, Raspberry Pi 4/5 (with 8GB+ RAM), and similar platforms.

---

## 2. System Requirements

Understanding system requirements ensures successful deployment and optimal performance. The application is lightweight in terms of runtime overhead but requires adequate resources for the LLM models you intend to serve. Requirements scale primarily with model size and concurrent usage rather than the dashboard application itself.

### 2.1 Hardware Requirements

Hardware requirements depend heavily on your model selection and usage patterns. The dashboard itself requires minimal resources, but the llama.cpp server backend that it manages will consume significant memory based on model parameters and GPU offloading configuration.

**Minimum Specifications:**

The absolute minimum viable deployment requires a system with 4 CPU cores, 8GB of RAM, and 20GB of storage space. This configuration supports small models up to 7B parameters with conservative context windows (2048-4096 tokens). GPU offloading may be limited or unavailable at this tier, resulting in CPU-only inference. Storage should accommodate the application, models, and database growth over time—fast SSD storage significantly improves model loading times and overall responsiveness. Network connectivity requires standard outbound access for initial dependency installation and optional certificate acquisition; once deployed, the application operates independently of network availability.

**Recommended Specifications:**

Production deployments benefit from 8+ CPU cores, 32GB RAM, and 100GB+ SSD storage. This configuration comfortably handles models up to 70B parameters with reasonable context windows and supports partial GPU offloading. Multi-socket systems improve concurrent request handling capacity, while NVMe storage reduces model loading times from minutes to seconds. Network throughput of 1Gbps ensures responsive WebSocket communication and efficient model file access when models don't fit entirely in RAM. Consider redundancy for storage using RAID or ZFS for production deployments to prevent data loss from disk failure.

**GPU Requirements (Optional):**

NVIDIA GPUs significantly accelerate inference by offloading model layers from CPU to GPU memory. CUDA-compatible GPUs with at least 8GB VRAM can run 7B models with full layer offloading (ngl 99), achieving 10-50x speedup compared to CPU inference. RTX 3090/4090 or A100/H100 cards provide excellent performance for production workloads. The application passes GPU layer configuration to llama-server via the -ngl parameter. Multi-GPU configurations can serve different models on different GPUs or split large models across multiple cards. AMD GPUs are supported through ROCm on Linux, though compatibility varies by model and requires careful driver configuration. Apple Silicon GPUs accelerate llama.cpp through Metal performance shaders on macOS, providing substantial speedup for compatible models.

### 2.2 Operating System Support

The application targets Linux as the primary production platform with well-tested deployment procedures. Each operating system has specific considerations that affect deployment and operation.

**Linux (Ubuntu, Debian, CentOS/RHEL):**

Ubuntu and Debian offer the most straightforward deployment experience with readily available packages and extensive community support. The application runs without modification using standard Node.js packages or distributions like nvm for version management. Systemd service integration works out of the box for process management and automatic restart. Firewall configuration via UFW (Ubuntu) or firewalld (RHEL) requires attention during deployment to allow WebSocket traffic. SELinux on RHEL-based systems may require policy adjustments for the application to function correctly; the Security Hardening section addresses this. Ubuntu's AppArmor typically requires no modification for standard deployments.

**macOS:**

macOS deployment supports both Intel and Apple Silicon Macs using Homebrew for package management. The application runs identically to Linux deployments except for minor path differences and process management. Launchd handles service management instead of systemd. Models should be stored on APFS-formatted drives for optimal performance. The application has been tested on macOS 12 (Monterey) through macOS 15 (Sequoia). Note that macOS deployment suits development and small-scale production rather than high-concurrency workloads due to operating system file descriptor limits that require tuning for many simultaneous WebSocket connections.

**Windows (WSL Recommended):**

Windows native deployment is technically possible but not recommended due to filesystem path handling differences and Socket.IO WebSocket behavior variations. WSL2 (Windows Subsystem for Linux) provides a full Linux environment that runs the application unmodified. Ubuntu 22.04 LTS within WSL2 offers the most tested configuration. WSL2 integrates with Windows networking, allowing the application to be accessible from Windows browser windows seamlessly. Docker Desktop with WSL2 backend provides the easiest path to containerized deployment on Windows. Ensure WSL2 is configured with adequate resources (CPU cores, RAM) allocated in .wslconfig for acceptable performance.

### 2.3 Node.js Version Requirement

The application requires Node.js version 18.0.0 or higher. This minimum version ensures availability of modern JavaScript features, stable WebSocket implementation, and security updates. The package.json engines field enforces this requirement, preventing installation on incompatible Node versions.

Node.js 20 LTS (the current recommended version) provides the best balance of stability, performance, and long-term support. Node.js 22 is also fully supported and offers incremental performance improvements. Production deployments should use LTS versions rather than current releases to maximize stability. The application has been tested through Node.js 22.x and works correctly with all Socket.IO and Express features.

Verify your Node.js version before deployment:

```bash
node --version
# Should output: v20.x.x or higher
```

If your package manager provides an older version, install Node.js via nvm (Node Version Manager) for flexibility:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc  # or ~/.zshrc
nvm install --lts
nvm use --lts
```

---

## 3. Production Checklist

Complete this checklist before initiating deployment. Each item represents a critical consideration for production operations. Skipping items may result in security vulnerabilities, operational issues, or data loss.

- **Node.js installed**: Verify `node --version` shows >= 18.0.0 and `npm --version` is accessible. Install via official packages or nvm for version management flexibility.
- **pnpm installed**: Confirm `pnpm --version` responds. pnpm provides faster installs, disk space optimization, and strict peer dependency resolution. Install via `npm install -g pnpm`.
- **Firewall configured**: Ensure ports 3000 (or your configured PORT) are open. Configure cloud provider security groups for cloud deployments. Block all other ports not required for operation.
- **SSL certificate ready (if HTTPS)**: Obtain certificates via Let's Encrypt or your preferred CA. Certificates must include both the domain and any subdomains used for WebSocket connections.
- **Backup strategy defined**: Establish automated database backups, model file redundancy, and off-site copy procedures. Test restoration processes before going to production.
- **Monitoring setup planned**: Configure health check endpoints, log aggregation, and alerting thresholds. Define escalation procedures for common failure modes.
- **Log rotation configured**: Prevent disk exhaustion from unbounded log growth. Configure logrotate or equivalent to compress and delete historical logs automatically.
- **Resource limits established**: Set container memory limits or systemd resource constraints. Configure swap space to handle memory pressure gracefully during model loading.
- **Non-root user created**: Production services should never run as root. Create a dedicated service account with minimal privileges for security isolation.
- **Data directory prepared**: Create the data directory with appropriate ownership. Ensure the service user has write permissions for SQLite database files.

---

## 4. Environment Variables

Environment variables configure application behavior at runtime. The application reads variables from the process environment with sensible defaults for development. Production deployments should explicitly set relevant variables for optimal operation.

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `PORT` | 3000 | No | TCP port the server listens on. Must be accessible through any reverse proxy configuration. |
| `NODE_ENV` | development | No | Environment mode. Set to "production" for optimized performance and security headers. |
| `DATA_DIR` | ./data | No | Directory path for SQLite database storage. Use absolute paths in production for reliability. |
| `MODELS_DIR` | ./models | No | Directory path for GGUF model files. Create this directory and populate with model files for auto-discovery. |
| `LLAMA_SERVER_PATH` | | No | Absolute path to the llama-server executable. Required if llama-server is not in PATH. |
| `LOG_LEVEL` | info | No | Logging verbosity: "debug", "info", "warn", "error". Use "debug" for troubleshooting only. |
| `MAX_CONNECTIONS` | 100 | No | Maximum concurrent WebSocket connections. Adjust based on expected user load. |
| `METRICS_ENABLED` | false | No | Enable Prometheus-compatible metrics endpoint at /metrics. Boolean: "true"/"false". |

Example production .env file:

```bash
NODE_ENV=production
PORT=3000
DATA_DIR=/opt/llama-proxy/data
MODELS_DIR=/var/models
LLAMA_SERVER_PATH=/usr/local/bin/llama-server
LOG_LEVEL=warn
MAX_CONNECTIONS=200
METRICS_ENABLED=true
```

---

## 5. Direct Installation (Linux/macOS)

Direct installation deploys the application without containerization, running Node.js directly on the host operating system. This approach provides the most direct resource access and simplest debugging workflow.

### Step 1: Clone Repository

```bash
# Clone the repository
git clone https://github.com/your-repo/llama-async-proxy.git
cd llama-async-proxy

# Verify the files are present
ls -la
```

Replace the repository URL with your actual repository location. For private repositories, configure SSH keys or personal access tokens for authentication.

### Step 2: Install pnpm

If pnpm is not already installed, install it globally via npm:

```bash
npm install -g pnpm

# Verify installation
pnpm --version
```

Alternatively, install pnpm via corepack (included with Node.js 16.13+):

```bash
corepack enable
corepack prepare pnpm@latest --activate
```

### Step 3: Install Dependencies

Install production dependencies only, excluding development tools:

```bash
pnpm install --production

# Installation output shows dependency resolution and download progress
# Verify installation with
pnpm list --depth=0
```

### Step 4: Create Required Directories

Create and configure the data and models directories with appropriate permissions:

```bash
# Create directories
mkdir -p data models

# Set ownership (replace 'llama' with your service user)
chown -R llama:llama data models

# Verify permissions
ls -la data/ models/
```

### Step 5: Copy GGUF Models (Optional)

Copy your GGUF model files to the models directory. The application auto-discovers models based on .gguf file extensions:

```bash
# Example: Copy a model file
cp /path/to/Llama-3-8B-Instruct.Q4_K_M.gguf ./models/

# Verify discovery
ls -la models/
```

### Step 6: Start Server

Start the application in production mode:

```bash
# Basic start
pnpm start

# With environment file
NODE_ENV=production pnpm start

# With custom port
PORT=8080 pnpm start

# Background with nohup (if not using systemd)
nohup pnpm start > /var/log/llama-proxy/app.log 2>&1 &
```

The server binds to the configured port (default 3000) and begins listening for HTTP and WebSocket connections. Access the dashboard at http://your-server:3000.

---

## 6. Direct Installation (Windows)

Windows deployment uses PowerShell for command execution. The recommended approach uses WSL2 for Linux compatibility, though native Windows operation is possible for development purposes.

### PowerShell Installation Steps

```powershell
# 1. Clone repository
git clone https://github.com/your-repo/llama-async-proxy.git
cd llama-async-proxy

# 2. Install pnpm globally
npm install -g pnpm

# 3. Install production dependencies
pnpm install --production

# 4. Create data directory
New-Item -ItemType Directory -Force -Path data, models

# 5. Start the server
pnpm start
```

### WSL2 Installation (Recommended)

WSL2 provides a complete Linux environment for reliable deployment:

```bash
# Install WSL2 and Ubuntu (run in PowerShell as Administrator)
wsl --install -d Ubuntu-22.04

# Enter WSL2
wsl -l -v
wsl

# Inside WSL, follow Linux installation steps
cd /mnt/c/path/to/llama-async-proxy
# ... continue with Linux instructions above
```

### Windows Service Configuration

For automatic startup on Windows, create a service using NSSM (Non-Sucking Service Manager):

```powershell
# Install NSSM via Chocolatey
choco install nssm

# Create service
nssm install llama-proxy "C:\Users\%USERNAME%\AppData\Roaming\nvm\v20.0.0\pnpm.cmd"
parameters: start
AppDirectory: C:\path\to\llama-async-proxy
AppStdout: C:\logs\llama-proxy\stdout.log
AppStderr: C:\logs\llama-proxy\stderr.log
AppEnvironmentExtra: NODE_ENV=production

# Start service
nssm start llama-proxy
```

---

## 7. Docker Deployment

Docker provides containerized deployment with consistent environments across platforms. Containerization simplifies dependency management and enables Kubernetes orchestration for large-scale deployments.

### Complete Dockerfile

Create this Dockerfile in the project root:

```dockerfile
FROM node:20-alpine AS base

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++ vips-dev

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install -g pnpm && \
    pnpm install --production --frozen-lockfile

# Copy application source
COPY server.js ./
COPY public ./public
COPY config ./config

# Create directories with correct permissions
RUN mkdir -p data models logs && \
    chown -R node:node /app

# Switch to non-root user
USER node

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start server
CMD ["pnpm", "start"]
```

### Build and Run

Build the container image and run it with appropriate volume mounts:

```bash
# Build the image
docker build -t llama-proxy:latest .

# Run the container
docker run -d \
    --name llama-proxy \
    -p 3000:3000 \
    -v $(pwd)/data:/app/data \
    -v $(pwd)/models:/app/models \
    -v $(pwd)/logs:/app/logs \
    -e NODE_ENV=production \
    -e PORT=3000 \
    --restart unless-stopped \
    llama-proxy:latest

# Verify container status
docker logs llama-proxy

# Follow logs in real-time
docker logs -f llama-proxy
```

### Multi-Architecture Build

Build for multiple architectures using Docker buildx:

```bash
# Enable buildx
docker buildx create --name multiarch --use

# Build for amd64 and arm64
docker buildx build --platform linux/amd64,linux/arm64 \
    -t llama-proxy:latest \
    --push \
    .
```

---

## 8. Docker Compose Deployment

Docker Compose simplifies multi-container orchestration with declarative configuration. This approach manages container lifecycle, networking, and environment variables through a single configuration file.

### Complete docker-compose.yml

Create this docker-compose.yml in your project directory:

```yaml
version: "3.8"

services:
  llama-proxy:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: llama-proxy
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
      - ./models:/app/models
      - ./logs:/app/logs
    environment:
      - NODE_ENV=production
      - PORT=3000
      - LOG_LEVEL=info
      - DATA_DIR=/app/data
      - MODELS_DIR=/app/models
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      start_period: 10s
      retries: 3
    networks:
      - llama-network
    mem_limit: 4g
    cpus: 2.0

networks:
  llama-network:
    driver: bridge

volumes:
  llama-data:
  llama-models:
```

### Deployment Commands

Deploy, monitor, and manage the application:

```bash
# Deploy in detached mode
docker compose up -d

# View real-time logs
docker compose logs -f

# View logs for specific service
docker compose logs -f llama-proxy

# Stop all services
docker compose down

# Stop and remove volumes (WARNING: destroys data)
docker compose down -v

# Restart services
docker compose restart

# Recreate after configuration changes
docker compose up -d --force-recreate

# Check service health
docker compose ps
```

### Scaling with Docker Compose

While Docker Compose doesn't provide horizontal scaling within a single compose file, you can run multiple instances behind a load balancer:

```yaml
# docker-compose.scale.yml
services:
  llama-proxy:
    deploy:
      replicas: 3
    # ... rest of configuration
```

Deploy with: `docker compose -f docker-compose.scale.yml up -d`

---

## 9. Reverse Proxy Configuration

A reverse proxy handles SSL termination, load distribution, and provides additional security layers. This section covers Nginx and Caddy configurations.

### Nginx Configuration

This configuration provides production-ready SSL, WebSocket support, and security headers:

```nginx
# /etc/nginx/sites-available/llama-proxy

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name llama.your-domain.com;
    return 301 https://$server_name$request_uri;
}

# Main HTTPS server
server {
    listen 443 ssl http2;
    server_name llama.your-domain.com;

    # SSL certificate configuration
    ssl_certificate /etc/letsencrypt/live/llama.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/llama.your-domain.com/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # Modern TLS configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Static files
    root /var/www/llama-proxy/public;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # WebSocket proxy for llama.cpp server
    location /llamaproxws {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }

    # Socket.IO WebSocket connections
    location /socket.io {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Metrics endpoint (if enabled)
    location /metrics {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

Enable the site configuration:

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/llama-proxy /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Caddy Configuration

Caddy provides automatic HTTPS and simpler configuration:

```caddy
# /etc/caddy/Caddyfile

llama.your-domain.com {
    # Serve static files
    root * /var/www/llama-proxy/public
    try_files {path} {path}/ /index.html

    # Enable WebSocket proxy
    @websocket {
        path /llamaproxws
        path /socket.io/*
    }

    reverse_proxy @websocket localhost:3000 {
        # WebSocket upgrade headers
        transport http {
            versions h2c
        }
    }

    # Set headers
    header {
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        X-XSS-Protection "1; mode=block"
    }

    # Log to file
    log {
        output file /var/log/caddy/llama-proxy.log
        format json
    }
}
```

Enable and start Caddy:

```bash
# Validate configuration
sudo caddy validate --config /etc/caddy/Caddyfile

# Reload configuration
sudo systemctl reload caddy
```

---

## 10. SSL/TLS Setup

Secure communication protects data in transit and enables modern browser features. This section covers certificate acquisition and configuration.

### Let's Encrypt Certificates

Obtain free certificates using Certbot:

```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Obtain certificate (automatic Nginx configuration)
sudo certbot --nginx -d llama.your-domain.com

# Obtain certificate without Nginx plugin
sudo certbot certonly --standalone -d llama.your-domain.com

# Verify certificates
sudo certbot certificates
```

### Certificate Renewal Automation

Let's Encrypt certificates expire after 90 days. Configure automatic renewal:

```bash
# Test automatic renewal
sudo certbot renew --dry-run

# Add to crontab
sudo crontab -e
# Add line:
# 0 2 * * * /usr/bin/certbot renew --quiet
```

### Forced HTTPS

The Nginx configuration in the previous section automatically redirects HTTP to HTTPS. For additional enforcement, add this to your server blocks:

```nginx
# Strict Transport Security (HSTS)
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

### Self-Signed Certificates (Internal Use)

For internal deployments where public certificates aren't required:

```bash
# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/llama-proxy.key \
    -out /etc/ssl/certs/llama-proxy.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=llama.internal"

# Convert to combined PEM (required by some configurations)
cat /etc/ssl/certs/llama-proxy.crt /etc/ssl/private/llama-proxy.key > /etc/ssl/certs/llama-proxy.pem
```

---

## 11. Systemd Service (Linux)

Systemd manages the application as a system service with automatic restart, logging integration, and dependency management.

### Service Unit File

Create `/etc/systemd/system/llama-proxy.service`:

```ini
[Unit]
Description=Llama Async Proxy Dashboard
Documentation=https://github.com/your-repo/llama-async-proxy
After=network.target network-online.target
Wants=network-online.target

[Service]
Type=simple
User=llama-proxy
Group=llama-proxy
WorkingDirectory=/opt/llama-proxy
ExecStart=/usr/bin/pnpm start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=llama-proxy

# Environment configuration
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=LOG_LEVEL=info
EnvironmentFile=/etc/llama-proxy/environment

# Resource limits
LimitNOFILE=65536
MemoryMax=4G
CPUQuota=200%

# Security hardening
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
ReadWritePaths=/opt/llama-proxy/data /opt/llama-proxy/models /var/log/llama-proxy

[Install]
WantedBy=multi-user.target
```

### Environment Configuration File

Create `/etc/llama-proxy/environment`:

```bash
NODE_ENV=production
PORT=3000
DATA_DIR=/opt/llama-proxy/data
MODELS_DIR=/opt/llama-proxy/models
LOG_LEVEL=warn
MAX_CONNECTIONS=100
```

### Service Management Commands

```bash
# Reload systemd to recognize new service
sudo systemctl daemon-reload

# Enable automatic start on boot
sudo systemctl enable llama-proxy

# Start the service
sudo systemctl start llama-proxy

# Check status
sudo systemctl status llama-proxy

# View recent logs
sudo journalctl -u llama-proxy -n 50

# Follow logs in real-time
sudo journalctl -u llama-proxy -f

# Restart service
sudo systemctl restart llama-proxy

# Stop service
sudo systemctl stop llama-proxy
```

### Creating the Service User

```bash
# Create system user without login shell
sudo useradd --system --no-create-home --shell /usr/sbin/nologin llama-proxy

# Create directories with correct ownership
sudo mkdir -p /opt/llama-proxy/data /opt/llama-proxy/models /var/log/llama-proxy
sudo chown -R llama-proxy:llama-proxy /opt/llama-proxy /var/log/llama-proxy

# Copy application files (if not already present)
sudo cp -r /path/to/llama-async-proxy/* /opt/llama-proxy/
sudo chown -R llama-proxy:llama-proxy /opt/llama-proxy
```

---

## 12. Log Management

Effective log management enables troubleshooting while preventing disk exhaustion. Configure log rotation and centralized logging for production operations.

### Log File Locations

The application produces logs in multiple locations depending on deployment method:

| Log Type | Location | Description |
|----------|----------|-------------|
| Application | `/var/log/llama-proxy/app.log` | Main application output |
| Access | `/var/log/llama-proxy/access.log` | HTTP request logs |
| Error | `/var/log/llama-proxy/error.log` | Error-level messages |
| Systemd | `journalctl -u llama-proxy` | Systemd journal integration |

### Log Rotation Configuration

Create `/etc/logrotate.d/llama-proxy`:

```
/var/log/llama-proxy/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 llama-proxy llama-proxy
    sharedscripts
    postrotate
        systemctl reload llama-proxy > /dev/null 2>&1 || true
    endscript
}
```

Apply the configuration:

```bash
# Test the configuration
sudo logrotate -d /etc/logrotate.d/llama-proxy

# Force rotation to verify
sudo logrotate -f /etc/logrotate.d/llama-proxy
```

### Log Levels

Configure log verbosity based on operational needs:

- **debug**: Maximum verbosity, includes all request/response data. Use only for active troubleshooting.
- **info**: Standard production logging with meaningful events. Recommended for most deployments.
- **warn**: Errors and warnings only. Reduces log volume but may obscure diagnostic information.
- **error**: Errors only. Minimal logging suitable for high-traffic environments with external monitoring.

Set via environment variable: `LOG_LEVEL=info`

### Structured Logging to Journal

For systemd-based deployments, configure JSON-structured logging:

```bash
# Install a JSON logging formatter
sudo npm install -g pino-systemd

# Update service ExecStart
ExecStart=/bin/bash -c 'NODE_ENV=production /usr/bin/pnpm start | pino-systemd'
```

---

## 13. Performance Tuning

Optimize application performance through Node.js configuration, Socket.IO tuning, and database optimization. These adjustments improve throughput and responsiveness.

### Node.js Options

Configure runtime options for production workloads:

```bash
# Increase memory allocation for large deployments
NODE_OPTIONS="--max-old-space-size=4096" pnpm start

# Enable experimental features (if needed)
NODE_OPTIONS="--max-old-space-size=4096 --experimental-vm-modules" pnpm start

# Production-optimized Node flags
NODE_OPTIONS="--max-old-space-size=4096 --optimize-for-size" pnpm start
```

### Socket.IO Tuning

Configure Socket.IO for high-concurrency environments. Add to server initialization:

```javascript
// In server.js or configuration
const io = new Server(httpServer, {
  pingInterval: 25000,
  pingTimeout: 60000,
  maxHttpBufferSize: 1e8, // 100MB for large messages
  transports: ["websocket", "polling"],
  allowUpgrades: true,
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
    methods: ["GET", "POST"]
  }
});
```

### Database Optimization

SQLite benefits from periodic maintenance:

```javascript
// Add to server.js for automatic VACUUM
const db = new Database(databasePath);

// Enable WAL mode for concurrent access
db.pragma("journal_mode = WAL");

// Periodic vacuum (run weekly)
setInterval(() => {
  db.exec("VACUUM");
}, 7 * 24 * 60 * 60 * 1000);
```

### File Descriptor Limits

Increase file descriptor limits for high connection counts:

```bash
# Temporary increase
ulimit -n 65536

# Permanent increase (add to /etc/security/limits.conf)
echo "llama-proxy soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "llama-proxy hard nofile 65536" | sudo tee -a /etc/security/limits.conf
```

---

## 14. Security Hardening

Production deployments require security measures beyond default configurations. This section covers essential hardening steps.

### Run as Non-Root User

The application should never run as root. The systemd service configuration creates and uses a dedicated service user with minimal privileges.

### Firewall Configuration

Configure UFW (Ubuntu) or firewalld (RHEL) for appropriate access:

```bash
# UFW configuration
sudo ufw allow 22/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw enable

# firewalld configuration (RHEL)
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

### SELinux Configuration (RHEL)

If SELinux is enforcing, allow necessary operations:

```bash
# Allow Node.js to bind to ports
sudo setsebool -P httpd_can_network_connect 1

# Allow access to application directories
sudo semanage fcontext -a -t httpd_sys_content_t "/opt/llama-proxy(/.*)?"
sudo restorecon -Rv /opt/llama-proxy
```

### Rate Limiting

Implement rate limiting in Nginx to prevent abuse:

```nginx
http {
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_conn_zone $binary_remote_addr zone=conn:10m;

    server {
        # API endpoints
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            limit_conn conn 10;
            proxy_pass http://127.0.0.1:3000;
        }
    }
}
```

### Additional Security Headers

Add security headers to all responses:

```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
```

---

## 15. Monitoring and Alerts

Effective monitoring enables proactive issue detection and rapid troubleshooting. Configure health checks and alerting appropriate to your operational model.

### Health Check Endpoint

The application exposes a health check endpoint at `/health` when behind a reverse proxy. Direct access: `curl http://localhost:3000/health`

Expected response for healthy instance:
```json
{"status": "healthy", "timestamp": "2026-01-11T12:00:00.000Z"}
```

### Prometheus Metrics (Optional)

Enable Prometheus-compatible metrics at `/metrics`:

```bash
# Set environment variable
METRICS_ENABLED=true
```

Available metrics include:
- `http_requests_total`: Total HTTP requests by method and status
- `websocket_connections_active`: Active WebSocket connections
- `model_operations_total`: Model load/unload operations by status
- `process_cpu_seconds_total`: CPU time used
- `process_resident_memory_bytes`: Resident memory usage

### Alerting Integration

Configure alerts based on metrics thresholds:

```yaml
# Example Prometheus alerting rules
groups:
  - name: llama-proxy
    rules:
      - alert: HighMemoryUsage
        expr: process_resident_memory_bytes / 1024 / 1024 > 3800
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Llama proxy memory usage high"
      - alert: ManyWebSocketConnections
        expr: websocket_connections_active > 150
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High WebSocket connection count"
```

### Log Monitoring

Monitor application logs for errors:

```bash
# Watch for errors in real-time
sudo journalctl -u llama-proxy -f | grep -i error

# Count errors per hour
sudo journalctl -u llama-proxy --since "1 hour ago" | grep -c "error"
```

---

## 16. Backup Strategy

Robust backup procedures protect against data loss. Implement automated, tested backups for all critical data.

### Database Backup Script

Create `/opt/llama-proxy/scripts/backup.sh`:

```bash
#!/bin/bash
set -e

BACKUP_DIR="/var/backups/llama-proxy"
DATA_DIR="/opt/llama-proxy/data"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup SQLite database with vacuum
sqlite3 "$DATA_DIR/llama-dashboard.db" ".backup $BACKUP_DIR/llama-dashboard_$DATE.db"

# Compress backup
gzip "$BACKUP_DIR/llama-dashboard_$DATE.db"

# Keep only last 30 days
find "$BACKUP_DIR" -name "*.db.gz" -mtime +30 -delete

echo "Backup completed: llama-dashboard_$DATE.db.gz"
```

Make executable and schedule:

```bash
sudo chmod +x /opt/llama-proxy/scripts/backup.sh
sudo crontab -e
# Add line for daily backup at 2 AM
# 0 2 * * * /opt/llama-proxy/scripts/backup.sh
```

### Model File Redundancy

GGUF model files should be replicated to prevent data loss:

```bash
# Simple rsync to backup location
rsync -avz --progress /opt/llama-proxy/models/ /backup/llama-models/

# Or configure RAID for local redundancy
mdadm --create /dev/md0 --level=5 --raid-devices=3 /dev/sd[b,c,d]1
```

### Off-Site Backup Storage

For disaster recovery, replicate backups off-site:

```bash
# Example: Sync to S3-compatible storage
aws s3 sync /var/backups/llama-proxy s3://your-backup-bucket/llama-proxy/ \
    --storage-class STANDARD_IA \
    --sse AES256

# Or sync to another server via rsync over SSH
rsync -avz -e ssh /var/backups/llama-proxy/ user@backup-server:/backups/llama-proxy/
```

### Recovery Testing

Regularly test recovery procedures:

```bash
# Test database restoration
sqlite3 test_restore.db < /var/backups/llama-proxy/llama-dashboard_20260111_020000.db.gz
# Verify integrity
sqlite3 test_restore.db "PRAGMA integrity_check;"
```

---

## 17. Troubleshooting

Common deployment issues and their resolutions. Use these procedures to diagnose and fix problems quickly.

### Container Won't Start

If the Docker container fails to start, diagnose with these steps:

```bash
# Check container logs
docker logs llama-proxy

# Check for port conflicts
sudo lsof -i :3000

# Verify volume permissions
docker exec llama-proxy ls -la /app/data

# Test network connectivity from container
docker exec llama-proxy curl -v http://localhost:3000

# Rebuild without cache
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Connection Refused

Connection refused errors indicate network or service issues:

```bash
# Verify service is running
sudo systemctl status llama-proxy

# Check if listening on correct port
sudo ss -tlnp | grep 3000

# Test local connectivity
curl -v http://127.0.0.1:3000

# Check firewall rules
sudo ufw status verbose

# Verify reverse proxy configuration
sudo nginx -t
```

### WebSocket Not Working

WebSocket connection failures require specific diagnostics:

```bash
# Test WebSocket upgrade headers
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
    http://localhost:3000/socket.io/?EIO=4&transport=websocket

# Check for proxy configuration issues
# Verify Nginx proxy_set_header directives
# Ensure Upgrade and Connection headers pass through

# Monitor WebSocket connections
sudo journalctl -u llama-proxy | grep -i websocket
```

### Performance Issues

Address slow response times and resource exhaustion:

```bash
# Check memory usage
free -h
sudo systemctl status llama-proxy

# Monitor CPU usage
top -p $(pgrep -f "pnpm start")

# Check for memory leaks
# Compare memory usage over time
ps aux | grep node

# Increase Node.js memory
sudo systemctl edit llama-proxy
# Add: Environment=NODE_OPTIONS=--max-old-space-size=4096

# Restart service
sudo systemctl restart llama-proxy
```

### Model Loading Failures

When models fail to load, verify these requirements:

```bash
# Check model file permissions
ls -la models/*.gguf

# Verify GGUF file format
file models/*.gguf

# Check available memory
free -h

# Review llama-server logs
sudo journalctl -u llama-proxy | grep -i model

# Test llama-server directly
/usr/local/bin/llama-server --models-dir /opt/llama-proxy/models --models-max 1 &
```

### Database Corruption

SQLite database issues require careful handling:

```bash
# Check database integrity
sqlite3 /opt/llama-proxy/data/llama-dashboard.db "PRAGMA integrity_check;"

# Attempt recovery
sqlite3 /opt/llama-proxy/data/llama-dashboard.db ".recover" > /tmp/recovered.db
mv /opt/llama-proxy/data/llama-dashboard.db /opt/llama-proxy/data/llama-dashboard.db.broken
mv /tmp/recovered.db /opt/llama-proxy/data/llama-dashboard.db

# Restore from backup if recovery fails
cp /var/backups/llama-proxy/llama-dashboard_20260111_020000.db.gz .
gunzip llama-dashboard_20260111_020000.db.gz
```

---

## Quick Reference

### Essential Commands

```bash
# Start service
sudo systemctl start llama-proxy

# Stop service
sudo systemctl stop llama-proxy

# Restart service
sudo systemctl restart llama-proxy

# View logs
sudo journalctl -u llama-proxy -f

# Check health
curl http://localhost:3000/health

# Reload configuration
sudo systemctl reload llama-proxy
```

### File Locations

| Path | Purpose |
|------|---------|
| `/opt/llama-proxy` | Application installation |
| `/etc/llama-proxy/environment` | Environment configuration |
| `/var/log/llama-proxy` | Application logs |
| `/var/backups/llama-proxy` | Database backups |
| `/etc/systemd/system/llama-proxy.service` | Systemd unit file |

### Support Resources

- GitHub Issues: Report bugs and request features
- Documentation: See /docs/ for architecture and API docs
- Logs: Full diagnostic information in journalctl output

---

**Document Version**: 1.0.0  
**Last Updated**: January 2026  
**Maintained By**: Development Team
