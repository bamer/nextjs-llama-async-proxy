# User Guide - Next.js Llama Async Proxy

A comprehensive guide for users of Next.js Llama Async Proxy web interface for managing Llama AI models.

## Overview

The Next.js Llama Async Proxy provides a modern web interface for managing Llama AI models through llama-server binary. This guide covers all user workflows from initial setup to advanced model management.

## Getting Started

### Prerequisites

Before using the application, ensure you have:

- **Node.js 18+** installed
- **llama-server binary** available on your system
- **GGUF model files** in a designated directory
- **Web browser** (Chrome, Firefox, Safari, or Edge recommended)

### Quick Start

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd nextjs-llama-async-proxy
   pnpm install
   ```

2. **Configure llama-server**
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

3. **Start Application**
   ```bash
   pnpm dev
   ```

4. **Open in Browser**
   Navigate to `http://localhost:3000`

## Interface Overview

### Main Navigation

The application features a sidebar navigation with the following sections:

- **🏠 Dashboard** - Overview and real-time metrics
- **🤖 Models** - Model discovery and management
- **📊 Monitoring** - Performance charts and analytics
- **📋 Logs** - Real-time log streaming
- **⚙️ Settings** - Configuration and preferences

### Theme Support

The application supports both light and dark themes:

- Click the theme toggle button in the header
- Theme preference is automatically saved
- Supports system theme detection
- Uses MUI v7 theme system

### Responsive Design

- Mobile-first approach with Tailwind CSS v4
- Sidebar collapses on smaller screens
- Responsive charts and tables
- Touch-friendly controls

## Dashboard

### Overview Metrics

The dashboard displays real-time system metrics:

- **CPU Usage** - Current processor utilization percentage
- **Memory Usage** - RAM consumption percentage
- **GPU Metrics** - Graphics card utilization (if available)
- **Active Models** - Number of loaded models
- **Request Throughput** - API request rate per second
- **Uptime** - Server uptime in hours/minutes

### Quick Actions

- **Load Model** - Quick access to model loading interface
- **View Logs** - Jump to log monitoring page
- **System Health** - Overall system status indicator (healthy/unhealthy)
- **Refresh Metrics** - Manually refresh dashboard data

### Real-time Updates

All dashboard metrics update automatically:
- System metrics: Every 10 seconds
- Model status: Every 30 seconds
- Request counts: Real-time via WebSocket
- GPU metrics: Every 10 seconds

### Performance Cards

Dashboard displays performance cards for:
- **System Health** - Overall status
- **CPU Performance** - Load average and cores
- **Memory Status** - Used/total/free RAM
- **GPU Status** - If available, shows GPU utilization
- **Network** - Active connections
- **Active Requests** - Current API requests

## Model Management

### Discovering Models

1. Navigate to **Models** page
2. Click **"Discover Models"** button
3. The system will scan configured directories (from `basePath`) for `.gguf` and `.bin` files
4. Review discovered models in the table
5. Models are automatically registered and ready to load

### Loading a Model

1. From Models page, find your desired model
2. Click **"Load"** button next to the model
3. Configure loading parameters (optional):
   - **Context Size**: Maximum context length (default: 8192)
   - **GPU Layers**: Number of layers to offload to GPU (default: -1 for all)
   - **Threads**: CPU threads to use (-1 for auto)
   - **Batch Size**: Processing batch size (default: 512)
4. Click **"Load Model"** to start the process
5. Monitor loading progress in the status column

### Model Status Indicators

- **🟢 Running** - Model is loaded and ready for inference
- **🟡 Loading** - Model is currently being loaded
- **🔴 Stopped** - Model is unloaded
- **❌ Error** - Model failed to load
- **🔵 Discovered** - Model found but not loaded

### Unloading Models

1. Click **"Unload"** button next to a running model
2. Confirm the action in the dialog
3. The model will be gracefully unloaded from memory
4. Memory is freed up for other models

### Model Information

