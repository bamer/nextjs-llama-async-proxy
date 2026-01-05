"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import Highlighter from "react-highlight-words";
import type { ModelData } from "./ModelCard";

interface ModelSearchProps {
  models: ModelData[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onModelClick?: (model: ModelData) => void;
  placeholder?: string;
}

interface SearchResultItemProps {
  model: ModelData;
  searchWords: string[];
  isHighlighted: boolean;
  onClick: () => void;
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({
  model,
  searchWords,
  isHighlighted,
  onClick,
}) => (
  <ListItem
    component="div"
    onClick={onClick}
    sx={{
      cursor: "pointer",
      bgcolor: isHighlighted ? "action.selected" : "transparent",
      "&:hover": { bgcolor: "action.hover" },
      py: 1.5,
    }}
  >
    <Box sx={{ width: "100%" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
        <Typography variant="body1" sx={{ fontWeight: 600 }}>
          <Highlighter
            searchWords={searchWords}
            textToHighlight={model.name}
            highlightStyle={{ backgroundColor: "rgba(255, 212, 0, 0.4)", borderRadius: 2 }}
          />
        </Typography>
        <StatusBadge status={model.status} size="small" />
      </Box>
      <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
        <Highlighter
          searchWords={searchWords}
          textToHighlight={model.path}
          highlightStyle={{ backgroundColor: "rgba(255, 212, 0, 0.4)", borderRadius: 2 }}
        />
      </Typography>
      <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {model.size}
        </Typography>
        {model.tokensPerSec > 0 && (
          <Typography variant="caption" sx={{ color: "success.main" }}>
            {model.tokensPerSec.toFixed(1)} tok/s
          </Typography>
        )}
      </Box>
    </Box>
  </ListItem>
);

export const ModelSearch = ({
  models,
  searchTerm,
  onSearchChange,
  onModelClick,
  placeholder = "Search models...",
}: ModelSearchProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const searchWords = useMemo(() => {
    return searchTerm.trim() ? searchTerm.trim().split(/\s+/) : [];
  }, [searchTerm]);

  const filteredModels = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return models.filter(
      (model) =>
        model.name.toLowerCase().includes(term) ||
        model.path.toLowerCase().includes(term) ||
        model.size.toLowerCase().includes(term)
    );
  }, [models, searchTerm]);

  const resultCount = filteredModels.length;

  const handleClear = () => {
    onSearchChange("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, resultCount - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && highlightedIndex >= 0 && highlightedIndex < resultCount) {
      e.preventDefault();
      onModelClick?.(filteredModels[highlightedIndex]);
      setIsOpen(false);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <Box ref={containerRef} sx={{ position: "relative", width: "100%", maxWidth: 400 }}>
      <TextField
        ref={inputRef}
        fullWidth
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => {
          onSearchChange(e.target.value);
          setIsOpen(true);
          setHighlightedIndex(-1);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: "text.secondary" }} />
            </InputAdornment>
          ),
          endAdornment: searchTerm && (
            <InputAdornment position="end">
              <IconButton size="small" onClick={handleClear} aria-label="Clear search">
                <ClearIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </InputAdornment>
          ),
        }}
        size="small"
        aria-label="Search models"
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: 2,
          },
        }}
      />

      {isOpen && searchTerm && (
        <Paper
          elevation={8}
          sx={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            mt: 1,
            borderRadius: 2,
            zIndex: 9999,
            maxHeight: 400,
            overflow: "auto",
          }}
        >
          <Box sx={{ p: 1.5, borderBottom: 1, borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {resultCount} result{resultCount !== 1 ? "s" : ""} found
            </Typography>
            {searchWords.length > 0 && (
              <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                {searchWords.map((word, i) => (
                  <Chip
                    key={i}
                    label={word}
                    size="small"
                    sx={{ height: 20, fontSize: 11 }}
                  />
                ))}
              </Box>
            )}
          </Box>

          {resultCount > 0 ? (
            <List disablePadding>
              {filteredModels.map((model, index) => (
                <React.Fragment key={model.name}>
                  <SearchResultItem
                    model={model}
                    searchWords={searchWords}
                    isHighlighted={index === highlightedIndex}
                    onClick={() => {
                      onModelClick?.(model);
                      setIsOpen(false);
                    }}
                  />
                  {index < resultCount - 1 && <Divider component="li" />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Box sx={{ p: 3, textAlign: "center" }}>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                No models found matching &quot;{searchTerm}&quot;
              </Typography>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};

interface StatusBadgeProps {
  status: string;
  size?: "small" | "medium";
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = "small" }) => {
  const statusConfig: Record<string, { color: "success" | "default" | "error" | "warning" | "info"; label: string }> = {
    running: { color: "success", label: "Running" },
    idle: { color: "default", label: "Idle" },
    loading: { color: "info", label: "Loading" },
    error: { color: "error", label: "Error" },
    stopped: { color: "warning", label: "Stopped" },
  };

  const config = statusConfig[status] || statusConfig.idle;

  return (
    <Chip
      label={config.label}
      color={config.color}
      size={size}
      sx={{ height: size === "small" ? 20 : 24, fontSize: size === "small" ? 10 : 12 }}
    />
  );
};
