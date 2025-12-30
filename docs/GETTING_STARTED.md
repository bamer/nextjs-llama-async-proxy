# Getting Started Guide

Welcome to Next.js Llama Async Proxy! This guide will help you get up and running with the application.

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** installed
- **pnpm 9+** package manager (required - not npm or yarn)
- **llama-server binary** available on your system
- **GGUF model files** in a designated directory
- Modern web browser (Chrome, Firefox, Safari, or Edge)

## Quick Start

### 1. Clone and Install

```bash
# Clone repository
git clone <repository-url>
cd nextjs-llama-async-proxy

# Install dependencies with pnpm
pnpm install
```

### 2. Configure llama-server

Create `llama-server-config.json` in the project root:

```json
{
  "host": "localhost",
  "port": 8134,
  "basePath": "/path/to/your/models",
  "serverPath": "/path/to/llama-server",
  "ctx_size": 8192,
  "batch_size": 512,
  "threads": -1,
  "gpu_layers": -1
}
```

**Configuration Fields:**

| Field | Description | Default |
|--------|-------------|----------|
| `host` | Llama server host address | `"localhost"` |
| `port` | Llama server port | `8134` |
| `basePath` | Directory containing GGUF model files | `./models` |
| `serverPath` | Full path to llama-server binary | `/usr/local/bin/llama-server` |
| `ctx_size` | Context window size (tokens) | `8192` |
| `batch_size` | Processing batch size | `512` |
| `threads` | CPU threads (-1 for auto) | `-1` |
| `gpu_layers` | GPU layers to offload (-1 for all) | `-1` |

### 3. Start Development Server

```bash
pnpm dev
```