Each model entry shows:
- **Name** - Model identifier
- **Size** - File size on disk (e.g., "3.5 GB")
- **Format** - Model format (GGUF, BIN)
- **Family** - Model architecture family (llama, mistral, etc.)
- **Status** - Current loading status
- **Memory Usage** - RAM consumption when loaded
- **Quantization** - Model quantization level (Q4_K_M, Q8_0, etc.)

### Model Filters

Use the filter controls to:
- Search by model name
- Filter by model status
- Sort by size, name, or status

## Monitoring

### Performance Charts

The Monitoring page provides detailed performance visualization:

#### System Metrics
- **CPU Usage Over Time** - Historical CPU utilization with percentage
- **Memory Usage Trends** - RAM consumption patterns over time
- **GPU Utilization** - Graphics processing unit usage (if available)
- **Network I/O** - Data transfer rates over time
- **Disk Usage** - Storage usage percentage

#### Model Performance
- **Active Models Timeline** - When models were loaded/unloaded
- **Memory per Model** - RAM usage breakdown by model
- **Request Latency** - API response times in milliseconds
- **Throughput** - Requests per second over time

### Metrics Configuration

- **Time Range**: Select from 1 hour, 6 hours, 24 hours, 7 days
- **Resolution**: Choose data granularity (1m, 5m, 15m, 1h)
- **Auto-refresh**: Toggle automatic chart updates
- **Chart Type**: Switch between line, area, and bar charts

### Exporting Data

- Click **"Export"** button to download metrics as CSV
- Includes timestamped data for all visible charts
- Useful for external analysis or reporting
- Format: CSV with timestamp and metric values

### Performance Alerts

Configure alerts for:
- **High CPU Usage**: Alert when CPU exceeds threshold (e.g., 90%)
- **High Memory Usage**: Alert when memory exceeds threshold
- **Model Load Time**: Alert when loading takes too long
- **Error Rate**: Alert when error rate exceeds threshold

## Log Monitoring

### Log Stream

The Logs page displays real-time log output:

#### Color-coded Levels
- 🔴 **Error** - Critical errors and failures (red)
- 🟠 **Warning** - Important warnings (orange)
- 🔵 **Info** - General information (blue)
- 🟣 **Debug** - Detailed debugging information (purple)

#### Log Sources
- **llama-server** - Logs from the AI model server
- **proxy** - Logs from the proxy application
- **system** - Operating system level logs
- **service** - Service registry logs

### Log Filtering

1. Use the filter dropdowns to show/hide log levels
2. Search for specific text in log messages
3. Filter by timestamp range
4. Select specific sources to monitor
5. Filter by log keywords

**Filter Controls:**
- **Level checkboxes**: Enable/disable log levels
- **Source dropdown**: Select log sources
- **Search box**: Search log messages
- **Date range picker**: Filter by time period

### Log Export

- **Download Logs** - Export visible logs as text file
- **Copy to Clipboard** - Copy selected log entries
- **Clear Logs** - Remove old log entries from view
- **Export CSV** - Download as CSV for analysis

### Log Persistence

- Logs are automatically saved to disk by Winston
- Configurable log rotation (daily files)
- Files saved to `logs/application-YYYY-MM-DD.log`
- Error logs saved separately to `logs/errors-YYYY-MM-DD.log`
- Maximum log history retention (configurable)

## Settings

### Application Settings

#### Theme Configuration
- **Dark/Light Mode** - Choose preferred theme
- **Auto Theme** - Follow system preference
- **Accent Color** - Customize UI color scheme

#### Performance Settings
- **Update Intervals** - Configure refresh rates:
  - Metrics: 5-60 seconds (default: 10s)
  - Models: 10-120 seconds (default: 30s)
  - Logs: 5-60 seconds (default: 15s)

#### Notification Settings
- **Model Load Alerts** - Notify when models finish loading
- **Error Notifications** - Alert on system errors
- **Performance Warnings** - Notify on high resource usage
- **Sound Alerts** - Enable/disable notification sounds

### Llama Server Configuration

