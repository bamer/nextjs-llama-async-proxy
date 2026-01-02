import React from 'react';

interface Config {
  basePath: string;
  logLevel: string;
  maxConcurrentModels: number;
  autoUpdate: boolean;
  notificationsEnabled: boolean;
  modelDefaults: ModelDefaults;
}

interface ModelDefaults {
  ctx_size: number;
  batch_size: number;
  temperature: number;
  top_p: number;
  top_k: number;
  gpu_layers: number;
  threads: number;
}

type TabType = 'general' | 'modelDefaults';

interface ConfigSectionsProps {
  activeTab: TabType;
  config: Config;
  setConfig: React.Dispatch<React.SetStateAction<Config>>;
}

export function ConfigSections({ activeTab, config, setConfig }: ConfigSectionsProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) : value
    }));
  };

  if (activeTab === 'general') {
    return (
      <div className="bg-card border border-border rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-6 text-foreground">General Settings</h2>
        <form>
          <div className="mb-4">
            <input
              type="text"
              name="basePath"
              placeholder="Base path for models"
              value={config.basePath}
              onChange={handleInputChange}
              className="border border-border rounded-md px-4 py-2 w-full bg-background text-foreground"
            />
          </div>

          <div className="mb-4">
            <input
              type="text"
              name="logLevel"
              placeholder="Log level (info, debug, error)"
              value={config.logLevel}
              onChange={handleInputChange}
              className="border border-border rounded-md px-4 py-2 w-full bg-background text-foreground"
            />
          </div>

          <div className="mb-4">
            <input
              type="number"
              name="maxConcurrentModels"
              placeholder="Maximum concurrent models"
              value={config.maxConcurrentModels}
              onChange={handleInputChange}
              className="border border-border rounded-md px-4 py-2 w-full bg-background text-foreground"
            />
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="autoUpdate"
                checked={config.autoUpdate}
                onChange={handleInputChange}
                className="mr-2"
              />
              <span className="text-foreground">Auto Update</span>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="notificationsEnabled"
                checked={config.notificationsEnabled}
                onChange={handleInputChange}
                className="mr-2"
              />
              <span className="text-foreground">Notifications Enabled</span>
            </div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6 text-foreground">Model Default Parameters</h2>
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">Context Size</label>
            <input
              type="number"
              value={config.modelDefaults.ctx_size}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                modelDefaults: { ...prev.modelDefaults, ctx_size: parseInt(e.target.value) || 4096 }
              }))}
              className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground"
              min="128"
              max="2000000"
            />
            <p className="text-xs text-muted-foreground mt-1">Maximum tokens in context</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">Batch Size</label>
            <input
              type="number"
              value={config.modelDefaults.batch_size}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                modelDefaults: { ...prev.modelDefaults, batch_size: parseInt(e.target.value) || 2048 }
              }))}
              className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground"
              min="1"
            />
            <p className="text-xs text-muted-foreground mt-1">Logical batch size</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">Temperature</label>
            <input
              type="number"
              value={config.modelDefaults.temperature}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                modelDefaults: { ...prev.modelDefaults, temperature: parseFloat(e.target.value) || 0.8 }
              }))}
              className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground"
              min="0"
              max="2"
              step="0.1"
            />
            <p className="text-xs text-muted-foreground mt-1">Sampling temperature</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">Top P</label>
            <input
              type="number"
              value={config.modelDefaults.top_p}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                modelDefaults: { ...prev.modelDefaults, top_p: parseFloat(e.target.value) || 0.9 }
              }))}
              className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground"
              min="0"
              max="1"
              step="0.05"
            />
            <p className="text-xs text-muted-foreground mt-1">Nucleus sampling</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">Top K</label>
            <input
              type="number"
              value={config.modelDefaults.top_k}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                modelDefaults: { ...prev.modelDefaults, top_k: parseInt(e.target.value) || 40 }
              }))}
              className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground"
              min="0"
            />
            <p className="text-xs text-muted-foreground mt-1">Top-K sampling</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">GPU Layers</label>
            <input
              type="number"
              value={config.modelDefaults.gpu_layers}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                modelDefaults: { ...prev.modelDefaults, gpu_layers: parseInt(e.target.value) || -1 }
              }))}
              className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground"
            />
            <p className="text-xs text-muted-foreground mt-1">Layers on GPU (-1 = all)</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">CPU Threads</label>
            <input
              type="number"
              value={config.modelDefaults.threads}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                modelDefaults: { ...prev.modelDefaults, threads: parseInt(e.target.value) || -1 }
              }))}
              className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground"
            />
            <p className="text-xs text-muted-foreground mt-1">CPU threads (-1 = auto)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
