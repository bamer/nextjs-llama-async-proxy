# Error Handling and Logging Conventions

This document defines the error handling and logging standards for the Llama Async Proxy Dashboard project.

## Golden Rule: Console First, Toast Second

**ALL errors MUST appear in the browser console.** Toast notifications are for user feedback only and should never be the only place where errors appear.

```javascript
// ✅ CORRECT - Error in console AND toast
async _handleReset() {
  try {
    const response = await socketClient.request("config:thresholds:reset", {});
    if (response.success) {
      showNotification("Reset successful", "success");
    } else {
      // CRITICAL: Always log business logic errors to console
      console.error("[ComponentName] Operation failed:", {
        error: response.error,
        message: response.error?.message || response.error,
        stack: new Error().stack,
        timestamp: new Date().toISOString()
      });
      showNotification(`Reset failed: ${response.error}`, "error");
    }
  } catch (e) {
    // CRITICAL: Log exceptions to console
    console.error("[ComponentName] Exception:", {
      error: e.message,
      stack: e.stack,
      name: e.name,
      timestamp: new Date().toISOString()
    });
    showNotification(`Reset error: ${e.message}`, "error");
  }
}

// ❌ WRONG - Error only in toast, not in console
async _handleReset() {
  try {
    const response = await socketClient.request("config:thresholds:reset", {});
    if (response.success) {
      showNotification("Reset successful", "success");
    } else {
      showNotification(`Reset failed: ${response.error}`, "error"); // NO CONSOLE ERROR!
    }
  } catch (e) {
    showNotification(`Reset error: ${e.message}`, "error"); // NO CONSOLE ERROR!
  }
}
```

## Console Error Format

All console errors must include sufficient context for debugging:

```javascript
console.error("[ComponentName] Error description:", {
  error: e.message,           // Error message
  code: e.code,               // Error code if available
  stack: e.stack,             // Full stack trace
  errno: e.errno,             // System error number
  syscall: e.syscall,         // System call that failed
  path: e.path,               // File path if applicable
  requestId: req.requestId,   // Request ID for tracing
  data: { /* relevant data */ },
  timestamp: new Date().toISOString()
});
```

## Backend Error Logging (Server)

Server-side errors must include request context:

```javascript
socket.on("config:thresholds:reset", (req, callback) => {
  console.log("[DEBUG] config:thresholds:reset request:", {
    requestId: req?.requestId || generateId(),
    timestamp: new Date().toISOString()
  });
  
  try {
    db.setMeta("alert_thresholds", null);
    callback({ success: true, data: { thresholds: defaults } });
  } catch (e) {
    console.error("[DEBUG] config:thresholds:reset failed:", {
      requestId: req?.requestId,
      error: e.message,
      code: e.code,
      errno: e.errno,
      syscall: e.syscall,
      path: e.path,
      stack: e.stack,
      timestamp: new Date().toISOString()
    });
    callback({ success: false, error: e.message });
  }
});
```

## Common Error Patterns

### 1. Socket.IO Request Errors

```javascript
async _handleAction() {
  try {
    const response = await socketClient.request("event:name", { payload });
    
    if (response.success) {
      showNotification("Success", "success");
    } else {
      console.error("[Component] Request failed:", {
        event: "event:name",
        error: response.error,
        payload: { /* sanitized */ },
        timestamp: new Date().toISOString()
      });
      showNotification(`Failed: ${response.error}`, "error");
    }
  } catch (e) {
    console.error("[Component] Request exception:", {
      event: "event:name",
      error: e.message,
      stack: e.stack,
      timestamp: new Date().toISOString()
    });
    showNotification(`Error: ${e.message}`, "error");
  }
}
```

### 2. Database Errors

```javascript
async _saveData() {
  try {
    await database.save(data);
    showNotification("Saved", "success");
  } catch (e) {
    console.error("[Component] Database error:", {
      operation: "save",
      error: e.message,
      code: e.code,
      errno: e.errno,
      syscall: e.syscall,
      path: e.path,
      timestamp: new Date().toISOString()
    });
    showNotification(`Database error: ${e.message}`, "error");
  }
}
```

### 3. File System Errors

