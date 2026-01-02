'use client';

import { useEffectEvent as ReactUseEffectEvent } from 'react';

export interface Model {
  id?: string;
  name: string;
  description?: string;
  status: 'running' | 'idle' | 'loading';
  version?: string;
  path?: string;
  type?: string;
  size?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface ModelsTableProps {
  models: Model[];
  loadingStates: Record<string, boolean>;
  onStartModel: (modelName: string) => void;
  onStopModel: (modelName: string) => void;
}

export const ModelsTable = ({
  models,
  loadingStates,
  onStartModel,
  onStopModel
}: ModelsTableProps) => {
  const handleStart = ReactUseEffectEvent((modelName: string) => {
    onStartModel(modelName);
  });

  const handleStop = ReactUseEffectEvent((modelName: string) => {
    onStopModel(modelName);
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {models.map((model) => (
        <div key={model.name} className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-foreground">{model.name}</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${
              model.status === 'running' ? 'bg-success' :
              model.status === 'loading' ? 'bg-warning' :
              'bg-info'
            }`}>
              {loadingStates[model.name] ? 'loading' : model.status}
            </span>
          </div>

          <div className="mb-6">
            <p className="text-muted-foreground mb-2">{model.description}</p>
            <p className="text-sm text-muted-foreground">Version: {model.version}</p>
          </div>

          <div className="flex gap-3">
            {model.status !== 'running' ? (
              <button
                onClick={() => handleStart(model.name)}
                disabled={loadingStates[model.name] || model.status === 'loading'}
                className="bg-primary text-primary-foreground hover:bg-primary/80 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors font-medium"
              >
                {model.status === 'loading' ? 'Loading...' : 'Start'}
              </button>
            ) : (
              <button
                onClick={() => handleStop(model.name)}
                disabled={loadingStates[model.name]}
                className="border border-border hover:bg-muted disabled:opacity-50 px-4 py-2 rounded-lg transition-colors text-foreground font-medium"
              >
                Stop
              </button>
            )}
            <button className="border border-border hover:bg-muted px-4 py-2 rounded-lg transition-colors text-foreground font-medium">
              Details
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
