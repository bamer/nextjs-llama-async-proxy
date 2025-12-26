# User Guide - Next.js Llama Async Proxy

A comprehensive guide for users of the Next.js Llama Async Proxy web interface for managing Llama AI models.

## Overview

The Next.js Llama Async Proxy provides a modern web interface for managing Llama AI models through the llama-server binary. This guide covers all user workflows from initial setup to advanced model management.

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

2. **Configure Model Path**
   Create `.llama-proxy-config.json`:
   ```json
   {
     "llama_server_host": "localhost",
     "llama_server_port": 8134,
     "llama_server_path": "/path/to/llama-server",
     "basePath": "./models"
   }
   ```

3. **Start the Application**
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

## Dashboard

### Overview Metrics

The dashboard displays real-time system metrics:

- **CPU Usage** - Current processor utilization
- **Memory Usage** - RAM consumption
- **GPU Metrics** - Graphics card utilization (if available)
- **Active Models** - Number of loaded models
- **Request Throughput** - API request rate

### Quick Actions

- **Load Model** - Quick access to model loading
- **View Logs** - Jump to log monitoring
- **System Health** - Overall system status indicator

### Real-time Updates

All dashboard metrics update automatically:
- System metrics: Every 10 seconds
- Model status: Every 30 seconds
- Request counts: Real-time

## Model Management

### Discovering Models

1. Navigate to the **Models** page
2. Click **"Discover Models"** button
3. The system will scan configured directories for `.gguf` and `.bin` files
4. Review discovered models in the table

### Loading a Model

1. From the Models page, find your desired model
2. Click the **"Load"** button next to the model
3. Configure loading parameters (optional):
   - **Context Size**: Maximum context length (default: 4096)
   - **GPU Layers**: Number of layers to offload to GPU (default: 0)
   - **Temperature**: Randomness control (default: 0.7)
4. Click **"Load Model"** to start the process
5. Monitor loading progress in the status column

### Model Status Indicators

- **🟢 Running** - Model is loaded and ready for inference
- **🟡 Loading** - Model is currently being loaded
- **🔴 Stopped** - Model is unloaded
- **❌ Error** - Model failed to load

### Unloading Models

1. Click the **"Unload"** button next to a running model
2. Confirm the action in the dialog
3. The model will be gracefully unloaded from memory

### Model Information

Each model entry shows:
- **Name** - Model identifier
- **Size** - File size on disk
- **Format** - Model format (GGUF, etc.)
- **Family** - Model architecture family
- **Status** - Current loading status
- **Memory Usage** - RAM consumption when loaded

## Monitoring

### Performance Charts

The Monitoring page provides detailed performance visualization:

#### System Metrics
- **CPU Usage Over Time** - Historical CPU utilization
- **Memory Usage Trends** - RAM consumption patterns
- **GPU Utilization** - Graphics processing unit usage
- **Network I/O** - Data transfer rates

#### Model Performance
- **Active Models Timeline** - When models were loaded/unloaded
- **Memory per Model** - RAM usage breakdown by model
- **Request Latency** - API response times

### Metrics Configuration

- **Time Range**: Select from 1 hour to 7 days
- **Resolution**: Choose data granularity (1m, 5m, 15m, 1h)
- **Auto-refresh**: Toggle automatic chart updates

### Exporting Data

- Click **"Export"** button to download metrics as CSV
- Includes timestamped data for all visible charts
- Useful for external analysis or reporting

## Log Monitoring

### Log Stream

The Logs page displays real-time log output:

- **Color-coded Levels**:
  - 🔴 **Error** - Critical errors and failures
  - 🟠 **Warning** - Important warnings
  - 🔵 **Info** - General information
  - 🟣 **Debug** - Detailed debugging information

- **Source Filtering**:
  - **llama-server** - Logs from the AI model server
  - **proxy** - Logs from the proxy application
  - **system** - Operating system level logs

### Log Filtering

1. Use the filter dropdowns to show/hide log levels
2. Search for specific text in log messages
3. Filter by timestamp range
4. Select specific sources to monitor

### Log Export

- **Download Logs** - Export visible logs as text file
- **Copy to Clipboard** - Copy selected log entries
- **Clear Logs** - Remove old log entries from view

### Log Persistence

- Logs are automatically saved to disk
- Configurable log rotation (daily files)
- Maximum log history retention (configurable)

## Settings

### Application Settings

#### Theme Configuration
- **Dark/Light Mode** - Choose preferred theme
- **Auto Theme** - Follow system preference
- **Accent Color** - Customize UI color scheme

#### Performance Settings
- **Update Intervals** - Configure refresh rates:
  - Metrics: 5-60 seconds
  - Models: 10-120 seconds
  - Logs: 5-60 seconds

#### Notification Settings
- **Model Load Alerts** - Notify when models finish loading
- **Error Notifications** - Alert on system errors
- **Performance Warnings** - Notify on high resource usage

### Llama Server Configuration

#### Server Settings
- **Host** - Server hostname or IP address
- **Port** - Server port number
- **Timeout** - Request timeout in milliseconds
- **Path** - Full path to llama-server binary

