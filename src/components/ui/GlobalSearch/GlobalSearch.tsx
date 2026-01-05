"use client";

import { useState, useEffect, KeyboardEvent } from "react";
import { Dialog, Box, Typography, List, ListItem, ListItemButton, Chip, Paper, TextField, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import Close from "@mui/icons-material/Close";

export interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  category: "Models" | "Settings" | "Logs";
}

export interface GlobalSearchProps {
  models: SearchResult[];
  settings: SearchResult[];
  logs: SearchResult[];
}

export function GlobalSearch({ models, settings, logs }: GlobalSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const allResults = [
    { category: "Models" as const, items: models },
    { category: "Settings" as const, items: settings },
    { category: "Logs" as const, items: logs },
  ].flatMap(({ category, items }) =>
    items
      .filter((item) => item.title.toLowerCase().includes(query.toLowerCase()))
      .map((item) => ({ ...item, category }))
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown as unknown as EventListener);
    return () => window.removeEventListener("keydown", handleKeyDown as unknown as EventListener);
  }, []);

  useEffect(() => {
    if (open) setSelectedIndex(0);
  }, [open]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, allResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && allResults[selectedIndex]) {
      e.preventDefault();
      handleSelect(allResults[selectedIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const handleSelect = (result: SearchResult) => {
    console.log("Navigate to:", result.category.toLowerCase(), result.id);
    setOpen(false);
    setQuery("");
  };

  return (
    <>
      <Chip label="⌘K" onClick={() => setOpen(true)} sx={{ cursor: "pointer" }} />
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            placeholder="Search models, settings, logs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
              endAdornment: query && (
                <InputAdornment position="end">
                  <Chip label="esc" size="small" onClick={() => setOpen(false)} clickable />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        {query && (
          <Paper sx={{ maxHeight: 300, overflow: "auto", mx: 2, mb: 2 }}>
            {allResults.length === 0 ? (
              <Typography sx={{ p: 2, color: "text.secondary" }}>No results found</Typography>
            ) : (
              <List disablePadding>
                {allResults.map((result, index) => (
                  <ListItem key={result.id} disablePadding>
                    <ListItemButton selected={index === selectedIndex} onClick={() => handleSelect(result)}>
                      <Box>
                        <Typography variant="body1">{result.title}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {result.subtitle}
                        </Typography>
                      </Box>
                      <Chip label={result.category} size="small" sx={{ ml: "auto" }} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        )}
      </Dialog>
    </>
  );
}
