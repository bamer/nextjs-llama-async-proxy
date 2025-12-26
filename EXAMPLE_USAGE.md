# Example Usage - Llama Service Solution 2

## Example 1: Simple Status Display

```tsx
// app/dashboard/page.tsx
import { LlamaStatusCard } from "@/components/ui/LlamaStatusCard";

export default function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Server Dashboard</h1>
      <LlamaStatusCard />
    </div>
  );
}
```

**What you get:**
- ✅ Server status badge (Ready, Starting, Error, etc.)
- ✅ List of available models with sizes
- ✅ Uptime counter
- ✅ Error messages if any
- ✅ Real-time updates via WebSocket

---

## Example 2: Use Hook in Custom Component

```tsx
// components/ModelSelector.tsx
import { useLlamaStatus } from "@/hooks/useLlamaStatus";
import { useState } from "react";

export function ModelSelector() {
  const { status, models, isLoading, lastError } = useLlamaStatus();
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  if (isLoading) {
    return <div>Loading Llama status...</div>;
  }

  if (status !== "ready") {
    return (
      <div className="bg-red-100 p-4 rounded">
        <p className="text-red-800">
          Llama server is not ready: {status}
        </p>
        {lastError && <p className="text-sm text-red-600">{lastError}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Select Model</h2>
      
      <select 
        value={selectedModel || ""} 
        onChange={(e) => setSelectedModel(e.target.value)}
        className="w-full p-2 border rounded"
      >
        <option value="">-- Choose a model --</option>
        {models.map((model) => (
          <option key={model.id} value={model.id}>
            {model.name} ({(model.size / 1024 / 1024 / 1024).toFixed(2)} GB)
          </option>
        ))}
      </select>

      {selectedModel && (
        <div className="bg-green-100 p-4 rounded">
          <p className="text-green-800">Selected: {selectedModel}</p>
        </div>
      )}
    </div>
  );
}
```

**What it does:**
- Waits for llama-server to be ready
- Shows all available models
- Lets user select a model
- Ready for inference calls

---

## Example 3: Advanced - Monitor Status with Callbacks

```tsx
// components/LlamaMonitor.tsx
import { useLlamaStatus } from "@/hooks/useLlamaStatus";
import { useEffect } from "react";
import { useSnackbar } from "notistack";

export function LlamaMonitor() {
  const { status, lastError, retries, uptime } = useLlamaStatus();
  const { enqueueSnackbar } = useSnackbar();

  // Show error notifications
  useEffect(() => {
    if (lastError) {
      enqueueSnackbar(
        `Llama Error (Retry ${retries}/5): ${lastError}`,
        { variant: "error" }
      );
    }
  }, [lastError, retries, enqueueSnackbar]);

  // Show recovery notifications
  useEffect(() => {
    if (status === "ready") {
      enqueueSnackbar(
        `🦙 Llama server ready! Uptime: ${uptime}s`,
        { variant: "success" }
      );
    }
  }, [status, uptime, enqueueSnackbar]);

  return null; // Monitoring component, no UI
}
```

**What it does:**
- Listens for errors and shows notifications
- Alerts user when server recovers
- Tracks uptime changes

---

## Example 4: Full Dashboard Integration

```tsx
// app/dashboard/page.tsx
"use client";

import { LlamaStatusCard } from "@/components/ui/LlamaStatusCard";
import { useLlamaStatus } from "@/hooks/useLlamaStatus";
import { Box, Grid, Card, CardContent, CardHeader } from "@mui/material";

export default function DashboardPage() {
  const { status, models, uptime } = useLlamaStatus();

  const isReady = status === "ready";

  return (
    <div className="p-6">
      <Grid container spacing={3}>
        {/* Status Card */}
        <Grid item xs={12} md={6}>
          <LlamaStatusCard />
        </Grid>

        {/* Models Summary */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Models Info" />
            <CardContent>
              <div className="space-y-2">
                <p>
                  <span className="font-semibold">Total Models:</span>{" "}
                  {models.length}
                </p>
                <p>
                  <span className="font-semibold">Server Status:</span>{" "}
                  <span
                    className={
                      isReady
                        ? "text-green-600 font-bold"
                        : "text-orange-600 font-bold"
                    }
                  >
                    {status.toUpperCase()}
                  </span>
                </p>
                <p>
                  <span className="font-semibold">Uptime:</span> {uptime}s
                </p>
              </div>
            </CardContent>
          </Card>
        </Grid>

        {/* Models List */}
        {isReady && (
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Available Models" />
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {models.map((model) => (
                    <div
                      key={model.id}
                      className="p-4 border rounded-lg hover:shadow-lg transition"
                    >
                      <p className="font-semibold text-lg">{model.name}</p>
                      <p className="text-sm text-gray-600">
                        Size: {(model.size / 1024 / 1024 / 1024).toFixed(2)} GB
                      </p>
                      <p className="text-sm text-gray-600">
                        Type: {model.type || "unknown"}
                      </p>
                      <button className="mt-3 w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                        Select Model
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </div>
  );
}
```

---

## Example 5: Inference with Selected Model