#### Server Settings (Uses API, NOT localStorage)
- **Host** - Server hostname or IP address
- **Port** - Server port number (default: 8134)
- **Timeout** - Request timeout in milliseconds
- **Server Path** - Full path to llama-server binary

**Important**: These settings are saved to `llama-server-config.json` via the API, not localStorage.

#### Model Directories
- **Base Path** - Primary directory for model files
- **Auto-discovery** - Enable automatic model detection
- **Recursive Scan** - Scan subdirectories for models

#### Default Parameters
- **Context Size** - Default context window size (default: 8192)
- **GPU Layers** - Default GPU offloading (-1 for all)
- **Threads** - CPU thread count (-1 for auto)
- **Batch Size** - Processing batch size (default: 512)

### Configuration Management

The Settings page uses **API endpoints** for configuration management:

- **GET /api/config**: Reads configuration from `llama-server-config.json`
- **POST /api/config**: Saves configuration to `llama-server-config.json`

Configuration is stored in a JSON file at the project root, not in localStorage.

### Advanced Settings

#### System Integration
- **Auto-start** - Launch on system boot (requires configuration)
- **System Tray** - Minimize to system tray (future feature)
- **Keyboard Shortcuts** - Custom hotkeys

#### Security Settings
- **API Access** - Configure API permissions (future)
- **CORS Policy** - Cross-origin request settings
- **Rate Limiting** - Request throttling configuration (future)

## Advanced Usage

### Batch Operations

#### Multiple Model Loading
1. Select multiple models using checkboxes
2. Click **"Load Selected"** button
3. Models will load sequentially to avoid resource conflicts
4. Monitor progress in the status column

#### Bulk Configuration
1. Use **"Batch Config"** feature in Settings
2. Apply parameter changes to multiple models at once
3. Useful for A/B testing different configurations

### Custom Model Parameters

#### Parameter Groups
Models support extensive configuration:

**Generation Parameters:**
- **Temperature** (0.0-2.0): Controls creativity vs consistency
- **Top-p** (0.0-1.0): Nucleus sampling parameter
- **Top-k** (1-100): Top-k sampling parameter
- **Max Tokens** (1-4096): Maximum output length
- **Repeat Penalty** (1.0-2.0): Repetition prevention

**Performance Parameters:**
- **Context Size** (512-32768): Working memory size
- **GPU Layers** (0-100): GPU acceleration level
- **Threads** (1-64): CPU thread utilization
- **Batch Size** (1-512): Processing batch size

### API Integration

#### REST API Usage
The application exposes a full REST API for automation:

```bash
# Get configuration
curl http://localhost:3000/api/config

# Update configuration
curl -X POST http://localhost:3000/api/config \
  -H "Content-Type: application/json" \
  -d '{"host":"localhost","port":8134,"basePath":"/models"}'

# List models
curl http://localhost:3000/api/models

# Load a model
curl -X POST http://localhost:3000/api/models/llama-2-7b/load \
  -H "Content-Type: application/json" \
  -d '{"config": {"temperature": 0.7}}'

# Get metrics
curl http://localhost:3000/api/monitoring
```

#### WebSocket Streaming
Real-time data via WebSocket:

```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:3000', {
  path: '/llamaproxws'
});

// Subscribe to metrics
socket.on('connect', () => {
  socket.emit('subscribe', { type: 'metrics' });
});

// Listen for metrics
socket.on('metrics_update', (data) => {
  console.log('CPU:', data.cpu);
  console.log('Memory:', data.memory);
});

// Subscribe to model updates
socket.emit('subscribe', { type: 'models' });
socket.on('models_update', (data) => {
  console.log('Active models:', data.models.length);
});

// Subscribe to logs
socket.emit('subscribe', { type: 'logs' });
socket.on('logs_update', (data) => {
  console.log('Logs:', data.logs);
});
```

### Troubleshooting

#### Common Issues

