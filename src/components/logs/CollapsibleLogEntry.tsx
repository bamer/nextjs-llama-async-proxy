"use client";

import { useState } from "react";

import { Box, Collapse, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

import { LogLevelBadge } from "./LogLevelBadge";

export interface LogEntryData {
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
  source?: string;
}

interface CollapsibleLogEntryProps {
  log: LogEntryData;
  defaultExpanded?: boolean;
}

export function CollapsibleLogEntry({ log, defaultExpanded = false }: CollapsibleLogEntryProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        overflow: "hidden",
        mb: 1,
      }}
    >
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          p: 1,
          cursor: "pointer",
          "&:hover": { backgroundColor: "action.hover" },
        }}
      >
        {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}

        <LogLevelBadge level={log.level} showLabel={false} />

        <Typography variant="body2" sx={{ color: "text.secondary", fontFamily: "monospace" }}>
          {new Date(log.timestamp).toLocaleString()}
        </Typography>

        {log.source && (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {log.source}
          </Typography>
        )}

        <Typography variant="body2" sx={{ flex: 1 }}>
          {log.message}
        </Typography>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ p: 2, pt: 0, borderTop: "1px solid", borderColor: "divider" }}>
          {log.stack && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Stack Trace
              </Typography>
              <Box
                component="pre"
                sx={{
                  fontFamily: "monospace",
                  fontSize: "0.75rem",
                  backgroundColor: "grey.100",
                  p: 1,
                  borderRadius: 1,
                  overflow: "auto",
                  maxHeight: 200,
                }}
              >
                {log.stack}
              </Box>
            </Box>
          )}

          {log.context && (
            <Box>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Context
              </Typography>
              <Box
                component="pre"
                sx={{
                  fontFamily: "monospace",
                  fontSize: "0.75rem",
                  backgroundColor: "grey.100",
                  p: 1,
                  borderRadius: 1,
                  overflow: "auto",
                  maxHeight: 200,
                }}
              >
                {JSON.stringify(log.context, null, 2)}
              </Box>
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}
