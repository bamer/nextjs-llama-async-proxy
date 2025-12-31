'use client';

import { useMemo } from 'react';

interface Model {
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

interface ModelsHeaderProps {
  models: Model[];
  onAddModel?: () => void;
}

const ModelsHeader = ({ models, onAddModel }: ModelsHeaderProps) => {
  const stats = useMemo(() => {
    return {
      total: models.length,
      running: models.filter(m => m.status === 'running').length,
      idle: models.filter(m => m.status === 'idle').length,
      loading: models.filter(m => m.status === 'loading').length,
    };
  }, [models]);

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-foreground">Models</h1>
        {onAddModel && (
          <button
            onClick={onAddModel}
            className="bg-primary text-primary-foreground hover:bg-primary/80 px-6 py-3 rounded-lg transition-colors font-medium"
          >
            Add Model
          </button>
        )}
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="bg-card border border-border rounded-lg px-4 py-3">
          <span className="text-sm text-muted-foreground">Total</span>
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
        </div>
        <div className="bg-card border border-border rounded-lg px-4 py-3">
          <span className="text-sm text-muted-foreground">Running</span>
          <p className="text-2xl font-bold text-success">{stats.running}</p>
        </div>
        <div className="bg-card border border-border rounded-lg px-4 py-3">
          <span className="text-sm text-muted-foreground">Idle</span>
          <p className="text-2xl font-bold text-info">{stats.idle}</p>
        </div>
        <div className="bg-card border border-border rounded-lg px-4 py-3">
          <span className="text-sm text-muted-foreground">Loading</span>
          <p className="text-2xl font-bold text-warning">{stats.loading}</p>
        </div>
      </div>
    </div>
  );
};

export default ModelsHeader;
