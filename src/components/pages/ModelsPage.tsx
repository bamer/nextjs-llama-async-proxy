'use client';

import { useState, useEffect, useMemo, useEffectEvent as ReactUseEffectEvent } from 'react';
import { websocketServer } from '@/lib/websocket-client';
import { ModelsFilters } from './models/ModelsFilters';
import { ModelsControls } from './models/ModelsControls';
import ModelsList, { type Model } from './models/ModelsList';
import { showSuccess, showError, showInfo } from '@/utils/toast-helpers';

const ModelsPage = () => {
  const [models, setModels] = useState<Model[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isRescanning, setIsRescanning] = useState(false);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  // Use useEffectEvent for stable WebSocket callbacks
  const handleModelsUpdate = ReactUseEffectEvent((message: unknown) => {
    if (
      message &&
      typeof message === "object" &&
      "type" in message &&
      "data" in message &&
      message.type === "models" &&
      Array.isArray(message.data)
    ) {
      console.log("📡 Models updated from WebSocket:", message.data);
      setModels(message.data as Model[]);
    }
  });

  const handleConnect = ReactUseEffectEvent(() => {
    console.log('📡 WebSocket connected, requesting models...');
    websocketServer.requestModels();
  });

  const startModel = ReactUseEffectEvent(async (modelName: string) => {
    setLoadingStates(prev => ({ ...prev, [modelName]: true }));
    try {
      const response = await fetch(`/api/models/${modelName}/start`, {
        method: 'POST',
      });

      if (response.ok) {
        setModels(prev => prev.map(model =>
          model.name === modelName ? { ...model, status: 'running' as const } : model
        ));
      }
    } catch (error) {
      console.error('Failed to start model:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, [modelName]: false }));
    }
  });

  const stopModel = ReactUseEffectEvent(async (modelName: string) => {
    setLoadingStates(prev => ({ ...prev, [modelName]: true }));
    try {
      const response = await fetch(`/api/models/${modelName}/stop`, {
        method: 'POST',
      });

      if (response.ok) {
        setModels(prev => prev.map(model =>
          model.name === modelName ? { ...model, status: 'idle' as const } : model
        ));
      }
    } catch (error) {
      console.error('Failed to stop model:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, [modelName]: false }));
    }
  });

  const loadModels = ReactUseEffectEvent(async () => {
    try {
      const response = await fetch('/api/models');
      if (response.ok) {
        const data = await response.json();
        setModels(data.models || []);
      }
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  });

  // Load models on mount and subscribe to real-time updates
  useEffect(() => {
    loadModels();

    try {
      websocketServer.connect();
      websocketServer.on('message', handleModelsUpdate);
      websocketServer.on('connect', handleConnect);
    } catch (error) {
      console.error('WebSocket connection error:', error);
    }

    return () => {
      try {
        websocketServer.off('message', handleModelsUpdate);
        websocketServer.off('connect', handleConnect);
      } catch {
        // Ignore cleanup errors
      }
    };
  }, [loadModels, handleModelsUpdate, handleConnect]);

  const discoverModels = async () => {
    setIsDiscovering(true);

    try {
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
        const newModels = data.discovered || [];
        setModels(prev => [...prev, ...newModels]);
        if (newModels.length > 0) {
          showSuccess('Models Discovered', `Found ${newModels.length} new model(s)`);
        } else {
          showInfo('No New Models', 'No new models were found in the specified paths');
        }
      }
    } catch (error) {
      console.error('Failed to discover models:', error);
      showError('Discovery Failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsDiscovering(false);
    }
  };

  const rescanModels = async () => {
    setIsRescanning(true);

    try {
      websocketServer.rescanModels();
      showSuccess('Rescan Started', 'Model rescanning has been initiated');
    } catch (error) {
      console.error('Failed to rescan models:', error);
      showError('Rescan Failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsRescanning(false);
    }
  };

  const filteredModels = useMemo(
    () =>
      models.filter(model =>
        model.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [models, searchTerm]
  );

  return (
    <div className="models-page">
      <h1 className="text-3xl font-bold mb-8 text-foreground">Models</h1>

      <div className="flex justify-between items-center mb-8">
        <ModelsFilters searchTerm={searchTerm} onSearchChange={setSearchTerm} />
        <ModelsControls
          isDiscovering={isDiscovering}
          isRescanning={isRescanning}
          onDiscover={discoverModels}
          onRescan={rescanModels}
        />
      </div>

      <ModelsList
        models={filteredModels}
        loadingStates={loadingStates}
        onStartModel={startModel}
        onStopModel={stopModel}
        onDiscover={discoverModels}
      />
    </div>
  );
};

export default ModelsPage;
