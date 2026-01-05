"use client";

import React from "react";
import {
  TextField,
  InputAdornment,
  Button,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Box,
  Typography,
  IconButton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

export type SortOption = "name" | "size" | "status" | "lastUsed" | "tokensPerSec";
export type StatusFilter = "running" | "idle" | "error" | "loading" | "stopped" | null;
export type SizeFilter = "all" | "small" | "medium" | "large";

interface ModelsFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  statusFilter: StatusFilter;
  onStatusChange: (status: StatusFilter) => void;
  sizeFilter: SizeFilter;
  onSizeChange: (size: SizeFilter) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  totalModels: number;
  filteredCount: number;
}

const STATUS_CONFIG: {
  status: StatusFilter;
  label: string;
  color: "success" | "default" | "error" | "warning" | "info";
  icon: string;
}[] = [
  { status: "running", label: "Running", color: "success", icon: "🔥" },
  { status: "idle", label: "Idle", color: "default", icon: "⭕" },
  { status: "error", label: "Error", color: "error", icon: "⚠️" },
  { status: "loading", label: "Loading", color: "info", icon: "⏳" },
  { status: "stopped", label: "Stopped", color: "warning", icon: "⏹️" },
];

const SIZE_OPTIONS: { value: SizeFilter; label: string }[] = [
  { value: "all", label: "All Sizes" },
  { value: "small", label: "Small (< 4GB)" },
  { value: "medium", label: "Medium (4-8GB)" },
  { value: "large", label: "Large (> 8GB)" },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "name", label: "Name" },
  { value: "size", label: "Size" },
  { value: "status", label: "Status" },
  { value: "lastUsed", label: "Last Used" },
  { value: "tokensPerSec", label: "Performance" },
];

export function ModelsFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  sizeFilter,
  onSizeChange,
  sortBy,
  onSortChange,
  totalModels,
  filteredCount,
}: ModelsFiltersProps) {
  const handleClearSearch = () => {
    onSearchChange("");
  };

  const handleClearAll = () => {
    onSearchChange("");
    onStatusChange(null);
    onSizeChange("all");
    onSortChange("name");
  };

  const hasActiveFilters =
    searchTerm !== "" || statusFilter !== null || sizeFilter !== "all" || sortBy !== "name";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
        <TextField
          placeholder="Search models..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "text.secondary" }} />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={handleClearSearch} aria-label="Clear search">
                  <ClearIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </InputAdornment>
            ),
          }}
          size="small"
          sx={{ width: 280 }}
          aria-label="Search models"
        />

        <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
          <Typography variant="body2" sx={{ color: "text.secondary", mr: -0.5 }}>
            Status:
          </Typography>
          {STATUS_CONFIG.map(({ status, label, color, icon }) => (
            <Chip
              key={status ?? "all"}
              label={icon}
              size="small"
              color={statusFilter === status ? color : "default"}
              onClick={() => onStatusChange(statusFilter === status ? null : status)}
              variant={statusFilter === status ? "filled" : "outlined"}
              sx={{
                "& .MuiChip-label": { px: 1 },
                minWidth: 36,
                height: 28,
              }}
              aria-label={`Filter by ${label}`}
            />
          ))}
        </Box>
      </Box>

      <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel id="size-filter-label">Size</InputLabel>
          <Select
            labelId="size-filter-label"
            value={sizeFilter}
            label="Size"
            onChange={(e) => onSizeChange(e.target.value as SizeFilter)}
            IconComponent={ArrowDropDownIcon}
          >
            {SIZE_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel id="sort-label">Sort by</InputLabel>
          <Select
            labelId="sort-label"
            value={sortBy}
            label="Sort by"
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            IconComponent={ArrowDropDownIcon}
          >
            {SORT_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {hasActiveFilters && (
          <Button variant="text" size="small" onClick={handleClearAll}>
            Clear All Filters
          </Button>
        )}

        <Typography variant="body2" sx={{ color: "text.secondary", ml: "auto" }}>
          Showing {filteredCount} of {totalModels} models
        </Typography>
      </Box>

      {statusFilter && (
        <Chip
          label={`Status: ${STATUS_CONFIG.find((s) => s.status === statusFilter)?.label}`}
          onDelete={() => onStatusChange(null)}
          size="small"
          color="primary"
          variant="outlined"
        />
      )}
    </Box>
  );
}
