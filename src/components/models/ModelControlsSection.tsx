"use client";

interface ModelControlsSectionProps {
  modelName: string;
  status: 'running' | 'idle' | 'loading';
  isLoading: boolean;
  onStartModel: (modelName: string) => void;
  onStopModel: (modelName: string) => void;
}

export const ModelControlsSection = ({
  modelName,
  status,
  isLoading,
  onStartModel,
  onStopModel
}: ModelControlsSectionProps) => {
  return (
    <div className="flex gap-3">
      {status !== 'running' ? (
        <button
          onClick={() => onStartModel(modelName)}
          disabled={isLoading || status === 'loading'}
          className="bg-primary text-primary-foreground hover:bg-primary/80 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors font-medium"
        >
          {status === 'loading' ? 'Loading...' : 'Start'}
        </button>
      ) : (
        <button
          onClick={() => onStopModel(modelName)}
          disabled={isLoading}
          className="border border-border hover:bg-muted disabled:opacity-50 px-4 py-2 rounded-lg transition-colors text-foreground font-medium"
        >
          Stop
        </button>
      )}
      <button className="border border-border hover:bg-muted px-4 py-2 rounded-lg transition-colors text-foreground font-medium">
        Details
      </button>
    </div>
  );
};