```javascript
async _readFile(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return content;
  } catch (e) {
    console.error("[Component] File read error:", {
      path: filePath,
      error: e.message,
      code: e.code,
      errno: e.errno,
      syscall: e.syscall,
      timestamp: new Date().toISOString()
    });
    throw new Error(`Cannot read file: ${e.message}`);
  }
}
```

### 4. Validation Errors

```javascript
_validateInput(input) {
  const errors = [];
  
  if (!input.name) {
    errors.push("Name is required");
  }
  
  if (input.value < 0 || input.value > 100) {
    const error = "Value must be between 0 and 100";
    errors.push(error);
    console.error("[Component] Validation error:", {
      field: "value",
      value: input.value,
      error,
      timestamp: new Date().toISOString()
    });
  }
  
  return errors;
}
```

## Error Object Structure

When possible, errors should include:

```javascript
{
  message: "Human-readable error description",
  code: "ERROR_CODE",           // Machine-readable code
  details: { /* additional */ }, // Context-specific data
  timestamp: "ISO timestamp",
  requestId: "trace-id"          // For request tracing
}
```

## Known Issues and Solutions

### "attempt to write a readonly database"

**Problem**: SQLite database was opened in readonly mode or lacks write permissions.

**Causes**:
1. Database file permissions are incorrect (`-rw-r--r--` instead of `-rw-rw-r--`)
2. Database file is on a read-only filesystem
3. Another process has exclusive lock on the database
4. WAL file (`.db-shm`, `.db-wal`) conflicts

**Solutions**:

1. **Check file permissions**:
   ```bash
   ls -la data/llama-dashboard.db
   # Should show: -rw-rw-r-- 1 user group ...
   ```

2. **Fix permissions**:
   ```bash
   chmod 664 data/llama-dashboard.db
   chown user:group data/llama-dashboard.db
   ```

3. **Remove lock files**:
   ```bash
   rm -f data/llama-dashboard.db-shm
   rm -f data/llama-dashboard.db-wal
   ```

4. **Check disk space**:
   ```bash
   df -h data/
   ```

5. **Verify database integrity**:
   ```bash
   sqlite3 data/llama-dashboard.db "PRAGMA integrity_check;"
   ```

**Server-side diagnostics** (already implemented in `server/db/db-base.js`):
- Checks if database directory is writable
- Verifies database file is writable
- Logs detailed error information

### Socket.IO Request Failures

**Problem**: Request returns `success: false` with error message.

**Debugging steps**:
1. Check browser console for the logged error
2. Check server logs for request/response details
3. Verify the event handler exists on server
4. Check database connectivity

## Debug Log Categories

Use appropriate log levels:

- `[DEBUG]` - Detailed debugging information
- `[INFO]` - General information
- `[WARN]` - Warning conditions
- `[ERROR]` - Error conditions
- `[FATAL]` - Critical errors requiring immediate attention

## Testing Error Handling

All error paths must be tested:

```javascript
describe("Error Handling", () => {
  test("handles socket request failure with console error", async () => {
    // Mock socket request to fail
    jest.spyOn(socketClient, "request").mockResolvedValue({
      success: false,
      error: "Test error"
    });
    
    // Spy on console.error
    const consoleSpy = jest.spyOn(console, "error");
    
    await component._handleReset();
    
    // Verify console.error was called
    expect(consoleSpy).toHaveBeenCalledWith(
      "[ThresholdSettings] Reset failed:",
      expect.objectContaining({
        error: "Test error",
        timestamp: expect.any(String)
      })
    );
  });
  
  test("handles exception with console error", async () => {
    // Mock socket request to throw
    jest.spyOn(socketClient, "request").mockRejectedValue(new Error("Network error"));
    
    const consoleSpy = jest.spyOn(console, "error");
    
    await component._handleReset();
    
    expect(consoleSpy).toHaveBeenCalledWith(
      "[ThresholdSettings] Reset error:",
      expect.objectContaining({
        error: "Network error",
        stack: expect.any(String)
      })
    );
  });
});
```

## Related Documentation

- [AGENTS.md](../AGENTS.md) - Development guidelines
- [ARCHITECTURE.md](ARCHITECTURE.md) - Technical architecture
- [README.md](README.md) - User documentation

---

**Remember**: Console errors are for developers. Toast notifications are for users. Both are required for complete error handling.
