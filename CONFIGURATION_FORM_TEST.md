# Configuration Form Test

## Test Case: Verify Form Fields Work Correctly

### Prerequisites
1. Application running (after `pnpm dev`)
2. Settings page accessible at `http://localhost:3000/settings`
3. Database has some models (not test data)
4. Form fields should be fillable with proper values

### Test Steps

1. **Navigate to Settings page**
   - Open: `http://localhost:3000/settings`
   - Wait for page to load (should see ONE "GET /api/config" in logs)

2. **Verify Llama Server Settings tab** (Tab 1 is default)
   - Scroll down or click "Llama Server" tab
   - Should see these fields:
     - ✅ "Auto-start llama-server on application startup" checkbox (should be UNCHECKED by default)
     - Host (default: 127.0.0.1)
     - Port (default: 8080)
     - Base Path (default: /models)
     - Llama-Server Path (default: /home/bamer/llama.cpp/build/bin/llama-server)
     - Context Size, Batch Size, Threads
     - GPU Options (GPU Layers, Main GPU)
     - Sampling Parameters (Temperature, Top-K, Top-P)

3. **Test saving a field value**
   - Fill in the "Base Path" field with: `/media/bamer/crucial/MX300/llm/models`
   - Click "Save Configuration" button
   - Expected result:
     - ✅ Should save WITHOUT validation errors
     - ✅ Field should retain value after page reload
     - ✅ Should log "Server configuration saved"
     - ✅ Other fields (Host, Port, etc.) should remain unchanged

4. **Test validation errors are gone**
   - With proper values in fields, no "Too small" or "Too small" errors should appear
   - Fill all required fields properly
   - Should see green border, no red error messages

5. **Verify auto-start behavior**
   - **Default (unchecked)**:
     - Auto-start checkbox should be unchecked
     - No validation error about "Too small"
     - Logs should show: "Auto-start disabled - llama-server will NOT start automatically"
   - Llama-server should NOT be running
   - Models page may show models but they might not be loadable

   - **If checked (enabled)**:
     - Check the checkbox
     - Click "Save Configuration"
     - Logs should show: "Server configuration saved"
     - Refresh page
     - Check logs for: "🦙 Initializing LlamaServer integration..."
     - Llama-server should be running
     - Models page should show loadable models

### Expected Results

✅ **PASS:** All form fields work correctly
- No validation errors when fields are properly filled
- Other fields remain unchanged when updating one field
- Settings page loads only once (no infinite loop)
- Auto-start checkbox properly controls llama-server initialization

⚠️ **FAIL:** If you still see:
- Validation errors when fields are correct
- Fields resetting to empty values
- Settings page loading multiple times
- Auto-start checkbox not working

### Test Checklist

- [ ] Settings page loads without infinite loop
- [ ] "Base Path" field accepts value `/media/bamer/crucial/MX300/llm/models`
- [ ] Saving configuration preserves field values
- [ ] Other fields remain unchanged when one field is updated
- [ ] No validation errors appear with valid values
- [ ] Auto-start checkbox controls llama-server start behavior correctly

---

## Verification Commands

If issues persist, please run:

```bash
# Check if values are persisted in database
sqlite3 /home/bamer/nextjs-llama-async-proxy/data/llama-dashboard.db "SELECT * FROM model_server_config;"
```

```bash
# Check application logs
tail -100 logs/server.log | grep -E "config|settings|basePath|serverPath"
```

---

## Next Steps Based on Results

### If Test PASSes:
- All configuration bugs are fixed
- Application should start cleanly with user control

### If Test FAILs:
- **Uncontrolled input warning persists**: Need deeper investigation into `FormField` and state management
- **Settings page still infinite loops**: The `useConfigPersistence` memoization didn't take effect
- **Fields still reset to empty**: Data flow issue between form, validation, and storage
- Need to trace complete data flow from form submit → validation → database → reload

---

**Please provide test results so I can identify which fix needs adjustment!**
