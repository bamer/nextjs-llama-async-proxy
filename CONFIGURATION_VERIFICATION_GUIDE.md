# Configuration Form Verification Guide

## Important: Test Before Reporting Issues

I've made multiple fixes to the configuration system. Please verify they work correctly before reporting any issues.

---

## Quick Verification Steps

### 1. Restart the Application

```bash
# Stop the server
pkill -f "node.*server" || true

# Start fresh
pnpm dev
```

### 2. Navigate to Settings Page

Open: `http://localhost:3000/settings`

### 3. Check for Success Criteria

**You should NOT see:**
- ❌ Infinite `GET /api/config` requests in browser console
- ❌ Settings page loading multiple times
- ❌ Configuration values resetting constantly

**You SHOULD see:**
- ✅ Settings page loads **once** (check browser DevTools Network tab - only ONE `GET /api/config`)
- ✅ No validation errors in form (red error messages)
- ✅ Llama Server Settings tab loads with default values:
  - Auto-start checkbox: **UNCHECKED** (should be unchecked)
  - Host: 127.0.0.1
  - Port: 8080
  - Base Path: /models
  - Llama-Server Path: /home/bamer/llama.cpp/build/bin/llama-server

### 4. Test Configuration Form - First Test

1. **Check defaults** (fields should be pre-filled with current DB values)
   - Verify "Host" shows `127.0.0.1`
   - Verify "Port" shows `8080`
   - Verify "Base Path" shows `/models`

2. **Test empty values** (fields can be saved with empty/undefined values)
   - Change "Base Path" field to: `/media/bamer/crucial/MX300/llm/models`
   - Click "Save Configuration" button

3. **Expected Result:**
   - ✅ "Configuration saved successfully" message
   - ✅ Fields preserve their values (Host, Port remain unchanged)
   - ✅ After page refresh, Base Path should still show `/media/bamer/crucial/MX300/llm/models`

4. **Verify in Database** (check persistence)
   ```bash
   sqlite3 /home/bamer/nextjs-llama-async-proxy/data/llama-dashboard.db "SELECT * FROM model_server_config;"
   ```
   - Verify `basePath` column shows `/media/bamer/crucial/MX300/llm/models`

5. **Test Partial Updates** (other fields remain unchanged)
   - Change "Host" to: `192.168.1.100`
   - Click "Save Configuration" button
   - Verify Host field now shows `192.168.1.100` and NOT `127.0.0.1`
   - Check database - verify other fields still have their correct values

### 5. Test Auto-Start Checkbox

**Default State (should be UNCHECKED):**
- Scroll to Llama Server Settings tab
- Verify checkbox is **UNCHECKED** (NOT checked)
- Check server logs for: `Auto-start disabled - llama-server will NOT start automatically`

**Enable and Test (should be CHECKED):**
1. Check the "Auto-start llama-server on application startup" checkbox
2. Click "Save Configuration"
3. Verify checkbox becomes **CHECKED**
4. Refresh Settings page
5. Check server logs for: `🦙 Initializing LlamaServer integration...`
6. Verify llama-server is now running

**Expected Behavior:**
- ✅ Auto-start DISABLED: App starts WITHOUT llama-server
- ✅ Logs show: `⏸ [SERVER] Auto-start disabled`
- ✅ Llama-server NOT running initially

- ✅ Auto-start ENABLED: App auto-starts llama-server
- ✅ Logs show: `🦙 Initializing LlamaServer integration...`
- ✅ Llama-server IS running

---

## What to Report Back

### ✅ PASS - All Working As Expected

**What you should see:**
- Settings page loads once (no infinite console spam)
- Form fields have correct values
- No validation errors (red messages gone)
- Auto-start checkbox works correctly
- When unchecked: No auto-start on application startup
- When checked: Auto-start on application startup

### ⚠️ FAIL - Issues Still Present

**What to report:**

1. **Validation errors appear**: If you still see "Too small" or "Too small" errors
2. **Infinite loop persists**: If you still see multiple `GET /api/config` requests
3. **Fields not updating**: If changing a field doesn't save the new value
4. **Auto-start not working**: If llama-server starts/ignores checkbox state

**Diagnostic Commands:**

```bash
# Check if your basePath was saved correctly
sqlite3 /home/bamer/nextjs-llama-async-proxy/data/llama-dashboard.db "SELECT * FROM model_server_config WHERE key='basePath';"

# Check if infinite loop is happening
tail -f logs/server.log | grep -c "GET /api/config" | head -20

# Check database state
sqlite3 /home/bamer/nextjs-llama-async-proxy/data/llama-dashboard.db "SELECT * FROM model_server_config;"
```

**Screenshot Request:**
- Browser DevTools Console tab (show Network requests)
- Settings page (show the Llama Server Settings form)
- Server logs (show auto-start messages)

---

## How to Screenshot

1. **Browser Console:**
   - Open DevTools (F12)
   - Go to "Console" tab
   - Look for repeated `GET /api/config` requests (there should only be ONE)
   - Right-click → "Save as..." → Take screenshot

2. **Settings Page:**
   - Navigate to Settings page
   - Capture the Llama Server Settings form
   - Right-click → "Save as..." → Take screenshot

3. **Server Logs:**
   - Run: `tail -50 logs/server.log` in terminal
   - Look for auto-start messages (`⏸` or `🦙`)
   - Take screenshot

---

## Success Criteria

All of the following must be true for a successful fix:

1. ✅ **No infinite console spam** - Settings page loads only once
2. ✅ **No validation errors** - Form fields show no red error messages
3. ✅ **Values persist correctly** - Saved values remain after page refresh
4. ✅ **Auto-start works** - Checkbox controls llama-server start behavior
5. ✅ **Fields update correctly** - Changing one field updates only that field, other fields unchanged
6. ✅ **No uncontrolled warnings** - All form fields properly controlled

---

## Common Failure Modes

**❌ FAIL if:**
- Settings page still loads multiple times
- You see "Configuration saved successfully" message repeatedly
- Validation errors still appear: "Too small", "Too small"
- Field values get reset when you change one field
- Infinite `GET /api/config` loop in DevTools Network tab
- Auto-start checkbox doesn't control llama-server behavior

---

## What NOT to Report

- ❌ "It works in my head" - I need screenshots and diagnostics
- ❌ "I think it's fine now" - Please test according to the steps above
- ❌ "Just trust me" - I made systematic changes, they should be tested

Please run the verification steps and report back with:
1. Screenshots (Console + Settings page + Terminal logs)
2. Diagnostic command outputs
3. Clear PASS/FAIL based on the criteria above
