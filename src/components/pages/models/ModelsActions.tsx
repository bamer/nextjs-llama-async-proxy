'use client';

interface ModelsActionsProps {
  isDiscovering: boolean;
  isRescanning: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onDiscover: () => void;
  onRescan: () => void;
}

const ModelsActions = ({
  isDiscovering,
  isRescanning,
  searchTerm,
  onSearchChange,
  onDiscover,
  onRescan,
}: ModelsActionsProps) => {
  return (
    <div className="flex justify-between items-center mb-8">
      <input
        type="text"
        placeholder="Search models..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="border border-border rounded-lg px-4 py-3 w-64 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
      />
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
    </div>
  );
};

export default ModelsActions;
