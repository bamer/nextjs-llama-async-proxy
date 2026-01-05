"use client";

import { useCallback } from "react";
import { Box, Button, Typography } from "@mui/material";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import SearchIcon from "@mui/icons-material/Search";

export interface Model {
  id?: string;
  name: string;
  description?: string;
  status: "running" | "idle" | "loading";
  version?: string;
  path?: string;
  type?: string;
  size?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface ModelsListProps {
  models: Model[];
  loadingStates: Record<string, boolean>;
  onStartModel: (modelName: string) => void;
  onStopModel: (modelName: string) => void;
  onDiscover?: () => void;
}

const MODELS_TIPS = [
  "Models are stored in common directories like ~/.cache/lm-studio/models or /usr/local/share/models",
  "Supported formats: .gguf, .safetensors",
  "Larger models (7B+) require more system memory or GPU VRAM",
  "Use the Discover Models button to scan for available models",
  "Model files can be downloaded from Hugging Face or LM Studio",
];

const MODELS_DOCS_URL = "/docs/models";

const ModelsList = ({
  models,
  loadingStates,
  onStartModel,
  onStopModel,
  onDiscover,
}: ModelsListProps) => {
  const handleDiscover = useCallback(() => {
    onDiscover?.();
  }, [onDiscover]);

  if (models.length === 0) {
    const primaryAction = onDiscover
      ? { label: "Discover Models", onClick: handleDiscover }
      : null;

    return (
      <EmptyState
        illustration="models"
        title="No Models Found"
        description="Get started by discovering or adding your first AI model."
        primaryAction={primaryAction}
        tips={MODELS_TIPS}
        documentationUrl={MODELS_DOCS_URL}
      />
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          md: "repeat(2, 1fr)",
          lg: "repeat(3, 1fr)",
        },
        gap: 3,
      }}
    >
      {models.map((model) => (
        <Box
          key={model.name}
          className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all duration-300"
          sx={{ mb: 0 }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography
              variant="h6"
              component="h3"
              sx={{ fontWeight: "bold" }}
            >
              {model.name}
            </Typography>
            <Box
              sx={{
                px: 1.5,
                py: 0.5,
                borderRadius: "999px",
                fontSize: "0.75rem",
                fontWeight: "medium",
                color: "white",
                bgcolor:
                  model.status === "running"
                    ? "success.main"
                    : model.status === "loading"
                      ? "warning.main"
                      : "info.main",
              }}
            >
              {loadingStates[model.name] ? "loading" : model.status}
            </Box>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {model.description}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.875rem" }}>
              Version: {model.version}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 1.5 }}>
            {model.status !== "running" ? (
              <Button
                variant="contained"
                size="small"
                onClick={() => onStartModel(model.name)}
                disabled={loadingStates[model.name] || model.status === "loading"}
                sx={{ textTransform: "none" }}
              >
                {model.status === "loading" ? "Loading..." : "Start"}
              </Button>
            ) : (
              <Button
                variant="outlined"
                size="small"
                onClick={() => onStopModel(model.name)}
                disabled={loadingStates[model.name]}
                sx={{ textTransform: "none" }}
              >
                Stop
              </Button>
            )}
            <Button
              variant="outlined"
              size="small"
              sx={{ textTransform: "none" }}
            >
              Details
            </Button>
          </Box>
        </Box>
      ))}
    </Box>
  );
};

export default ModelsList;
