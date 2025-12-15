'use client';

import React, { useState, useEffect } from 'react';

interface Model {
  name: string;
  description: string;
  status: 'running' | 'stopped' | 'loading';
  version: string;
  path?: string;
}

const ModelsPage = () => {
  const [models, setModels] = useState<Model[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  // Load models on mount
  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      const response = await fetch('/api/models');
      if (response.ok) {
        const data = await response.json();
        setModels(data.models || []);
      }
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  const discoverModels = async () => {
    setIsDiscovering(true);
    try {
      // Get configured paths from settings
      const configResponse = await fetch('/api/config');
      let configuredPaths = ['/media/bamer/crucial MX300/llm/llama/models'];

      if (configResponse.ok) {
        const config = await configResponse.json();
        if (config.basePath) {
          configuredPaths = [config.basePath];
        }
      }

      const response = await fetch('/api/models/discover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paths: configuredPaths }),
      });

      if (response.ok) {
        const data = await response.json();
        setModels(prev => [...prev, ...data.discovered]);
      }
    } catch (error) {
      console.error('Failed to discover models:', error);
    } finally {
      setIsDiscovering(false);
    }
  };

  const startModel = async (modelName: string) => {
    setLoadingStates(prev => ({ ...prev, [modelName]: true }));
    try {
      const response = await fetch(`/api/models/${modelName}/start`, {
        method: 'POST',
      });

      if (response.ok) {
        // Update model status
        setModels(prev => prev.map(model =>
          model.name === modelName ? { ...model, status: 'running' as const } : model
        ));
      }
    } catch (error) {
      console.error('Failed to start model:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, [modelName]: false }));
    }
  };

  const stopModel = async (modelName: string) => {
    setLoadingStates(prev => ({ ...prev, [modelName]: true }));
    try {
      const response = await fetch(`/api/models/${modelName}/stop`, {
        method: 'POST',
      });

      if (response.ok) {
        // Update model status
        setModels(prev => prev.map(model =>
          model.name === modelName ? { ...model, status: 'stopped' as const } : model
        ));
      }
    } catch (error) {
      console.error('Failed to stop model:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, [modelName]: false }));
    }
  };

  const filteredModels = models.filter(model =>
    model.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="models-page">
      <h1 className="text-3xl font-bold mb-8 text-foreground">Models</h1>
       
      <div className="flex justify-between items-center mb-8">
        <input
          type="text"
          placeholder="Search models..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-border rounded-lg px-4 py-3 w-64 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
        />
        <button
          onClick={discoverModels}
          disabled={isDiscovering}
          className="bg-primary text-primary-foreground hover:bg-primary/80 disabled:opacity-50 px-6 py-3 rounded-lg transition-colors font-medium"
        >
          {isDiscovering ? 'Discovering...' : 'Discover Models'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModels.map((model) => (
          <div key={model.name} className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-foreground">{model.name}</h3>
               <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${
                  model.status === 'running' ? 'bg-success' :
                  model.status === 'loading' ? 'bg-warning' : 'bg-danger'
                }`}>
                {loadingStates[model.name] ? 'loading' : model.status}
              </span>
            </div>

            <div className="mb-6">
              <p className="text-muted-foreground mb-2">{model.description}</p>
              <p className="text-sm text-muted-foreground">Version: {model.version}</p>
            </div>

            <div className="flex gap-3">
              {model.status === 'running' ? (
                <button
                  onClick={() => stopModel(model.name)}
                  disabled={loadingStates[model.name]}
                  className="border border-border hover:bg-muted disabled:opacity-50 px-4 py-2 rounded-lg transition-colors text-foreground font-medium"
                >
                  Stop
                </button>
              ) : (
                <button
                  onClick={() => startModel(model.name)}
                  disabled={loadingStates[model.name]}
                  className="bg-primary text-primary-foreground hover:bg-primary/80 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors font-medium"
                >
                  Start
                </button>
              )}
              <button className="border border-border hover:bg-muted px-4 py-2 rounded-lg transition-colors text-foreground font-medium">
                Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModelsPage;