"use client";

import { useState, useMemo, useCallback } from "react";
import { Box, TextField, InputAdornment, IconButton, Typography, Chip, Tooltip, Paper, Collapse } from "@mui/material";
import { Search, Clear, Info, CheckCircle, Error as ErrorIcon, Code } from "@mui/icons-material";

interface RegexSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (pattern: RegExp | null) => void;
  placeholder?: string;
  caseSensitive?: boolean;
  onCaseSensitiveChange?: (value: boolean) => void;
}

export function RegexSearchInput({
  value,
  onChange,
  onSearch,
  placeholder = "Search with regex...",
  caseSensitive = false,
  onCaseSensitiveChange,
}: RegexSearchInputProps) {
  const [isValid, setIsValid] = useState(true);
  const [showOptions, setShowOptions] = useState(false);

  const { error } = useMemo(() => {
    if (!value.trim()) {
      return { error: null };
    }
    try {
      setIsValid(true);
      return { error: null };
    } catch (e) {
      setIsValid(false);
      return { error: (e as Error).message };
    }
  }, [value]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  const handleClear = useCallback(() => {
    onChange('');
    onSearch(null);
  }, [onChange, onSearch]);

  const toggleOptions = useCallback(() => {
    setShowOptions((prev) => !prev);
  }, []);

  return (
    <Box sx={{ position: 'relative' }}>
      <TextField
        fullWidth
        size="small"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        error={!isValid}
        helperText={!isValid && error ? error : undefined}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search color="action" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              {value && (
                <Tooltip title="Clear search">
                  <IconButton size="small" onClick={handleClear}>
                    <Clear fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Regex options">
                <IconButton size="small" onClick={toggleOptions}>
                  <Code fontSize="small" color={showOptions ? 'primary' : 'action'} />
                </IconButton>
              </Tooltip>
            </InputAdornment>
          ),
        }}
      />
      <Collapse in={showOptions}>
        <Paper sx={{ mt: 1, p: 2, bgcolor: 'action.hover' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            {onCaseSensitiveChange && (
              <Chip
                label="Case Sensitive"
                onClick={() => onCaseSensitiveChange(!caseSensitive)}
                color={caseSensitive ? 'primary' : 'default'}
                variant={caseSensitive ? 'filled' : 'outlined'}
                size="small"
              />
            )}
            {value && (
              <Chip
                icon={isValid ? <CheckCircle fontSize="small" /> : <ErrorIcon fontSize="small" />}
                label={isValid ? 'Valid regex' : 'Invalid regex'}
                color={isValid ? 'success' : 'error'}
                size="small"
                variant="outlined"
              />
            )}
            <Typography variant="caption" color="text.secondary">
              Use{' '}
              <code style={{ background: 'rgba(0,0,0,0.1)', padding: '2px 4px', borderRadius: 4 }}>
                .
              </code>{' '}
              for any char,{' '}
              <code style={{ background: 'rgba(0,0,0,0.1)', padding: '2px 4px', borderRadius: 4 }}>
                \d
              </code>{' '}
              for digits,{' '}
              <code style={{ background: 'rgba(0,0,0,0.1)', padding: '2px 4px', borderRadius: 4 }}>
                \w
              </code>{' '}
              for word chars
            </Typography>
          </Box>
        </Paper>
      </Collapse>
    </Box>
  );
}

interface HighlightedTextProps {
  text: string;
  pattern: RegExp | null;
  caseSensitive?: boolean;
}

export function HighlightedText({ text, pattern, caseSensitive = false }: HighlightedTextProps) {
  const parts = useMemo(() => {
    if (!pattern || !text) {
      return [{ text, highlight: false }];
    }
    const flags = caseSensitive ? '' : 'gi';
    const regex = new RegExp(pattern.source, flags);
    const result: { text: string; highlight: boolean }[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        result.push({ text: text.slice(lastIndex, match.index), highlight: false });
      }
      result.push({ text: match[0], highlight: true });
      lastIndex = regex.lastIndex;
      if (match[0].length === 0) {
        regex.lastIndex++;
      }
    }

    if (lastIndex < text.length) {
      result.push({ text: text.slice(lastIndex), highlight: false });
    }

    return result;
  }, [text, pattern, caseSensitive]);

  return (
    <span>
      {parts.map((part, index) => (
        <span
          key={index}
          style={{
            backgroundColor: part.highlight ? 'rgba(255, 212, 0, 0.4)' : 'transparent',
            fontWeight: part.highlight ? 'bold' : 'normal',
          }}
        >
          {part.text}
        </span>
      ))}
    </span>
  );
}

interface RegexHelpDialogProps {
  onClose: () => void;
}

export function RegexHelpDialog({ onClose }: RegexHelpDialogProps) {
  void onClose;
  const examples = [
    { pattern: 'error|warn|info', description: 'Match any log level' },
    { pattern: '\\d{4}-\\d{2}-\\d{2}', description: 'Match date format (YYYY-MM-DD)' },
    { pattern: 'Exception\\s*:.*', description: 'Match exception messages' },
    { pattern: '\\b(?:GET|POST|PUT|DELETE)\\b', description: 'Match HTTP methods' },
    { pattern: '(?<=Failed\\s)attempt\\s\\d+', description: 'Match "Failed attempt N"' },
    { pattern: '(?!INFO).*', description: 'Exclude INFO level logs' },
  ];

  return (
    <Paper sx={{ p: 3, maxWidth: 500 }}>
      <Typography variant="h6" gutterBottom>
        Regex Search Help
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Regular expressions allow powerful pattern matching in your logs.
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {examples.map((ex, i) => (
          <Box key={i} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <Chip label={`/${ex.pattern}/`} size="small" color="primary" variant="outlined" sx={{ fontFamily: 'monospace' }} />
            <Typography variant="body2">{ex.description}</Typography>
          </Box>
        ))}
      </Box>
      <Box sx={{ mt: 3, p: 2, bgcolor: 'info.main', color: 'info.contrastText', borderRadius: 1 }}>
        <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Info fontSize="small" /> Quick Tips
        </Typography>
        <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
          <li>Use <code>.</code> to match any character</li>
          <li>Use <code>*</code> to match zero or more</li>
          <li>Use <code>+</code> to match one or more</li>
          <li>Use <code>?</code> to make optional</li>
          <li>Use <code>[abc]</code> to match any of a, b, or c</li>
          <li>Use <code>^</code> and <code>$</code> for start/end of line</li>
        </ul>
      </Box>
    </Paper>
  );
}