The application will start on [http://localhost:3000](http://localhost:3000).

## First Time Setup

### 1. Configure Application Settings

Navigate to **Settings** (gear icon in sidebar):

1. **Llama Server Configuration**
   - Verify host and port settings match your setup
   - Set correct `basePath` to your model directory
   - Configure server path to llama-server binary

2. **Theme Settings**
   - Choose dark or light mode
   - Theme preference is saved automatically

3. **Performance Settings**
   - Adjust update intervals (defaults: metrics 10s, models 30s, logs 15s)
   - Enable/disable notification sounds

### 2. Discover Models

1. Navigate to **Models** page
2. Click **"Discover Models"** button
3. The system will scan your `basePath` directory for `.gguf` and `.bin` files
4. Review discovered models in the table
5. Models are automatically registered and ready to load

### 3. Load Your First Model

1. From the Models page, find your desired model
2. Click the **"Load"** button
3. Configure loading parameters (optional):
   - **Context Size**: Maximum context length (default: 8192)
   - **GPU Layers**: Number of layers to offload to GPU (-1 for all)
   - **Threads**: CPU threads to use (-1 for auto)
   - **Batch Size**: Processing batch size (default: 512)
4. Click **"Load Model"** to start
5. Monitor loading progress in the status column

### 4. Monitor Your Model

Navigate to the **Dashboard** to see:
- Real-time CPU and memory usage
- GPU metrics (if available)
- Active models count
- Request throughput
- Server uptime

Navigate to the **Monitoring** page to view:
- Historical performance charts
- Memory trends over time
- Request latency patterns
- Export metrics as CSV

## Advanced Features

### WebSocket Reconnection

The application automatically handles connection issues:

- **Automatic Reconnection**: Attempts to reconnect with exponential backoff
- **Reconnection Progress**: Shows attempt count (e.g., "RECONNECTING (2/5)...")
- **Data Resubscription**: Automatically requests metrics, models, logs after reconnect
- **Page Visibility**: Reconnects when you return to the tab

### Model Templates

Save and reuse model configurations:

1. Load a model with your preferred settings
2. Click **"Save Template"** button
3. Enter a template name
4. Template is saved to `src/config/model-templates.json`
5. Next time, select template from dropdown when loading model

Templates are validated with Zod schemas for type safety.

### Configuration Management

The application uses a normalized database for persistent configuration:

**Database Location**: `./data/llama-dashboard.db`

**Schema Version**: 2.0 (normalized architecture)

**Tables:**
- `models` - Core model data
- `model_sampling_config` - Sampling parameters (temperature, top_p, etc.)
- `model_memory_config` - Memory settings (cache, mmap, mlock)
- `model_gpu_config` - GPU configuration (gpu_layers, device)
- `model_advanced_config` - Advanced options (flash_attn, pooling)
- `model_lora_config` - LoRA adapters and draft models
- `model_multimodal_config` - Multimodal settings (mmproj)
- `model_server_config` - Global server defaults (independent)

When you delete a model, all related configurations are automatically deleted (CASCADE DELETE).

### Logging System

All application and system logs are available in real-time:

**Access Logs:**
- Navigate to **Logs** page
- Real-time log streaming via WebSocket
- Filter by log level (error, warning, info, debug)
- Search for specific text
- Export logs as text or CSV

**Log Storage:**
- Daily rotated files in `logs/` directory
- Application logs: `logs/application-YYYY-MM-DD.log`
- Error logs: `logs/errors-YYYY-MM-DD.log`
- Configurable retention period

**Winston Logger:**
The application uses Winston 3.19.0 as the sole logging system:
- Console transport for terminal output
- File transport for persistent storage
- WebSocket transport for real-time UI streaming

## Common Workflows

### Workflow 1: Load Multiple Models

1. Go to **Models** page
2. Use checkboxes to select multiple models
3. Click **"Load Selected"** button
4. Models load sequentially to avoid resource conflicts
5. Monitor progress in status column

### Workflow 2: Optimize Performance

1. Start with default parameters
2. Load model and monitor performance
3. Navigate to **Monitoring** page
4. Adjust parameters:
   - Reduce context size for faster inference
   - Increase GPU layers if GPU available
   - Lower temperature for more deterministic output
   - Adjust batch size based on hardware
5. Save optimized configuration as template

### Workflow 3: Troubleshooting Connection Issues

1. Check **Dashboard** connection status chip
   - **Green**: Connected
   - **Orange/Yellow**: Reconnecting (shows attempt count)
   - **Red**: Disconnected

2. If **Red**:
   - Check llama-server is running
   - Verify host and port in Settings
   - Check firewall settings
   - Review Logs page for error messages

3. If **Reconnecting**:
   - Wait for automatic reconnection (up to 5 attempts)
   - Check network connectivity
   - If max attempts reached, try refreshing page

### Workflow 4: Backup Configuration

1. **Database Backup**:
   ```bash
   pnpm db:export
   # Backup saved to data/backup/llama-dashboard-backup.db
   ```

2. **Configuration File Backup**:
   ```bash
   cp llama-server-config.json llama-server-config.json.backup
   cp src/config/model-templates.json model-templates.json.backup
   ```

3. **Log Export**:
   - Go to **Logs** page
   - Click **"Download Logs"** button
   - Select export format (text or CSV)

### Workflow 5: Restore from Backup

1. **Database Restore**:
   ```bash
   pnpm db:import
   # Restore from data/backup/llama-dashboard-backup.db
   ```

2. **Configuration Restore**:
   ```bash
   cp llama-server-config.json.backup llama-server-config.json
   cp model-templates.json.backup src/config/model-templates.json
   ```

## Tips and Best Practices

### Performance Tips

1. **GPU Acceleration**: Enable GPU layers if you have a compatible GPU
2. **Quantized Models**: Use Q4_K_M or Q5_K_M for better performance
3. **Context Size**: Start with 8192, increase only if needed
4. **Batch Size**: Higher values improve throughput but use more memory
5. **Unload Unused Models**: Free up memory by stopping unused models

### Resource Management

1. **Monitor Resources**: Use Dashboard to track CPU, memory, GPU usage
2. **Start Small**: Load one model first, test performance
3. **Adjust Parameters**: Tune settings based on your hardware
4. **Use Templates**: Save successful configurations for quick reuse

### Troubleshooting

1. **Check Logs**: Always review Logs page for error details
2. **Verify Configuration**: Ensure paths and settings are correct
3. **Test Connection**: Use health check API if available
4. **Restart Server**: Try stopping and restarting llama-server
5. **Clear Cache**: Restart application if experiencing issues

## Development Commands

### Available Scripts

```bash
# Development
pnpm dev              # Start dev server with tsx
pnpm dev:debug       # Development with debug logging

# Build & Production
pnpm build           # Production build (Turbopack)
pnpm start           # Start production server

# Testing
pnpm test            # Run all Jest tests
pnpm test:watch      # Run tests in watch mode
pnpm test:coverage   # Generate coverage report

# Linting & Type Checking
pnpm lint            # Run ESLint
pnpm lint:fix        # Auto-fix linting issues
pnpm type:check      # TypeScript type check

# Database Management
pnpm db:export       # Export database backup
pnpm db:import       # Import database from backup
pnpm db:vacuum       # Optimize database
pnpm db:reset        # Reset database (delete all models)
```

## Next Steps

1. **Explore the Interface**: Navigate through all pages to familiarize yourself
2. **Load Your First Model**: Follow the model loading workflow
3. **Customize Settings**: Adjust configuration to your needs
4. **Monitor Performance**: Use dashboard and monitoring pages
5. **Save Templates**: Create templates for your workflows
6. **Read Documentation**: Check `docs/` folder for detailed guides

## Additional Resources

- **[USER_GUIDE.md](USER_GUIDE.md)** - Comprehensive user manual
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture details
- **[API_REFERENCE.md](API_REFERENCE.md)** - Complete API documentation
- **[DEVELOPMENT_SETUP.md](DEVELOPMENT_SETUP.md)** - Development environment guide

## Support

For issues or questions:

1. Check this getting started guide
2. Review the USER_GUIDE.md for detailed workflows
3. Check application logs for error details
4. Create a new issue with detailed information

---

**Version**: 0.2.0
**Last Updated**: December 30, 2025
