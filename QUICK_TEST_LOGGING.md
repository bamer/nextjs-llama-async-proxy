# Quick Test: Logging Settings Fix

## What Was Fixed

6 bugs preventing log level changes and log display.

## Quick Test (2 minutes)

### Test 1: Select Box Changes
1. Open **Settings** page
2. Find **Log Level** select box
3. Change it to **"Error"**
4. ✅ Should change visually immediately
5. Open **DevTools** (F12) → **Console**
6. Look for this line:
   ```
   [DEBUG] LoggingConfig.onLogLevelChange: { value: "error", normalized: "error" }
   ```

### Test 2: Save Settings
1. With Log Level on **"Error"**, click **Save All Settings**
2. Should see notification: "Settings saved successfully"
3. Check **server console** output
4. Look for:
   ```
   [DEBUG] Log level changed to: error
   ```

### Test 3: Logs Page Works
1. Navigate to **Logs** page
2. Wait 2 seconds
3. Should see some logs displayed
4. Open browser **DevTools Console**
5. Look for:
   ```
   [DEBUG] readLogFile response: { logsCount: 5, fileName: "app-20240115.log" }
   ```

---

## If Any Test Fails

### Select Box Won't Change
- Open console (F12)
- Run: `document.querySelector('select[data-field="log-level"]').value = "info"`
- If it works manually, restart browser and try again

### No Logs Appearing
- Check if logs file exists: 
  ```bash
  ls -la logs/
  cat logs/app-YYYYMMDD.log | head -20
  ```
- If file exists, try refreshing Logs page again

### Server Shows No Debug Message
- Make sure you're looking at the right terminal window
- Try performing an action (change a setting, navigate a page)
- Look for any `[DEBUG]` output

---

## Key Changes Made

| Issue | Fix | File |
|-------|-----|------|
| Select box won't change | Fixed value property binding | `component.js` |
| Prop changes ignored | Fixed lifecycle method name | `logging-config.js` |
| Event handlers don't work | Migrated to event delegation | `logging-config.js` |
| Server ignores log level | Added handler to apply level | `config.js` |
| Logs below threshold saved | Added level check | `file-logger.js` |
| Select options don't update | Fixed willReceiveProps | all settings components |

---

## Console Messages You Should See

### When changing log level:
```
[DEBUG] LoggingConfig.onLogLevelChange: { value: "error", normalized: "error" }
[DEBUG] Calling parent callback with value: error
[DEBUG] SettingsPage.onLogLevelChange: { val: "error", oldValue: "debug" }
```

### When saving:
```
[DEBUG] Saving config and settings { config: {...}, settings: {...} }
Settings saved successfully
```

### Server side:
```
[DEBUG] Log level changed to: error
```

### Loading logs:
```
[DEBUG] LogsController.render() called
[DEBUG] Attempting to read log file...
[DEBUG] readLogFile response: { logsCount: 10, fileName: "app-20240115.log" }
[DEBUG] Loaded 10 logs from file
```

---

## Restart Instructions

If something doesn't work:

```bash
# 1. Stop the server (Ctrl+C in terminal)

# 2. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)

# 3. Restart server
pnpm start

# 4. Navigate to Settings and try again
```

---

## If Still Not Working

Please share:
1. Browser console logs (copy everything with `[DEBUG]`)
2. Server console logs (look for errors)
3. Which step fails (select, save, or logs page)
