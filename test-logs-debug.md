# Logs Debugging Guide

## Issues Fixed

### 1. LoggingConfig Select Box Not Working ✅
**Problem**: The select element in LoggingConfig used inline `onChange` callbacks that didn't survive component re-renders.

**Solution**: Migrated from inline `onChange` handlers to Component event delegation using `getEventMap()` with `data-field` attributes.

**Changes**:
- Added `getEventMap()` method with delegation handlers
- Added handler methods: `onLogLevelChange`, `onMaxFileSizeChange`, `onMaxFilesChange`, etc.
- Updated select/input elements to use `data-field` attributes
- Removed inline `onChange` callbacks

**File**: `/public/js/pages/settings/components/logging-config.js`

### 2. Log Level Changes Not Applied to Server ✅
**Problem**: When users changed the log level in settings, it was saved to database but never applied to the FileLogger instance.

**Solution**: Added handler in config.js to apply log level changes to FileLogger when settings are updated.

**Changes**:
- Import `fileLogger` in config.js
- In `settings:update` handler, apply `settings.logLevel` to `fileLogger.logLevel`
- Added debug logging to confirm level changes

**File**: `/server/handlers/config.js`

### 3. Log Level Threshold Not Enforced ✅
**Problem**: The `debug` method in FileLogger already checked the log level, but the main `log` method didn't, causing logs to be saved/broadcast even when below the current threshold.

**Solution**: Added log level threshold check in the main `log` method to prevent logs below the current level from being saved or broadcast.

**File**: `/server/handlers/file-logger.js`

## How to Test

### 1. Test Select Box Working
```javascript
// In browser console, open Settings page
// Try changing Log Level dropdown - it should update immediately

// The select should bind properly with getEventMap delegation
```

### 2. Test Log Level Changes
```javascript
// In browser console:
const logLevel = stateManager.get("settings").logLevel;
console.log("Current log level:", logLevel);

// Change in settings and save
// Check server console output: "[DEBUG] Log level changed to: ..."
```

### 3. Verify Logs Appearing
```javascript
// Open Logs page - it should load logs from logs:read-file
// If logs don't appear, check:
// 1. Browser console for errors in LogsController.render()
// 2. Network tab for logs:read-file request
// 3. Check if logs directory exists: ls -la logs/

// Logs should come from either:
// - File: logs/app-YYYYMMDD.log
// - Database: SELECT * FROM logs
```

## Log Sources

Logs are created from:
1. **File Logger**: `logger.info()`, `logger.warn()`, `logger.error()`, `logger.debug()`
2. **Model Operations**: When models are loaded/unloaded
3. **Router Operations**: When router starts/stops
4. **Metrics**: When metrics are collected
5. **Client Connections**: When clients connect/disconnect

## If Logs Still Don't Appear

1. **Check if log file is being created**
   ```bash
   ls -la logs/
   cat logs/app-YYYYMMDD.log
   ```

2. **Check database has logs**
   ```bash
   sqlite3 data/llama-dashboard.db "SELECT COUNT(*) FROM logs;"
   ```

3. **Check socket connection**
   - Open DevTools Network tab
   - Look for WebSocket connection at `/llamaproxws`
   - Should see `logs:entry` events when logs are created

4. **Check FileLogger initialization**
   - Server console should show: `[Logger] Created logs directory: .../logs`
   - Check that `fileLogger.io` is not null (verify `setIo` was called)

## Log Level Values
- `error: 0` - Only errors
- `warn: 1` - Warnings and errors
- `info: 2` - Info, warnings, and errors (default)
- `debug: 3` - All including debug messages
