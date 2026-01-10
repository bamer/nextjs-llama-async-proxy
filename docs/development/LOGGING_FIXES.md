# Logging Settings Fixes

## Summary

Fixed three critical bugs in the logging system:

1. **Log Level Select Box Not Working**
2. **Log Level Changes Not Being Applied to Server**
3. **Log Level Threshold Not Enforced**

## Bug #1: Log Level Select Box Not Working

### Root Cause

The `LoggingConfig` component used inline `onChange` callbacks in the JSX:

```javascript
// BROKEN - inline callback doesn't survive re-renders
Component.h("select", {
  value: this.state.logLevel,
  onChange: (e) => {
    this.setState({ logLevel: val });
    this.props.onLogLevelChange?.(val);
  },
});
```

When the component re-renders (via `setState`), new element instances are created with new inline function references. The event delegation system doesn't work with inline callbacks.

### Solution

Migrated to Component's event delegation pattern using `getEventMap()`:

```javascript
getEventMap() {
  return {
    "change [data-field=log-level]": "onLogLevelChange",
    "change [data-field=max-file-size]": "onMaxFileSizeChange",
    // ... etc
  };
}

onLogLevelChange(e) {
  const val = e.target.value || "info";
  this.setState({ logLevel: val });
  this.props.onLogLevelChange?.(val);
}
```

Elements now use `data-field` attributes:

```javascript
Component.h("select", {
  "data-field": "log-level",
  value: this.state.logLevel,
});
```

### Changed File

- `public/js/pages/settings/components/logging-config.js`

## Bug #2: Log Level Changes Not Applied to Server

### Root Cause

Settings were saved to the database but never applied to the FileLogger instance. The FileLogger always used `process.env.LOG_LEVEL` (defaulting to "info") and never checked the updated settings.

### Solution

Added handler in `config.js` to apply log level changes to FileLogger:

```javascript
socket.on("settings:update", (req) => {
  const id = req?.requestId || Date.now();
  try {
    const settings = req?.settings || {};
    db.setMeta("user_settings", settings);

    // Apply log level change to FileLogger if specified
    if (settings.logLevel) {
      fileLogger.logLevel = settings.logLevel;
      console.log(`[DEBUG] Log level changed to: ${settings.logLevel}`);
    }

    ok(socket, "settings:update:result", { settings }, id);
  } catch (e) {
    err(socket, "settings:update:result", e.message, id);
  }
});
```

### Changed File

- `server/handlers/config.js`

## Bug #3: Log Level Threshold Not Enforced

### Root Cause

The `debug()` method checked the log level:

```javascript
debug(msg, source = "server") {
  if (this.logLevels[this.logLevel] >= this.logLevels.debug) {
    this.log("debug", msg, source);
  }
}
```

But the main `log()` method didn't, so other log methods (`info`, `warn`, `error`) always logged regardless of threshold, and debug logs got saved even when below the current level.

### Solution

Added threshold check in the main `log()` method:

```javascript
log(level, msg, source = "server") {
  // Check if this log level should be logged
  if (this.logLevels[level] > this.logLevels[this.logLevel]) {
    return; // Suppress logs below current log level
  }
  // ... rest of logging
}
```

This ensures:

- `debug: 3` - includes debug, info, warn, error
- `info: 2` - includes info, warn, error (excludes debug)
- `warn: 1` - includes warn, error (excludes info, debug)
- `error: 0` - includes error only

### Changed File

- `server/handlers/file-logger.js`

## How It Works Now

1. User changes Log Level in Settings → UI component fires change event
2. Event bubbles to LoggingConfig via event delegation
3. `onLogLevelChange()` handler fires → `setState()` and calls parent callback
4. Parent (SettingsPage) updates state and sends `settings:update` to server
5. Server receives `settings:update` → applies new level to FileLogger
6. Subsequent logs are filtered by FileLogger based on new threshold
7. Only logs meeting the threshold are written to file, database, and broadcast

## Testing

### Test Select Box Works

```javascript
// Open Settings page in browser
// Change Log Level dropdown
// Should update immediately (component re-renders)
```

### Test Log Level Applied to Server

```javascript
// Change log level to "error"
// Generate some logs (e.g., via model operations)
// Should only see ERROR level logs

// Check server console output for:
// [DEBUG] Log level changed to: error
```

### Test Logs Appear

```javascript
// Open Logs page
// Should load logs from file or database
// Filter by level should work correctly
```

## Related Components

Other settings components also use inline `onChange` handlers:

- `router-config.js` - Router configuration inputs
- `model-defaults.js` - Model defaults
- `server-paths.js` - Server paths

These may also need migration to event delegation if they experience issues with state not updating properly.

## Log Level Reference

| Level | Value | Includes                 |
| ----- | ----- | ------------------------ |
| error | 0     | error only               |
| warn  | 1     | warn, error              |
| info  | 2     | info, warn, error        |
| debug | 3     | debug, info, warn, error |

## Files Modified

1. `/public/js/pages/settings/components/logging-config.js` - Event delegation
2. `/server/handlers/config.js` - Apply log level to FileLogger
3. `/server/handlers/file-logger.js` - Enforce log level threshold
