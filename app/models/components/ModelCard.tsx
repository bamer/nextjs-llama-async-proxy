"use client";

import { Card, CardContent, Typography, Box, Chip, IconButton, Tooltip, CircularProgress, Badge } from "@mui/material";
import { MoreVert, Science } from "@mui/icons-material";
import { useTheme } from "@/contexts/ThemeContext";
import { ModelData } from "../types";
import { normalizeStatus, getStatusColor, storeToModelData } from "../utils/model-utils";
import { ModelMetadata } from "./ModelMetadata";
import { ModelActions } from "./ModelActions";

interface ModelCardProps {
  model: import("@/types").ModelConfig;
  isDark: boolean;
  loading: string | null;
  analyzingModelId: string | null;
  onMenuClick: (event: React.MouseEvent<HTMLElement>, modelId: string) => void;
  onConfigure: (model: ModelData) => void;
  onStart: (modelId: string) => void;
  onStop: (modelId: string) => void;
  onAnalyze: (modelName: string) => void;
}

export function ModelCard({
  model,
  isDark,
  loading,
  analyzingModelId,
  onMenuClick,
  onConfigure,
  onStart,
  onStop,
  onAnalyze,
}: ModelCardProps) {
  const modelData = storeToModelData(model);

  return (
    <Card
      sx={{
        height: "100%",
        background: isDark ? "rgba(30, 41, 59, 0.5)" : "rgba(248, 250, 252, 0.8)",
        backdropFilter: "blur(10px)",
        border: `1px solid ${isDark ? "rgba(255,255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)"}`,
        transition: "all 0.3s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: isDark ? "0 12px 24px rgba(0, 0, 0, 0.2)" : "0 12px 24px rgba(0, 0, 0, 0.1)",
        },
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="subtitle1" fontWeight="medium">
            {model.name}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Chip
              label={normalizeStatus(model.status)}
              color={getStatusColor(model.status)}
              size="small"
              variant="filled"
            />
            <IconButton
              size="small"
              onClick={(e) => onMenuClick(e, model.id)}
              sx={{
                "&:hover": {
                  background: isDark ? "rgba(255,255,  white, 0.1)" : "rgba(0, 0, 0, 0.05)",
                },
              }}
            >
              <MoreVert fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary" mb={2}>
          {model.type}
        </Typography>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Created: {new Date(model.createdAt).toLocaleDateString()}
          </Typography>
          <Tooltip title="Analyze model with llama-fit-params">
            <IconButton
              size="small"
              onClick={() => onAnalyze(model.name)}
              disabled={analyzingModelId === model.name}
              sx={{
                background: isDark ? "rgba(59, 130, 246, 0.1)" : "rgba(13, 158, 248, 0.1)",
                "&:hover": {
                  background: isDark ? "rgba(59, 130, 246, 0.2)" : "rgba(13, 158, 248, 0.2)",
                },
              }}
            >
              {analyzingModelId === model.name ? <CircularProgress size={16} /> : <Science fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>

        {/* Model metadata from fit-params */}
        <ModelMetadata parameters={model.parameters} />

        {/* Config loaded indicators */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 2 }}>
          <Badge
            color={modelData.sampling ? "success" : "default"}
            overlap="circular"
            badgeContent={modelData.sampling ? <Science sx={{ fontSize: 10 }} /> : null}
            sx={{
              "& .MuiBadge-badge": {
                width: 14,
                height: 14,
                minWidth: 14,
                borderRadius: 7,
              },
            }}
          />
        </Box>

        <ModelActions
          modelId={model.id}
          status={model.status}
          loading={loading}
          onStart={onStart}
          onStop={onStop}
          onConfigure={onConfigure}
          model={modelData}
        />
      </CardContent>
    </Card>
  );
}