**Model Won't Load**
- Check if llama-server binary exists and is executable
- Verify model file path and permissions
- Ensure sufficient RAM/GPU memory available
- Check system logs for detailed error messages
- Verify `basePath` configuration is correct

**Slow Performance**
- Reduce context size for faster inference
- Increase GPU layers if GPU available
- Lower quality parameters (temperature, top-p)
- Check system resource usage
- Close other applications to free resources

**Connection Issues**
- Verify server port is not blocked by firewall
- Check network connectivity to localhost
- Ensure no other applications using the same port
- Review application logs for connection errors

**High Memory Usage**
- Unload unused models
- Reduce context size
- Use quantized models (GGUF format)
- Monitor memory usage in dashboard
- Increase system RAM if possible

**Configuration Not Saving**
- Ensure `llama-server-config.json` exists in project root
- Check file permissions for reading/writing
- Verify JSON syntax is valid
- Check API endpoint is accessible: GET /api/config
- Review server logs for error messages

#### Log Analysis

**Reading Error Logs**
- Look for specific error codes and messages
- Check timestamps for when issues occurred
- Note any patterns in error frequency
- Use log filtering to focus on specific components
- Check error logs in `logs/errors-YYYY-MM-DD.log`

**Performance Debugging**
- Monitor CPU/GPU usage during model loading
- Check memory allocation patterns
- Review request latency trends
- Compare performance across different configurations
- Use monitoring page to analyze trends

### Backup and Recovery

#### Configuration Backup
1. Go to Settings → Export Configuration
2. Save the JSON file to a safe location
3. Include model paths and parameter settings
4. Also backup `llama-server-config.json` from project root

#### Log Archival
- Logs are automatically rotated daily
- Manual export available from Logs page
- Compressed archives for long-term storage
- Files stored in `logs/` directory

#### Model Recovery
- Model files are not modified by the application
- Re-scan directories to rediscover models
- Configuration persists across restarts
- Model files remain in `basePath` directory

## Best Practices

### Model Management
- **Load only needed models** to conserve memory
- **Use appropriate context sizes** for your use case
- **Monitor resource usage** during model loading
- **Unload models** when not in use
- **Use quantized models** (Q4_K_M, Q5_K_M) for better performance

### Performance Optimization
- **Enable GPU acceleration** if available
- **Use appropriate GPU layers** based on GPU memory
- **Configure appropriate batch sizes** for your hardware
- **Monitor and adjust** parameters based on results
- **Use lower quantization** for better quality (at cost of size)

### System Maintenance
- **Regular log review** for early issue detection
- **Monitor disk space** for log and model storage
- **Keep llama-server updated** for latest features
- **Backup configurations** before major changes
- **Clear old logs** periodically to save disk space

### Security Considerations
- **Run on trusted networks** (currently no authentication)
- **Monitor access logs** for unauthorized access
- **Keep dependencies updated** for security patches
- **Use strong passwords** when authentication is added (future)
- **Review firewall rules** to restrict access

## Keyboard Shortcuts

- **`Ctrl/Cmd + K`** - Focus search/command palette
- **`Ctrl/Cmd + B`** - Toggle sidebar
- **`Ctrl/Cmd + Shift + T`** - Switch theme
- **`Ctrl/Cmd + R`** - Refresh current page
- **`Escape`** - Close modals/dialogs
- **`F5`** - Full page refresh

## Support and Resources

### Getting Help
1. Check **Troubleshooting** section above
2. Review application logs for error details
3. Check GitHub issues for similar problems
4. Create a new issue with detailed information

### Community Resources
- **GitHub Repository** - Source code and documentation
- **Issues** - Bug reports and feature requests
- **Discussions** - Community support and questions
- **Wiki** - Additional guides and tutorials

### System Requirements
- **Minimum**: 4GB RAM, modern web browser, Node.js 18+
- **Recommended**: 16GB+ RAM, dedicated GPU, SSD storage
- **Supported OS**: Linux, macOS, Windows (WSL)

---

**User Guide - Next.js Llama Async Proxy**
**Version 0.1.0 - December 27, 2025**
