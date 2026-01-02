'use client';

interface ModelsControlsProps {
  isDiscovering: boolean;
  isRescanning: boolean;
  onDiscover: () => void;
  onRescan: () => void;
}

export const ModelsControls = ({
  isDiscovering,
  isRescanning,
  onDiscover,
  onRescan
}: ModelsControlsProps) => {
  return (
    <div className="flex gap-3">
      <button
        onClick={onDiscover}
        disabled={isDiscovering}
        className="bg-primary text-primary-foreground hover:bg-primary/80 disabled:opacity-50 px-6 py-3 rounded-lg transition-colors font-medium"
      >
        {isDiscovering ? 'Discovering...' : 'Discover Models'}
      </button>
      <button
        onClick={onRescan}
        disabled={isRescanning}
        className="bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 px-6 py-3 rounded-lg transition-colors font-medium"
      >
        {isRescanning ? 'Rescanning...' : 'Rescan Models'}
      </button>
    </div>
  );
};
