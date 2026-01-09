# Presets Launch - User Quick Guide

**Complete workflow for creating and launching llama-server with presets.**

## Step-by-Step Tutorial

### Step 1: Go to Presets Page

1. Open Dashboard: `http://localhost:3000`
2. Click **"Presets"** in the sidebar menu
3. You'll see the Presets management page

### Step 2: Create a New Preset

1. Click **"+ New Preset"** button
2. Enter preset name (e.g., "my-server")
3. Preset is created empty

### Step 3: Add Models to Preset

In the preset editor:

1. Find the **model list section**
2. Click **"+ Add Model"** dropdown
3. Select a model or enter a name
4. Configure model settings:
   - **Context Size** - Token window (default: 4096)
   - **GPU Layers** - How many layers to offload to GPU
   - **Temperature** - Randomness (0.0-2.0)
   - **Threads** - CPU threads to use
   - etc.

5. Click **Save** to save changes

### Step 4: Configure Global Defaults (Optional)

Click **"Defaults"** section to set global settings that apply to all models:
- Context size
- GPU layers
- Thread count
- Other default parameters

### Step 5: Save Your Preset

Click **Save** button to write the configuration to an INI file.

Your preset is now saved in: `./config/my-server.ini`

---

## Step 6: Launch Server from Settings

1. Click **Settings** icon (gear icon) in dashboard
2. Scroll down to **"Launch with Preset"** section
3. **Select your preset** from the dropdown
4. Click **"🚀 Launch Server with Preset"** button

### What Happens Next

- System shows: "Starting llama-server with preset..."
- Backend reads your preset INI file
- Launches llama-server with exact configuration
- Server starts on automatically assigned port

### Success Message

If all goes well:
```
✓ Server started on port 8080
```

### Error Messages

| Message | Fix |
|---------|-----|
| "Please select a preset" | Select one from dropdown first |
| "Preset file not found" | Create preset in Presets page |
| "Model file not found" | Check model file path is correct and exists |

---

## Preset File Format

When you create a preset named "my-server", it creates: `./config/my-server.ini`

Example content:
```ini
LLAMA_CONFIG_VERSION = 1

[*]
ctx-size = 4096
n-gpu-layers = 33
threads = 8

[llama2-7b]
model = /path/to/llama2-7b.gguf
temperature = 0.7

[mistral-7b]
model = /path/to/mistral-7b.gguf
temperature = 0.5
```

**Sections**:
- `[*]` = Global defaults for all models
- `[model-name]` = Individual model configuration

---

## Complete Workflow Example

### Scenario: Launch a multi-model server

**1. Create preset "production":**
```
Name: production
Models:
  - llama2-13b (ctx: 8192, gpu-layers: 40)
  - mistral-7b (ctx: 4096, gpu-layers: 33)
Defaults:
  - threads: 8
  - temperature: 0.5
```

**2. Save preset:**
Creates `./config/production.ini`

**3. Launch from Settings:**
```
Settings → Launch with Preset
Select: production
Click: 🚀 Launch Server with Preset
```

**4. Server starts:**
```
Server Status: Running
Port: 8080
Preset: production
URL: http://127.0.0.1:8080
```

**5. Use models:**
```
curl http://127.0.0.1:8080/models
# Returns list of loaded models from preset
```

---

## Tips & Tricks

### Multiple Presets for Different Use Cases

- **development.ini** - Small models, low resources
- **production.ini** - Large models, high resources  
- **testing.ini** - Specific test configuration

Switch by selecting different preset in Settings.

### Quick Launch

Instead of going to Settings every time:

1. Create preset once
2. In Settings, select it
3. Click launch
4. Done!

Next time, just repeat steps 2-3.

### Check Model Paths

Before creating a preset, make sure you know the full paths to your model files:

```bash
# Find your models
find /path/to/models -name "*.gguf"

# Example paths:
# /models/llama2-7b.gguf
# /models/mistral-7b.gguf
# /home/user/models/neural-chat.gguf
```

Use the **full absolute path** in preset configuration.

### View Generated INI File