#### Model Directories
- **Base Path** - Primary directory for model files
- **Additional Paths** - Extra directories to scan
- **Auto-discovery** - Enable automatic model detection

#### Default Parameters
- **Context Size** - Default context window size
- **GPU Layers** - Default GPU offloading
- **Temperature** - Default generation randomness
- **Max Tokens** - Default maximum output length

### Advanced Settings

#### System Integration
- **Auto-start** - Launch on system boot
- **System Tray** - Minimize to system tray
- **Keyboard Shortcuts** - Custom hotkeys

#### Security Settings
- **API Access** - Configure API permissions
- **CORS Policy** - Cross-origin request settings
- **Rate Limiting** - Request throttling configuration

## Advanced Usage

### Batch Operations

#### Multiple Model Loading
1. Select multiple models using checkboxes
2. Click **"Load Selected"** button
3. Models will load sequentially to avoid resource conflicts

#### Bulk Configuration
1. Use the **"Batch Config"** feature in Settings
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

**Performance Parameters:**
- **Context Size** (512-32768): Working memory size
- **GPU Layers** (0-100): GPU acceleration level
- **Threads** (1-64): CPU thread utilization
- **Batch Size** (1-512): Processing batch size

**Quality Parameters:**
- **Repeat Penalty** (1.0-2.0): Repetition prevention
- **Presence Penalty** (-2.0-2.0): Topic diversity
- **Frequency Penalty** (-2.0-2.0): Word diversity

### API Integration

#### REST API Usage
The application exposes a full REST API for automation:

```bash
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
const socket = io('http://localhost:3000');

// Listen for metrics
socket.on('metrics:update', (data) => {
  console.log('CPU:', data.cpu, 'Memory:', data.memory);
});

// Listen for model updates
socket.on('models:update', (data) => {
  console.log('Active models:', data.models.length);
});
```

### Troubleshooting

#### Common Issues

**Model Won't Load**
- Check if llama-server binary exists and is executable
- Verify model file path and permissions
- Ensure sufficient RAM/GPU memory available
- Check system logs for detailed error messages

**Slow Performance**
- Reduce context size for faster inference
- Increase GPU layers if GPU available
- Lower quality parameters (temperature, top-p)
- Check system resource usage

**Connection Issues**
- Verify server port is not blocked by firewall
- Check network connectivity to localhost
- Ensure no other applications using the same port
- Review application logs for connection errors

**High Memory Usage**
- Unload unused models
- Reduce context size
- Use quantized models (GGUF format)
- Monitor memory usage in the dashboard

#### Log Analysis

**Reading Error Logs**
- Look for specific error codes and messages
- Check timestamps for when issues occurred
- Note any patterns in error frequency
- Use log filtering to focus on specific components

**Performance Debugging**
- Monitor CPU/GPU usage during model loading
- Check memory allocation patterns
- Review request latency trends
- Compare performance across different configurations

### Backup and Recovery

#### Configuration Backup
1. Go to Settings → Export Configuration
2. Save the JSON file in a safe location
3. Include model paths and parameter settings

#### Log Archival
- Logs are automatically rotated daily
- Manual export available from Logs page
- Compressed archives for long-term storage

#### Model Recovery
- Model files are not modified by the application
- Re-scan directories to rediscover models
- Configuration persists across restarts

## Best Practices

### Model Management
- **Load only needed models** to conserve memory
- **Use appropriate context sizes** for your use case
- **Monitor resource usage** during model loading
- **Unload models** when not in use

### Performance Optimization
- **Enable GPU acceleration** if available
- **Use quantized models** for better performance
- **Configure appropriate batch sizes** for your hardware
- **Monitor and adjust** parameters based on results

### System Maintenance
- **Regular log review** for early issue detection
- **Monitor disk space** for log and model storage
- **Keep llama-server updated** for latest features
- **Backup configurations** before major changes

### Security Considerations
- **Run on trusted networks** (currently no authentication)
- **Monitor access logs** for unauthorized access
- **Keep dependencies updated** for security patches
- **Use strong passwords** when authentication is added

## Keyboard Shortcuts

- **`Ctrl/Cmd + K`** - Focus search/command palette
- **`Ctrl/Cmd + B`** - Toggle sidebar
- **`Ctrl/Cmd + Shift + T`** - Switch theme
- **`Ctrl/Cmd + R`** - Refresh current page
- **`Escape`** - Close modals/dialogs

## Support and Resources

### Getting Help
1. Check the **Troubleshooting** section above
2. Review application logs for error details
3. Check GitHub issues for similar problems
4. Create a new issue with detailed information

### Community Resources
- **GitHub Repository** - Source code and documentation
- **Issues** - Bug reports and feature requests
- **Discussions** - Community support and questions
- **Wiki** - Additional guides and tutorials

### System Requirements
- **Minimum**: 4GB RAM, modern web browser
- **Recommended**: 16GB+ RAM, dedicated GPU, SSD storage
- **Supported OS**: Linux, macOS, Windows (WSL)

---

*User Guide - Next.js Llama Async Proxy*
*Version 0.1.0 - December 26, 2025*