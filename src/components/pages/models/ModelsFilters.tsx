'use client';

interface ModelsFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const ModelsFilters = ({ searchTerm, onSearchChange }: ModelsFiltersProps) => {
  return (
    <input
      type="text"
      placeholder="Search models..."
      value={searchTerm}
      onChange={(e) => onSearchChange(e.target.value)}
      className="border border-border rounded-lg px-4 py-3 w-64 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
    />
  );
};
