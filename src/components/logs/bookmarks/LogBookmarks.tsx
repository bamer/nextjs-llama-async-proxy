"use client";

import { useState, useCallback, useEffect } from "react";
import { Box, Typography, List, ListItem, ListItemButton, ListItemText, IconButton, Chip, Tooltip, Paper } from "@mui/material";
import { Bookmark, BookmarkBorder, Delete, Visibility } from "@mui/icons-material";

export interface LogBookmark {
  id: string;
  logId: string;
  timestamp: Date;
  label: string;
  lineNumber?: number;
  searchContext?: string;
}

interface UseLogBookmarksOptions {
  storageKey?: string;
  maxBookmarks?: number;
}

interface UseLogBookmarksReturn {
  bookmarks: LogBookmark[];
  addBookmark: (logId: string, label: string, context?: { lineNumber?: number; searchContext?: string }) => void;
  removeBookmark: (id: string) => void;
  clearBookmarks: () => void;
  isBookmarked: (logId: string) => boolean;
  getBookmark: (logId: string) => LogBookmark | undefined;
}

const STORAGE_KEY = 'llama-log-bookmarks';
const MAX_BOOKMARKS = 50;

export function useLogBookmarks(options: UseLogBookmarksOptions = {}): UseLogBookmarksReturn {
  const { storageKey = STORAGE_KEY, maxBookmarks = MAX_BOOKMARKS } = options;
  const [bookmarks, setBookmarks] = useState<LogBookmark[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setBookmarks(parsed.map((b: { timestamp: string }) => ({
          ...b,
          timestamp: new Date(b.timestamp),
        })));
      } catch {
        setBookmarks([]);
      }
    }
  }, [storageKey]);

  const saveBookmarks = useCallback((items: LogBookmark[]) => {
    const toSave = items.slice(0, maxBookmarks);
    localStorage.setItem(storageKey, JSON.stringify(toSave));
    setBookmarks(toSave);
  }, [storageKey, maxBookmarks]);

  const addBookmark = useCallback((logId: string, label: string, context?: { lineNumber?: number; searchContext?: string }) => {
    setBookmarks((prev) => {
      if (prev.some((b) => b.logId === logId)) {
        return prev;
      }
      const newBookmark: LogBookmark = {
        id: `bookmark-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        logId,
        timestamp: new Date(),
        label,
      };
      if (context?.lineNumber !== undefined) {
        newBookmark.lineNumber = context.lineNumber;
      }
      if (context?.searchContext !== undefined) {
        newBookmark.searchContext = context.searchContext;
      }
      const updated = [newBookmark, ...prev];
      saveBookmarks(updated);
      return updated;
    });
  }, [saveBookmarks]);

  const removeBookmark = useCallback((id: string) => {
    setBookmarks((prev) => {
      const updated = prev.filter((b) => b.id !== id);
      saveBookmarks(updated);
      return updated;
    });
  }, [saveBookmarks]);

  const clearBookmarks = useCallback(() => {
    setBookmarks([]);
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  const isBookmarked = useCallback((logId: string) => {
    return bookmarks.some((b) => b.logId === logId);
  }, [bookmarks]);

  const getBookmark = useCallback((logId: string) => {
    return bookmarks.find((b) => b.logId === logId);
  }, [bookmarks]);

  return {
    bookmarks,
    addBookmark,
    removeBookmark,
    clearBookmarks,
    isBookmarked,
    getBookmark,
  };
}

export interface BookmarksPanelProps {
  bookmarks: LogBookmark[];
  onRemove: (id: string) => void;
  onGoto: (bookmark: LogBookmark) => void;
}

export function BookmarksPanel({ bookmarks, onRemove, onGoto }: BookmarksPanelProps) {
  const isEmpty = bookmarks.length === 0;

  return isEmpty ? (
    <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'action.hover' }}>
      <BookmarkBorder sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
      <Typography color="text.secondary">No bookmarks yet</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Click the bookmark icon on any log entry to save it
      </Typography>
    </Paper>
  ) : (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" fontWeight="medium">
          Bookmarks ({bookmarks.length})
        </Typography>
      </Box>
      <List dense>
        {bookmarks.map((bookmark) => (
          <ListItem
            key={bookmark.id}
            secondaryAction={
              <Tooltip title="Remove">
                <IconButton edge="end" size="small" onClick={() => onRemove(bookmark.id)}>
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            }
          >
            <ListItemButton onClick={() => onGoto(bookmark)}>
              <ListItemText
                primary={bookmark.label}
                secondary={
                  <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Chip
                      icon={<Visibility fontSize="small" />}
                      label={new Date(bookmark.timestamp).toLocaleTimeString()}
                      size="small"
                      variant="outlined"
                    />
                    {bookmark.searchContext && (
                      <Typography variant="caption" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        "{bookmark.searchContext}"
                      </Typography>
                    )}
                  </Box>
                }
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}

export interface BookmarkButtonProps {
  isBookmarked: boolean;
  onClick: () => void;
}

export function BookmarkButton({ isBookmarked, onClick }: BookmarkButtonProps) {
  return (
    <Tooltip title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}>
      <IconButton size="small" onClick={onClick} color={isBookmarked ? 'primary' : 'default'}>
        {isBookmarked ? <Bookmark fontSize="small" /> : <BookmarkBorder fontSize="small" />}
      </IconButton>
    </Tooltip>
  );
}
