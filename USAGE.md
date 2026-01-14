# Llama Async Proxy Dashboard - User Guide

## Getting Started

### Accessing the Dashboard
Once the application is running, access the dashboard at:
- **URL:** http://localhost:3000
- **WebSocket:** ws://localhost:3000/llamaproxws

### Dashboard Overview

The dashboard consists of several main sections:

1. **Navigation Bar** - Top menu for accessing different pages
2. **Main Content Area** - Displays current page content
3. **Status Indicators** - Real-time connection and system status
4. **Notifications** - User feedback messages

## Main Features

### 1. Model Management

#### Viewing Models
- Navigate to **Models** page from the navigation bar
- View all available GGUF models in the models directory
- See model status: loaded, loading, unloaded, or error

#### Loading Models
1. Go to the Models page
2. Find the model you want to load
3. Click **Load** button
4. Wait for loading to complete (status changes to "loaded")

#### Unloading Models
1. Go to the Models page
2. Find a loaded model
3. Click **Unload** button
4. Model status changes to "unloaded"

#### Model Information
Each model displays:
- Model name and file size
- Current status
- Memory usage (when loaded)
- Last accessed time

### 2. Preset Management

#### Creating Presets
1. Navigate to **Settings** → **Presets**
2. Click **New Preset**
3. Enter preset name and description
4. Configure model parameters:
   - Context size
   - GPU layers
   - Temperature
   - Other sampling parameters
5. Click **Save**

#### Applying Presets
1. Go to Models or Settings page
2. Select a preset from the dropdown
3. Click **Apply** to use preset settings

#### Preset Inheritance
Presets can inherit settings from other presets:
- Parent presets define base settings
- Child presets override specific parameters
- Inheritance chain visible in preset details

### 3. Monitoring

#### Real-Time Metrics
Access the **Monitoring** page to view:

**System Metrics:**
- CPU usage percentage
- Memory usage (used/total)
- Disk space usage
- GPU metrics (if available)

**Llama Server Metrics:**
- Active connections
- Request queue length
- Processing time statistics
- Model loading status

#### Metrics History
- View historical data charts
- Select time ranges (1h, 6h, 24h, 7d)
- Export metrics data

### 4. Configuration

#### Server Configuration
Navigate to **Settings** → **Configuration** to modify:

**General Settings:**
- Server port and host
- Logging level
- Session timeout

**Llama Settings:**
- Default context size
- Maximum loaded models
- GPU layer offloading
- Thread count

**Database Settings:**
- Backup schedule
- Data retention period
- Export options

#### Configuration Changes
1. Edit configuration values
2. Click **Save Configuration**
3. Restart server if required (noted in save confirmation)

### 5. Logs

#### Viewing Logs
Navigate to **Logs** page to view:

**Log Types:**
- Application logs
- Llama server logs
- Error logs
- Access logs

**Log Features:**
- Real-time log streaming
- Log level filtering (debug, info, warn, error)
- Search and filter by text
- Log export functionality

#### Log Filtering
```
Filter by level:
[ ] Debug [✓] Info [✓] Warn [✓] Error

Search: <search text>
```

## User Workflows

### First-Time Setup
1. **Configure llama-server path** in Settings → Configuration
2. **Set models directory** to your GGUF model location
3. **Create initial preset** with desired defaults
4. **Load your first model** to test setup

### Daily Usage
1. **Start dashboard** with `pnpm start`
2. **Load models** as needed for your tasks
3. **Apply presets** to configure model behavior
4. **Monitor system resources** on Monitoring page
5. **Check logs** if any issues occur

### Model Experimentation
1. **Create multiple presets** with different parameters
2. **Compare model performance** across presets
3. **Iterate on settings** based on results
4. **Save successful configurations** as named presets

## Tips and Best Practices

### Performance Optimization
- Use appropriate context sizes for your use case
- Limit loaded models to reduce memory usage
- Monitor GPU memory if using GPU offloading
- Use presets to quickly switch between configurations

### Resource Management
- Unload models when not in use
- Set reasonable limits on concurrent connections
- Configure log rotation to manage disk space
- Regular database backups

### Troubleshooting
- Check **Logs** page for error messages
- Use **Monitoring** to identify resource bottlenecks
- Review **Configuration** for incorrect settings
- Restart server after major configuration changes

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + /` | Focus search |
| `Ctrl + n` | New preset |
| `Ctrl + r` | Refresh data |
| `Ctrl + s` | Save configuration |
| `Esc` | Close modal/dialog |

## Frequently Asked Questions

### How do I add more models?
Simply copy GGUF files to your models directory and they will appear in the Models list automatically.

### Can I use multiple llama-server instances?
The dashboard manages a single llama-server instance in router mode for efficiency.

### How do I backup my configuration?
Use `pnpm db:export` to create a database backup.

### What if the dashboard doesn't start?
Check logs for error messages. Common issues:
- Port already in use
- Missing llama-server binary
- Database corruption (try `pnpm db:reset`)

### How do I update the application?
```bash
git pull
pnpm install
pnpm start
```

## Getting Help

- **Documentation:** See INSTALL.md and API.md
- **Architecture:** See docs/ARCHITECTURE.md
- **Development:** See docs/development/README.md
- **Issues:** Report bugs via project issue tracker

## Next Steps

After familiarizing yourself with the dashboard, explore:
- [API.md](API.md) for developer integration
- [docs/README.md](docs/README.md) for advanced topics
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for technical details