After saving a preset, you can view it:

```bash
# View the generated INI file
cat ./config/my-preset.ini

# Edit directly (advanced)
nano ./config/my-preset.ini

# Then restart server to apply changes
```

### Monitor Server

Once server is running, check the dashboard:

1. **Server status** shows: "Running"
2. **Port** shows which port it's on
3. **Models** page shows loaded models
4. **Monitoring** page shows performance

---

## Common Scenarios

### Scenario 1: Development Setup

**Preset**: dev
**Models**: Phi-2 (small, fast)
**Settings**: 
- ctx-size: 2048
- gpu-layers: 20
- threads: 4

**Launch**: From Settings → Select "dev" → Click launch

### Scenario 2: Production Setup

**Preset**: prod
**Models**: Llama2-13B, Mistral-7B
**Settings**:
- ctx-size: 8192
- gpu-layers: 40+
- threads: 16

**Launch**: From Settings → Select "prod" → Click launch

### Scenario 3: API Server

**Preset**: api
**Models**: Optimized for fast inference
**Settings**:
- ctx-size: 4096
- gpu-layers: 33
- threads: 8

**Launch**: From Settings → Select "api" → Click launch

---

## Troubleshooting

### Server Won't Start

**Check**:
1. Is preset file created? (Should exist in `./config/`)
2. Are model paths correct? (Check with `ls` command)
3. Is llama-server installed? (Check PATH)
4. Is port available? (Retry, it'll pick next port)

### Wrong Configuration

**Check**:
1. Edit preset in Presets page
2. Verify all settings
3. Click Save
4. Go back to Settings
5. Select updated preset
6. Launch again

### Server Crashes

**Check logs**:
1. Look at browser console (F12)
2. Check server logs
3. Verify model file is valid `.gguf` file

---

## Advanced Usage

### Manual Command Line (Alternative)

If you prefer command line instead of Settings UI:

```bash
# Find where your preset is
ls ./config/my-preset.ini

# Start llama-server directly
llama-server --models-preset ./config/my-preset.ini --models-max 4 --port 8080
```

### Edit INI Directly

Advanced users can edit the INI file directly:

```bash
# Edit the file
nano ./config/my-preset.ini

# Format example:
[*]
ctx-size = 4096
n-gpu-layers = 33

[model1]
model = /path/to/model.gguf
temperature = 0.7
```

### Version Control

Keep presets in git:

```bash
# Track presets
git add ./config/*.ini
git commit -m "Add presets for prod and dev"
```

---

## FAQ

**Q: Can I use relative paths?**  
A: No, always use absolute paths (e.g., `/models/model.gguf` not `./models/model.gguf`)

**Q: Can I edit preset after creating server?**  
A: Yes! Edit preset in Presets page, save, then stop and restart server

**Q: What if I delete a preset file?**  
A: Delete it from `./config/` folder. It won't appear in dropdown

**Q: Can I have multiple servers running?**  
A: No, only one llama-server can run at a time. Stop current before starting another

**Q: How do I change port?**  
A: System auto-assigns next available port if default is taken. Check notification

**Q: Can I import presets from files?**  
A: Yes, copy `.ini` file to `./config/` folder, it'll appear in dropdown

---

## Getting Help

**Error in Presets page**:
- Check browser console (F12)
- Check model paths
- Try creating new preset

**Error in Settings launcher**:
- Make sure preset is saved
- Check preset file exists: `ls ./config/my-preset.ini`
- Check llama-server is in PATH

**Server won't respond**:
- Check port in notification (e.g., 8080)
- Try: `curl http://localhost:PORT/models`
- Check logs for errors

---

## Summary

```
1. Go to Presets page
   ↓
2. Create new preset
   ↓
3. Add models and configure
   ↓
4. Save preset
   ↓
5. Go to Settings
   ↓
6. Select preset from dropdown
   ↓
7. Click "🚀 Launch Server"
   ↓
8. Server is running! ✓
```

**That's it! No complex CLI commands needed.**

---

**Version**: 1.0  
**Last Updated**: January 2026  
**Status**: Ready to use