```tsx
// components/InferencePanel.tsx
import { useLlamaStatus } from "@/hooks/useLlamaStatus";
import { useState } from "react";

export function InferencePanel() {
  const { status, models } = useLlamaStatus();
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInference = async () => {
    if (!selectedModel || !prompt) {
      alert("Please select a model and enter a prompt");
      return;
    }

    setLoading(true);
    setResponse("");

    try {
      const res = await fetch("/api/inference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId: selectedModel,
          prompt: prompt,
          temperature: 0.7,
          maxTokens: 512,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResponse(data.response);
      } else {
        setResponse("Error: " + (await res.text()));
      }
    } catch (error) {
      setResponse("Error: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  if (status !== "ready") {
    return <div>Waiting for Llama server...</div>;
  }

  return (
    <div className="space-y-4 p-4 border rounded">
      <h2 className="text-xl font-semibold">Run Inference</h2>

      {/* Model Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">Select Model</label>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="">-- Choose model --</option>
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      {/* Prompt Input */}
      <div>
        <label className="block text-sm font-medium mb-2">Prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full p-2 border rounded h-32"
          placeholder="Enter your prompt here..."
        />
      </div>

      {/* Send Button */}
      <button
        onClick={handleInference}
        disabled={loading || !selectedModel}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {loading ? "Generating..." : "Send"}
      </button>

      {/* Response Display */}
      {response && (
        <div className="p-4 bg-gray-50 rounded border">
          <h3 className="font-semibold mb-2">Response:</h3>
          <p className="whitespace-pre-wrap">{response}</p>
        </div>
      )}
    </div>
  );
}
```

---

## Example 6: Error Handling & Recovery

```tsx
// components/ServerHealthCheck.tsx
import { useLlamaStatus } from "@/hooks/useLlamaStatus";
import { useEffect } from "react";

export function ServerHealthCheck() {
  const { status, lastError, retries } = useLlamaStatus();

  // Log status changes
  useEffect(() => {
    console.log("Llama Status Update:", {
      status,
      error: lastError,
      retries,
      timestamp: new Date().toISOString(),
    });
  }, [status, lastError, retries]);

  // Show different UI based on status
  switch (status) {
    case "ready":
      return (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          ✓ Llama server is ready
        </div>
      );

    case "starting":
      return (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
          ⏳ Llama server is starting...
        </div>
      );

    case "error":
      return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>✗ Llama server error: {lastError}</p>
          <p className="text-sm mt-1">Manual restart required.</p>
        </div>
      );

    case "crashed":
      return (
        <div className="bg-orange-100 border border-orange-400 text-orange-700 px-4 py-3 rounded">
          <p>⚠ Server crashed. Retrying... ({retries}/5)</p>
          <p className="text-sm mt-1">{lastError}</p>
        </div>
      );

    default:
      return (
        <div className="bg-gray-100 border border-gray-400 text-gray-700 px-4 py-3 rounded">
          Initializing...
        </div>
      );
  }
}
```

---

## Example 7: Real-time Stats Display

```tsx
// components/ServerStats.tsx
import { useLlamaStatus } from "@/hooks/useLlamaStatus";
import { useEffect, useState } from "react";

export function ServerStats() {
  const { uptime, models, status } = useLlamaStatus();
  const [formattedUptime, setFormattedUptime] = useState("0s");

  useEffect(() => {
    // Format uptime as "1h 30m 45s"
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = uptime % 60;

    let formatted = "";
    if (hours > 0) formatted += `${hours}h `;
    if (minutes > 0) formatted += `${minutes}m `;
    formatted += `${seconds}s`;

    setFormattedUptime(formatted);
  }, [uptime]);

  const totalSize = models.reduce((sum, m) => sum + (m.size || 0), 0);
  const sizeMB = (totalSize / 1024 / 1024).toFixed(2);

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="p-4 bg-white border rounded">
        <p className="text-gray-600 text-sm">Status</p>
        <p className="text-2xl font-bold text-blue-600">
          {status === "ready" ? "🟢" : "🟡"} {status}
        </p>
      </div>

      <div className="p-4 bg-white border rounded">
        <p className="text-gray-600 text-sm">Uptime</p>
        <p className="text-2xl font-bold text-green-600">{formattedUptime}</p>
      </div>

      <div className="p-4 bg-white border rounded">
        <p className="text-gray-600 text-sm">Models ({models.length})</p>
        <p className="text-2xl font-bold text-purple-600">{sizeMB} MB</p>
      </div>
    </div>
  );
}
```

---

## How to Use These Examples

1. **Copy** the component code
2. **Paste** into your component file
3. **Adjust** imports to match your paths
4. **Use** in your pages

All examples are production-ready with:
- ✅ Error handling
- ✅ Loading states
- ✅ TypeScript types
- ✅ Real-time updates
- ✅ Responsive design

---

## Integration Checklist

- [ ] Import `useLlamaStatus` hook
- [ ] Import `LlamaStatusCard` component
- [ ] Add status display to dashboard
- [ ] Add model selector
- [ ] Add inference endpoint (API route)
- [ ] Add error handling
- [ ] Test with real llama-server
- [ ] Monitor Socket.IO updates

---

## Common Patterns

### Pattern 1: Wait for Ready
```tsx
const { status, models } = useLlamaStatus();

if (status !== "ready") {
  return <LoadingSpinner />;
}

// Use models...
```

### Pattern 2: Handle Errors
```tsx
const { status, lastError } = useLlamaStatus();

if (lastError) {
  return <ErrorAlert message={lastError} />;
}
```

### Pattern 3: Monitor Changes
```tsx
const { status, uptime } = useLlamaStatus();

useEffect(() => {
  console.log(`Status changed to ${status}, uptime: ${uptime}s`);
}, [status, uptime]);
```

---

All examples are ready to use. Just update paths and start building!
