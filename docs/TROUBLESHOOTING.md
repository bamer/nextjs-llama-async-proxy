# Troubleshooting Guide - Next.js Llama Async Proxy

Comprehensive troubleshooting guide for common issues, errors, and problems in Next.js Llama Async Proxy.

## Table of Contents

- [Overview](#overview)
- [Common Issues](#common-issues)
- [Error Messages](#error-messages)
- [Performance Issues](#performance-issues)
- [Connection Problems](#connection-problems)
- [Database Issues](#database-issues)
- [WebSocket Issues](#websocket-issues)
- [Model Issues](#model-issues)
- [Configuration Issues](#configuration-issues)
- [Logging Issues](#logging-issues)
- [Development Issues](#development-issues)
- [Production Issues](#production-issues)
- [Getting Help](#getting-help)

---

## Overview

This guide covers common issues and their solutions. For issues not covered here, check the documentation or create a GitHub issue.

### Diagnostic Information

When troubleshooting, gather this information:

1. **Application Version**: Check `package.json` for version
2. **Node.js Version**: `node --version`
3. **Platform**: OS and version
4. **Error Messages**: Full error text and stack traces
5. **Logs**: Application logs from `logs/` directory
6. **Configuration**: Current configuration files
7. **Reproduction Steps**: Steps to reproduce the issue

### Common Troubleshooting Steps

1. **Check Logs**: Review application logs for errors
2. **Verify Configuration**: Ensure configuration files are valid
3. **Restart Services**: Restart the application and related services
4. **Check Dependencies**: Verify all dependencies are installed
5. **Update Dependencies**: Ensure you're using the latest versions
6. **Clear Cache**: Clear build and cache directories

---

## Common Issues

### Application Won't Start

**Symptoms**: Server fails to start, exits immediately

**Possible Causes**:
1. Port already in use
2. Missing configuration file
3. Invalid configuration JSON
4. Missing dependencies

**Solutions**:

1. **Check Port Usage**
   ```bash
   # Check if port 3000 is in use
   lsof -i :3000
   netstat -tulpn | grep :3000

   # Kill process using port 3000
   sudo kill -9 <PID>
   ```

2. **Verify Configuration File**
   ```bash
   # Check if llama-server-config.json exists
   ls -la llama-server-config.json

   # Validate JSON syntax
   python -m json.tool llama-server-config.json
   jq . llama-server-config.json
   ```

3. **Check Dependencies**
   ```bash
   # Reinstall dependencies
   rm -rf node_modules
   pnpm install
   ```

4. **Check Error Logs**
   ```bash
   # View latest logs
   tail -f logs/application-$(date +%Y-%m-%d).log
   ```

### Models Won't Load

**Symptoms**: Model loading fails or times out

**Possible Causes**:
1. Insufficient memory
2. Invalid model file
3. Incorrect model path
4. llama-server not accessible
5. Invalid model parameters

**Solutions**:

1. **Check Available Memory**
   ```bash
   # Check system memory
   free -h

   # Check GPU memory (if using GPU)
   nvidia-smi
   ```

2. **Verify Model File**
   ```bash
   # Check if model file exists
   ls -lh /path/to/model.gguf

   # Verify file integrity
   md5sum /path/to/model.gguf
   ```

3. **Check llama-server Connection**
   ```bash
   # Test connection to llama-server
   curl http://localhost:8134/health

   # Check if llama-server is running
   ps aux | grep llama-server
   ```

4. **Reduce Model Parameters**
   - Lower `ctx_size` (try 4096 instead of 8192)
   - Reduce `gpu_layers` if GPU memory is limited
   - Lower `batch_size` to reduce memory usage

5. **Review Logs for Errors**
   ```bash
   # View error logs
   tail -f logs/errors-$(date +%Y-%m-%d).log
   ```

### Slow Performance

**Symptoms**: Slow inference or response times

**Possible Causes**:
1. CPU-only inference
2. Insufficient memory
3. Large context size
4. Inefficient batch size
5. Too few GPU layers

**Solutions**:

1. **Enable GPU Acceleration**
   ```json
   {
     "gpu_layers": -1  // Offload all layers to GPU
   }
   ```

2. **Optimize Context Size**
   - Use smaller context for faster inference
   - Adjust based on your use case:
     - Simple Q&A: 2048-4096
     - Chat: 4096-8192
     - Documents: 8192+

3. **Increase GPU Layers**
   - Gradually increase `gpu_layers` until performance plateaus
   - Monitor GPU memory usage: `nvidia-smi`

4. **Optimize Batch Size**
   - Larger batches = faster processing
   - Try `batch_size: 512` for maximum speed

5. **Check System Resources**
   ```bash
   # Monitor CPU usage
   htop

   # Monitor memory usage
   free -h

   # Monitor GPU usage
   nvidia-smi -l 1
   ```

---

## Error Messages

### "EADDRINUSE: Address already in use"

**Cause**: Port is already in use by another application

**Solution**:
```bash
# Find process using the port
lsof -i :3000

# Kill the process
sudo kill -9 <PID>

# Or change the port in .env.local
PORT=3001
```

### "Failed to connect to llama-server"

**Cause**: llama-server is not running or not accessible

**Solution**:
```bash
# Check if llama-server is running
ps aux | grep llama-server

# Test connection
curl http://localhost:8134/health

# Start llama-server if not running
/path/to/llama-server --host localhost --port 8134
```

### "Model file not found"

**Cause**: Incorrect `basePath` configuration

**Solution**:
```bash
# Verify model path exists
ls -la /path/to/models/

# Check configuration
cat llama-server-config.json

# Update basePath to correct path
# Example: "basePath": "/home/user/models"
```

### "Out of memory"

**Cause**: Insufficient RAM or GPU memory

**Solution**:
1. **Unload other models** to free memory
2. **Reduce context size** in configuration
3. **Reduce GPU layers** if GPU memory is limited
4. **Use smaller quantized models** (Q4_K instead of Q8)
5. **Close other applications** to free memory

### "Invalid configuration"

**Cause**: Malformed JSON or invalid configuration values

**Solution**:
```bash
# Validate JSON syntax
python -m json.tool llama-server-config.json

# Use jq for validation
jq . llama-server-config.json

# Fix syntax errors and retry
```

### "WebSocket connection failed"

**Cause**: WebSocket endpoint is not accessible

**Solution**:
```bash
# Check WebSocket path in configuration
grep WEBSOCKET_PATH .env.local

# Verify server is running
curl http://localhost:3000/api/health

# Check for firewall blocking WebSocket traffic
sudo ufw status
sudo iptables -L | grep 3000
```

---

## Performance Issues

### High CPU Usage

**Symptoms**: High CPU utilization during inference

**Possible Causes**:
1. CPU-only inference
2. Too many parallel requests
3. Inefficient model configuration

**Solutions**:

1. **Enable GPU Offloading**
   ```json
   {
     "gpu_layers": -1  // Use GPU for all layers
   }
   ```

2. **Optimize Thread Count**
   ```bash
   # Check available cores
   nproc

   # Set appropriate thread count
   # Usually slightly less than total cores
   ```

3. **Reduce Batch Size**
   - Lower `batch_size` to reduce CPU load
   - Try `batch_size: 256` or lower

4. **Use Quantized Models**
   - Q4_K_M provides good balance of speed and quality
   - Smaller models are faster on CPU

### High Memory Usage

**Symptoms**: High RAM or GPU memory consumption

**Possible Causes**:
1. Large context size
2. Multiple models loaded
3. Large batch size

**Solutions**:

1. **Unload Unused Models**
   - Keep only actively used models loaded
   - Unload models when not in use

2. **Reduce Context Size**
   ```json
   {
     "ctx_size": 4096  // Lower from 8192
   }
   ```

3. **Reduce Batch Size**
   ```json
   {
     "batch_size": 256  // Lower from 512
   }
   ```

4. **Use Smaller Models**
   - Choose models with fewer parameters
   - Use quantized versions (Q4_K, Q5_K)

### Slow Page Load

**Symptoms**: Web interface loads slowly

**Possible Causes**:
1. Slow network connection
2. Large build artifacts
3. Browser cache issues

**Solutions**:

1. **Clear Browser Cache**
   - Clear browser cache and cookies
   - Try in incognito/private mode
   - Try a different browser

2. **Rebuild Application**
   ```bash
   # Clean build artifacts
   rm -rf .next

   # Rebuild
   pnpm build
   ```

3. **Check Network Connection**
   ```bash
   # Test network speed
   ping -c 4 localhost

   # Check for high latency
   traceroute localhost
   ```

4. **Check Browser Console**
   - Open developer tools (F12)
   - Check for JavaScript errors
   - Check network tab for slow resources

---

## Connection Problems

### Cannot Connect to Web Interface

**Symptoms**: Browser cannot connect to `http://localhost:3000`

**Possible Causes**:
1. Server not running
2. Firewall blocking connection
3. Wrong port
4. DNS resolution issues

**Solutions**:

1. **Verify Server is Running**
   ```bash
   # Check if process is running
   ps aux | grep "node server"

   # Check if port is listening
   netstat -tulpn | grep 3000
   ```

2. **Check Firewall**
   ```bash
   # Check UFW status (Ubuntu)
   sudo ufw status

   # Check iptables rules
   sudo iptables -L -n | grep 3000

   # Allow port (if needed)
   sudo ufw allow 3000
   ```

3. **Try Different Port**
   ```bash
   # Change port in .env.local
   PORT=3001

   # Restart server
   pnpm dev
   ```

4. **Clear DNS Cache**
   ```bash
   # Linux
   sudo systemd-resolve --flush-caches

   # macOS
   sudo dscacheutil -flushcache

   # Windows (as Administrator)
   ipconfig /flushdns
   ```

### WebSocket Connection Issues

**Symptoms**: WebSocket connections fail or keep disconnecting

**Possible Causes**:
1. WebSocket path mismatch
2. Proxy blocking WebSocket
3. Server restart
4. Network issues

**Solutions**:

1. **Verify WebSocket Path**
   ```bash
   # Check WebSocket path configuration
   grep WEBSOCKET_PATH .env.local

   # Default: /llamaproxws
   ```

2. **Check Proxy Configuration**
   - Ensure reverse proxy supports WebSocket
   - WebSocket requires HTTP/1.1 upgrade
   - Check nginx/caddy configuration

3. **Monitor Connection Logs**
   ```bash
   # View application logs
   tail -f logs/application-$(date +%Y-%m-%d).log

   # Check for WebSocket errors
   grep "WebSocket" logs/application-*.log
   ```

4. **Test WebSocket Connection**
   ```bash
   # Install wscat
   npm install -g wscat

   # Test connection
   wscat -c ws://localhost:3000/llamaproxws
   ```

---

## Database Issues

### Database Lock Error

**Symptoms**: "database is locked" or "SQLITE_BUSY" errors

**Possible Causes**:
1. Multiple processes accessing database
2. Long-running transaction
3. Database corruption

**Solutions**:

1. **Check for Multiple Processes**
   ```bash
   # Find processes accessing database
   lsof data/llama-dashboard.db

   # Stop duplicate processes
   pm2 stop llama-proxy
   ```

2. **Vacuum Database**
   ```bash
   # Optimize and repair database
   pnpm db:vacuum
   ```

3. **Reset Database (Last Resort)**
   ```bash
   # Reset database (deletes all models)
   pnpm db:reset

   # Rediscover models
   ```

### Database Corruption

**Symptoms**: Database errors, missing data

**Possible Causes**:
1. Disk failure
2. Improper shutdown
3. Concurrent write conflicts

**Solutions**:

1. **Check Database Integrity**
   ```bash
   # Use SQLite integrity check
   sqlite3 data/llama-dashboard.db "PRAGMA integrity_check;"
   ```

2. **Restore from Backup**
   ```bash
   # Import database backup
   pnpm db:import
   ```

3. **Reset Database**
   ```bash
   # Delete corrupted database and recreate
   rm data/llama-dashboard.db
   pnpm dev
   ```

---

## WebSocket Issues

### WebSocket Won't Connect

**Symptoms**: Connection shows "DISCONNECTED" status

**Possible Causes**:
1. Server not running
2. WebSocket path mismatch
3. Firewall blocking WebSocket
4. Browser security restrictions

**Solutions**:

1. **Verify Server is Running**
   ```bash
   curl http://localhost:3000/api/health
   ```

2. **Check WebSocket Configuration**
   ```bash
   # Verify WEBSOCKET_PATH in .env.local
   grep WEBSOCKET_PATH .env.local

   # Default should be: /llamaproxws
   ```

3. **Check Browser Console**
   - Open developer tools (F12)
   - Look for WebSocket errors in console
   - Check network tab for failed connections

4. **Test with WebSocket Client**
   ```bash
   npm install -g wscat
   wscat -c ws://localhost:3000/llamaproxws
   ```

### WebSocket Keeps Disconnecting

**Symptoms**: Frequent reconnections

**Possible Causes**:
1. Network instability
2. Server restarts
3. Proxy timeout
4. Connection pool exhaustion

**Solutions**:

1. **Check Network Stability**
   ```bash
   # Ping server to check latency
   ping -c 20 localhost

   # Check for packet loss
   traceroute localhost
   ```

2. **Monitor Server Logs**
   ```bash
   # Look for connection errors
   tail -f logs/application-$(date +%Y-%m-%d).log | grep -i "disconnect\|connect\|error"
   ```

3. **Adjust WebSocket Timeout**
   - Increase timeout in reverse proxy (nginx/caddy)
   - Example nginx: `proxy_read_timeout 300s;`

4. **Check Server Health**
   ```bash
   # Monitor server resources
   htop

   # Check for memory issues
   free -h
   ```

---

## Model Issues

### Model Discovery Fails

**Symptoms**: No models found after discovery

**Possible Causes**:
1. Incorrect basePath
2. Model files have wrong extension
3. Directory permissions
4. No GGUF/BIN files in directory

**Solutions**:

1. **Verify basePath Configuration**
   ```bash
   # Check basePath in config
   grep basePath llama-server-config.json

   # List files in basePath
   ls -lh /path/to/models/
   ```

2. **Check Model File Extensions**
   ```bash
   # Look for GGUF files
   find /path/to/models/ -name "*.gguf"

   # Look for BIN files
   find /path/to/models/ -name "*.bin"
   ```

3. **Check Directory Permissions**
   ```bash
   # Check read permissions
   ls -la /path/to/models/

   # Fix permissions if needed
   chmod +r /path/to/models/*.gguf
   ```

4. **Verify Model Format**
   - Ensure models are GGUF or BIN format
   - Other formats may not be supported
   - Check llama.cpp documentation for supported formats

### Model Configuration Not Saving

**Symptoms**: Changes to model configuration don't persist

**Possible Causes**:
1. Database write error
2. Validation error
3. Insufficient permissions

**Solutions**:

1. **Check Database Permissions**
   ```bash
   # Check data directory permissions
   ls -la data/

   # Ensure write access
   chmod +w data/llama-dashboard.db
   ```

2. **Check for Validation Errors**
   ```bash
   # Review error logs
   tail -f logs/errors-$(date +%Y-%m-%d).log

   # Look for validation errors
   grep "validation\|schema" logs/errors-*.log
   ```

3. **Check Application Logs**
   ```bash
   # Monitor logs for save errors
   tail -f logs/application-$(date +%Y-%m-%d).log | grep -i "save\|write\|error"
   ```

---

## Configuration Issues

### Configuration Not Loading

**Symptoms**: Settings page shows incorrect or missing configuration

**Possible Causes**:
1. Missing configuration file
2. Invalid JSON syntax
3. File permissions
4. API endpoint error

**Solutions**:

1. **Verify Configuration File Exists**
   ```bash
   # Check if llama-server-config.json exists
   ls -la llama-server-config.json

   # Create default config if missing
   cat > llama-server-config.json << EOF
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
   EOF
   ```

2. **Validate JSON Syntax**
   ```bash
   # Check JSON validity
   python -m json.tool llama-server-config.json

   # Use jq for validation
   jq . llama-server-config.json
   ```

3. **Check File Permissions**
   ```bash
   # Ensure file is readable
   chmod +r llama-server-config.json
   ```

4. **Test API Endpoint**
   ```bash
   # Test config endpoint
   curl http://localhost:3000/api/config

   # Check response
   ```

### Configuration Not Saving

**Symptoms**: Changes in Settings page don't persist

**Possible Causes**:
1. Write permission denied
2. Disk full
3. Invalid configuration
4. API error

**Solutions**:

1. **Check Write Permissions**
   ```bash
   # Ensure file is writable
   chmod +w llama-server-config.json

   # Check directory permissions
   ls -la .
   ```

2. **Check Disk Space**
   ```bash
   # Check available disk space
   df -h

   # Clean up if needed
   ```

3. **Validate Configuration**
   ```bash
   # Check JSON syntax before saving
   python -m json.tool new-config.json
   ```

4. **Review Logs for Errors**
   ```bash
   # Check for save errors
   tail -f logs/errors-$(date +%Y-%m-%d).log

   # Look for write errors
   grep "write\|save\|permission" logs/errors-*.log
   ```

---

## Logging Issues

### Logs Not Being Created

**Symptoms**: No log files in logs/ directory

**Possible Causes**:
1. Logs directory doesn't exist
2. Write permissions
3. Winston initialization error
4. Log level too high

**Solutions**:

1. **Create Logs Directory**
   ```bash
   # Create logs directory
   mkdir -p logs

   # Set proper permissions
   chmod 755 logs
   ```

2. **Check Permissions**
   ```bash
   # Ensure write access
   ls -la logs/

   # Fix permissions
   chmod +w logs/
   ```

3. **Check Winston Configuration**
   - Verify logger initialization in server startup
   - Check for logger errors in console
   - Review `src/lib/logger.ts` configuration

4. **Adjust Log Level**
   ```bash
   # Check log level in .env.local
   grep LOG_LEVEL .env.local

   # Ensure level is not too restrictive
   LOG_LEVEL=debug  # Most verbose
   LOG_LEVEL=info   # Normal level
   ```

### Logs Not Rotating

**Symptoms**: Log files growing indefinitely

**Possible Causes**:
1. Winston rotation not configured
2. Disk permissions
3. Rotation settings incorrect

**Solutions**:

1. **Check Winston Configuration**
   ```typescript
   // Verify rotation is enabled
   // in src/lib/logger.ts
   {
     datePattern: 'YYYY-MM-DD',
     maxFiles: '30d',  // 30 days retention
     maxSize: '20m'
   }
   ```

2. **Manually Clean Old Logs**
   ```bash
   # Remove logs older than 30 days
   find logs/ -name "*.log" -mtime +30 -delete

   # Compress old logs
   find logs/ -name "*.log" -mtime +7 -exec gzip {} \;
   ```

3. **Check Disk Space**
   ```bash
   # Monitor disk usage
   df -h logs/

   # Set up log rotation if not already configured
   ```

---

## Development Issues

### Hot Reload Not Working

**Symptoms**: Changes not reflected without manual restart

**Possible Causes**:
1. Turbopack cache issue
2. File watcher limit
3. Browser caching

**Solutions**:

1. **Clear Build Cache**
   ```bash
   # Remove build artifacts
   rm -rf .next

   # Restart dev server
   pnpm dev
   ```

2. **Increase File Watcher Limit**
   ```bash
   # Check current limit
   cat /proc/sys/fs/inotify/max_user_watches

   # Increase limit (temporary)
   echo 524288 | sudo tee -proc/sys/fs/inotify/max_user_watches

   # Increase limit (permanent)
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

3. **Clear Browser Cache**
   - Hard refresh (Ctrl+F5 or Cmd+Shift+R)
   - Clear browser cache
   - Try incognito/private mode

### Build Errors

**Symptoms**: `pnpm build` fails with errors

**Possible Causes**:
1. TypeScript errors
2. Missing dependencies
3. Configuration issues

**Solutions**:

1. **Check TypeScript Errors**
   ```bash
   # Run type checker
   pnpm type:check

   # Fix reported errors
   ```

2. **Reinstall Dependencies**
   ```bash
   # Clean install
   rm -rf node_modules
   pnpm install
   ```

3. **Clear Build Cache**
   ```bash
   # Remove build artifacts
   rm -rf .next

   # Rebuild
   pnpm build
   ```

4. **Check for Breaking Changes**
   - Review dependency updates
   - Check for deprecation warnings
   - Review migration guides

---

## Production Issues

### Server Crashes Frequently

**Symptoms**: Production server stops unexpectedly

**Possible Causes**:
1. Out of memory
2. Unhandled exceptions
3. Resource exhaustion

**Solutions**:

1. **Check Memory Usage**
   ```bash
   # Monitor memory
   free -h

   # Check for memory leaks
   top -o %MEM
   ```

2. **Review Error Logs**
   ```bash
   # Look for uncaught exceptions
   tail -f logs/errors-$(date +%Y-%m-%d).log

   # Check for crash patterns
   grep -i "fatal\|crash\|exception" logs/errors-*.log
   ```

3. **Increase Memory Limit**
   ```bash
   # If using PM2
   pm2 start ecosystem.config.js --max-memory-restart 4G

   # Node.js memory limit
   NODE_OPTIONS="--max-old-space-size=4096" pnpm start
   ```

4. **Implement Graceful Shutdown**
   - Handle SIGTERM/SIGINT signals
   - Close database connections
   - Clean up resources

### High Response Latency

**Symptoms**: Slow API responses and UI updates

**Possible Causes**:
1. Database performance
2. Network issues
3. Resource contention

**Solutions**:

1. **Monitor Database Performance**
   ```bash
   # Check database query performance
   sqlite3 data/llama-dashboard.db ".timer on"
   sqlite3 data/llama-dashboard.db "EXPLAIN QUERY PLAN <query>"
   ```

2. **Optimize Database**
   ```bash
   # Vacuum database
   pnpm db:vacuum

   # Check for slow queries
   # Review database logs
   ```

3. **Check Network Performance**
   ```bash
   # Test network latency
   ping -c 10 localhost

   # Check for network issues
   netstat -s | grep "errors\|dropped"
   ```

4. **Optimize Resource Usage**
   - Reduce concurrent requests
   - Optimize WebSocket message batching
   - Implement caching

---

## Getting Help

### Before Asking for Help

1. **Search Existing Issues**
   - Check GitHub issues for similar problems
   - Search documentation thoroughly
   - Review error messages

2. **Gather Diagnostic Information**
   - Application version
   - Node.js version
   - Operating system
   - Error messages and stack traces
   - Configuration files (sanitized)
   - Relevant logs

3. **Reproduce the Issue**
   - Document exact steps to reproduce
   - Note any workarounds
   - Identify when the issue started

### Where to Get Help

1. **Documentation**
   - [README.md](../README.md)
   - [USER_GUIDE.md](USER_GUIDE.md)
   - [CONFIGURATION.md](CONFIGURATION.md)
   - [DEPLOYMENT.md](DEPLOYMENT.md)
   - [API_REFERENCE.md](API_REFERENCE.md)

2. **GitHub Issues**
   - Create new issue with detailed information
   - Include error messages and logs
   - Provide reproduction steps
   - Tag with relevant labels

3. **Community**
   - Check for community forums/discussions
   - Ask for help in appropriate channels
   - Share workarounds and solutions

### Issue Report Template

```markdown
**Description**
A clear and concise description of the issue.

**Steps to Reproduce**
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior**
What you expected to happen.

**Actual Behavior**
What actually happened.

**Environment**
- Application Version: 0.2.0
- Node.js Version: 18.17.0
- Operating System: Ubuntu 22.04
- Browser: Chrome 120

**Configuration**
```json
{
  "host": "localhost",
  "port": 8134,
  ...
}
```

**Logs**
```
Paste relevant log entries here
```

**Additional Context**
Add any other context about the problem here.
```

---

**Troubleshooting Guide - Next.js Llama Async Proxy**
**Version 0.2.0 - December 30, 2025**
