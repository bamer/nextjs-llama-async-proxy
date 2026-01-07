# Debug Steps for Logging Issues

## Changes Made

### 1. Fixed `value` Property Binding in Component.h

**File**: `public/js/core/component.js`

The Component.h function now properly sets `value` and `checked` as properties instead of attributes for form elements. This is critical for select boxes and checkboxes to work correctly.

**Impact**: Select boxes and form inputs should now properly update their displayed value.

### 2. Fixed LoggingConfig Event Delegation

**File**: `public/js/pages/settings/components/logging-config.js`

- Migrated from inline `onChange` callbacks to `getEventMap()` event delegation
- Fixed `componentWillReceiveProps` to use `setState()` instead of direct assignment
- Added debug logging to trace event flow

**Impact**: Changes to log level should now properly trigger state updates.

### 3. Added Server-Side Log Level Application

**File**: `server/handlers/config.js`

When settings are updated, the server now applies the new log level to the FileLogger instance.

**Impact**: Log level changes are now actually applied on the server.

### 4. Added Enhanced Debug Logging

**Files**:

- `public/js/pages/settings/components/logging-config.js`
- `public/js/pages/settings/settings-page.js`
- `public/js/pages/logs.js`

Debug logging shows the flow of state changes and server responses.

## How to Test

### Step 1: Open Browser Console

1. Open the application in your browser
2. Press `F12` to open DevTools
3. Go to the **Console** tab
4. You should see logs with `[DEBUG]` prefix

### Step 2: Test Select Box Change

1. Navigate to **Settings** page
2. Find the **Log Level** select box
3. Try changing it to a different value
4. **Watch the console** for these messages:
   ```
   [DEBUG] LoggingConfig.onLogLevelChange: { value: "error", normalized: "error" }
   [DEBUG] Calling parent callback with value: error
   [DEBUG] SettingsPage.onLogLevelChange: { val: "error", oldValue: "debug" }
   ```
5. **The select box visual should update immediately**

**If you don't see these logs:**

- Event delegation might not be working
- Check if there are JavaScript errors in the console
- Check the Network tab to see if requests are being sent

### Step 3: Test Saving Settings

1. Change the Log Level in Settings
2. Click **Save All Settings** button
3. **Watch the console** for:
   ```
   [DEBUG] Saving config and settings { config: {...}, settings: {...} }
   Settings saved successfully [notification]
   ```
4. **Check the server console** for:
   ```
   [DEBUG] Log level changed to: error
   ```

**If you don't see server logs:**

- Server might not be receiving the update
- Check Network tab → WS (WebSocket) requests
- Look for `settings:update` event

### Step 4: Test Logs Appearing

1. Navigate to **Logs** page
2. **Watch the console** for:
   ```
   [DEBUG] LogsController.render() called
   [DEBUG] Attempting to read log file...
   [DEBUG] readLogFile response: { logsCount: 5, fileName: "app-20240115.log" }
   [DEBUG] Loaded 5 logs from file
   ```

**If you see `logsCount: 0`:**

- No logs have been generated yet
- Try performing some actions (model operations, etc.) to generate logs
- Check if logs directory exists: `ls -la logs/`

### Step 5: Check Server Logs

1. Open terminal where server is running
2. Look for `[DEBUG]` messages
3. You should see connection logs like:
   ```
   [HH:MM:SS] [INFO] [server] Client connected: socketid123
   [HH:MM:SS] [DEBUG] [server] Log level changed to: error
   ```

## Troubleshooting

### Select Box Not Changing

1. **Check Component.h value binding**
   - Open DevTools Elements panel
   - Right-click select element
   - Check if `value="..."` attribute exists
   - Try: `document.querySelector('select[data-field="log-level"]').value = "error"` in console
   - If it changes, event delegation issue; if not, property binding issue

2. **Check event delegation**
   - In console: `window.Component.prototype.getEventMap.call({getEventMap: () => ({"change [data-field=log-level]": "onLogLevelChange"})})`
   - Should return the event map

3. **Test event firing manually**
   ```javascript
   const select = document.querySelector('select[data-field="log-level"]');
   select.value = "error";
   select.dispatchEvent(new Event("change", { bubbles: true }));
   ```

   - Should trigger `onLogLevelChange` and see debug logs

### No Logs Appearing

1. **Check if logs are being created**

   ```bash
   # In terminal, check logs directory
   ls -la logs/
   cat logs/app-YYYYMMDD.log
   ```

2. **Check database**

   ```bash
   sqlite3 data/llama-dashboard.db "SELECT COUNT(*) FROM logs; SELECT * FROM logs LIMIT 5;"
   ```

3. **Check socket connection**
   - DevTools Network tab
   - Filter for WS (WebSocket)
   - Should see `/llamaproxws` connection
   - Watch for `logs:entry` events in the Messages tab

4. **Generate test logs**
   - In server console, look for log generation
   - Or use the test page: `/test-logging-select.html`
   - Click "Test Log Appearance" button

### Settings Not Saving

1. **Check network request**
   - DevTools Network tab
   - Trigger save
   - Look for `settings:update` WebSocket event
   - Check if it has `requestId` and `settings` data

2. **Check server handler**
   - Server console should show the update
   - Check `server/handlers/config.js` was updated

3. **Test manually**
   ```javascript
   stateManager
     .updateSettings({ logLevel: "error" })
     .then((r) => console.log("Success:", r))
     .catch((e) => console.error("Error:", e));
   ```

## Files Modified

1. `/public/js/core/component.js` - Fixed value/checked property binding
2. `/public/js/pages/settings/components/logging-config.js` - Event delegation + debug logging
3. `/public/js/pages/settings/settings-page.js` - Debug logging
4. `/public/js/pages/logs.js` - Debug logging
5. `/server/handlers/config.js` - Apply log level to FileLogger
6. `/server/handlers/file-logger.js` - Log level threshold enforcement

## Expected Behavior After Fixes

1. ✅ Select box changes immediately when you click it
2. ✅ Settings are saved to server when you click "Save All Settings"
3. ✅ Server console shows "[DEBUG] Log level changed to: ..."
4. ✅ Subsequent logs are filtered by the new level
5. ✅ Logs page loads logs from file or database
6. ✅ Logs filter works by level

## If Still Not Working

1. **Hard refresh browser**: `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
2. **Restart server**: Stop and restart Node.js
3. **Check browser console for errors**: Look for red error messages
4. **Check server logs**: Look for exceptions or warnings
5. **Check network errors**: DevTools Network tab → XHR/Fetch failures

## Log Level Values

- `debug` = 3 (most verbose - shows all)
- `info` = 2 (default - shows info, warn, error)
- `warn` = 1 (shows warn, error only)
- `error` = 0 (shows error only)
