"use client";

import { useState, useEffect, useCallback } from "react";
import { m } from "framer-motion";
import {
  Box,
  Typography,
  Button,
  LinearProgress,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FolderIcon from "@mui/icons-material/Folder";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { DotsLoading } from "@/components/ui/AnimatedIllustrations";

interface ScanStepProps {
  onNext: () => void;
  onBack: () => void;
}

interface ScanProgress {
  phase: "idle" | "scanning" | "complete";
  progress: number;
  foundModels: number;
  scannedPaths: string[];
}

const DEFAULT_PATHS = [
  "/media/bamer/crucial MX300/llm/llama/models",
  "/home/bamer/.cache/lm-studio/models",
  "/usr/local/share/models",
];

export function ScanStep({ onNext, onBack }: ScanStepProps) {
  const [scanState, setScanState] = useState<ScanProgress>({
    phase: "idle",
    progress: 0,
    foundModels: 0,
    scannedPaths: [],
  });

  const handleStartScan = useCallback(() => {
    setScanState({
      phase: "scanning",
      progress: 0,
      foundModels: 0,
      scannedPaths: [],
    });

    let currentPathIndex = 0;
    let totalProgress = 0;

    const scanInterval = setInterval(() => {
      // Simulate scanning progress
      totalProgress += 8;
      currentPathIndex = Math.floor(totalProgress / 100) % DEFAULT_PATHS.length;

      if (totalProgress >= 100) {
        clearInterval(scanInterval);
        setScanState({
          phase: "complete",
          progress: 100,
          foundModels: Math.floor(Math.random() * 5) + 1,
          scannedPaths: DEFAULT_PATHS,
        });
      } else {
        setScanState((prev) => ({
          ...prev,
          progress: totalProgress,
          scannedPaths:
            totalProgress > 10
              ? [...new Set([...prev.scannedPaths, DEFAULT_PATHS[currentPathIndex]])]
              : prev.scannedPaths,
          foundModels: Math.min(prev.foundModels + Math.floor(Math.random() * 2), 10),
        }));
      }
    }, 150);
  }, []);

  const canProceed = scanState.phase === "complete";

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h5" gutterBottom sx={{ textAlign: "center" }}>
        Discover Available Models
      </Typography>
      <Typography
        color="text.secondary"
        sx={{ mb: 3, textAlign: "center" }}
      >
        We&apos;ll scan your system for LLM models in common locations
      </Typography>

      {/* Scanning Animation */}
      <Box sx={{ mb: 3 }}>
        <Box
          component={m.div}
          animate={
            scanState.phase === "scanning"
              ? { scale: [1, 1.05, 1] }
              : {}
          }
          transition={{ repeat: Infinity, duration: 1.5 }}
          sx={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            bgcolor: scanState.phase === "scanning" ? "primary.light" : "action.hover",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 2,
            fontSize: 40,
          }}
        >
          {scanState.phase === "scanning" ? "🔍" : scanState.phase === "complete" ? "✅" : "📁"}
        </Box>

        {scanState.phase === "scanning" && (
          <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
            <DotsLoading color="#4A90D9" />
          </Box>
        )}
      </Box>

      {/* Progress Bar */}
      <Box sx={{ mb: 2 }}>
        <LinearProgress
          variant="determinate"
          value={scanState.progress}
          sx={{
            height: 10,
            borderRadius: 5,
            bgcolor: "action.hover",
            "& .MuiLinearProgress-bar": {
              borderRadius: 5,
              transition: "transform 0.3s ease",
            },
          }}
        />
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: "right", mt: 0.5 }}
        >
          {scanState.progress}% Complete
        </Typography>
      </Box>

      {/* Scanned Paths */}
      {scanState.scannedPaths.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            bgcolor: "action.hover",
            borderRadius: 2,
            p: 2,
            mb: 2,
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            Scanning locations:
          </Typography>
          <List dense>
            {scanState.scannedPaths.map((path, index) => (
              <ListItem key={index} sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <FolderIcon fontSize="small" color="action" />
                </ListItemIcon>
                <ListItemText
                  primary={path}
                  primaryTypographyProps={{
                    variant: "body2",
                    sx: {
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    },
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Found Models Count */}
      {scanState.phase === "complete" && (
        <Box
          component={m.div}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            mb: 3,
            p: 2,
            borderRadius: 2,
            bgcolor: "success.light",
            color: "success.dark",
          }}
        >
          <CheckCircleIcon fontSize="small" />
          <Typography variant="body1" fontWeight="medium">
            Found {scanState.foundModels} model{scanState.foundModels !== 1 ? "s" : ""}!
          </Typography>
        </Box>
      )}

      {/* Action Buttons */}
      <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
        {scanState.phase === "idle" && (
          <Button
            variant="contained"
            size="large"
            onClick={handleStartScan}
            startIcon={<SearchIcon />}
          >
            Start Scan
          </Button>
        )}

        {scanState.phase === "scanning" && (
          <Button variant="contained" size="large" disabled>
            Scanning...
          </Button>
        )}

        {scanState.phase === "complete" && (
          <Button
            variant="contained"
            size="large"
            onClick={onNext}
            startIcon={<CheckCircleIcon />}
          >
            Continue ({scanState.foundModels} found)
          </Button>
        )}

        <Button variant="outlined" onClick={onBack}>
          Back
        </Button>
      </Box>

      {/* Skip Option */}
      {scanState.phase !== "complete" && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mt: 2, textAlign: "center", cursor: "pointer" }}
          onClick={onNext}
        >
          Skip scanning and configure manually
        </Typography>
      )}
    </Box>
  );
}
