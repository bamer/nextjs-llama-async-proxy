"use client";

import { Box, TextField, InputAdornment } from "@mui/material";
import { MultiSelect, MultiSelectOption } from "@/components/ui";
import { Search } from "@mui/icons-material";
import { useTheme } from "@/contexts/ThemeContext";

interface LogsFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedLevels: Set<string>;
  setSelectedLevels: (levels: Set<string>) => void;
  logLevelOptions: MultiSelectOption[];
}

export function LogsFilters({
  searchTerm,
  setSearchTerm,
  selectedLevels,
  setSelectedLevels,
  logLevelOptions,
}: LogsFiltersProps) {
  const { isDark } = useTheme();

  return (
    <Box sx={{ mb: 4, display: "flex", alignItems: "center", gap: 2, flexWrap: "nowrap" }}>
      <TextField
        id="logs-search-input"
        name="logs-search-input"
        size="small"
        placeholder="Search logs..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
        sx={{
          background: isDark ? "rgba(30, 41, 59, 0.5)" : "rgba(248, 250, 252, 0.8)",
          flex: 1,
        }}
      />

      <Box sx={{ width: 220, flexShrink: 0 }}>
        <MultiSelect
          options={logLevelOptions}
          selected={selectedLevels}
          onChange={setSelectedLevels}
          placeholder="Log Levels"
          showSelectAll={true}
          maxSelectedDisplay={3}
          size="small"
          fullWidth={true}
        />
      </Box>
    </Box>
  );
}
