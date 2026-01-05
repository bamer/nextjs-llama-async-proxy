"use client";

import React from "react";
import MuiCard from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import LinearProgress from "@mui/material/LinearProgress";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";

export type ModelStatus = "running" | "idle" | "loading" | "error" | "stopped";

export interface ModelData {
  name: string;
  status: ModelStatus;
  size: string;
  path: string;
  tokensPerSec: number;
  activeRequests: number;
  memoryUsed: string;
  parameters?: string;
  uptime?: string;
  progress?: number;
}

interface ModelCardProps {
  model: ModelData;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
  onStart: () => void;
  onStop: () => void;
  onConfigure: () => void;
  onStats: () => void;
  onClone: () => void;
  onMenu: (action: string) => void;
}

const STATUS_ICONS: Record<ModelStatus, string> = {
  running: "🔥",
  idle: "⭕",
  loading: "⏳",
  error: "⚠️",
  stopped: "⏹️",
};

interface StatItemProps {
  label: string;
  value: string | number;
  icon?: string;
}

const StatItem: React.FC<StatItemProps> = ({ label, value, icon }) => (
  <Box sx={{ textAlign: "center", minWidth: 72 }}>
    <Typography variant="body2" sx={{ color: "text.secondary", mb: 0.5, fontSize: 11 }}>
      {icon} {label}
    </Typography>
    <Typography variant="body1" sx={{ fontWeight: 600, fontSize: 13 }}>
      {value}
    </Typography>
  </Box>
);

interface HeaderProps {
  model: ModelData;
  onMenu: (action: string) => void;
}

const CardHeader: React.FC<HeaderProps> = ({ model, onMenu }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMenuAction = (action: string) => {
    onMenu(action);
    handleMenuClose();
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, overflow: "hidden" }}>
        <Typography sx={{ fontSize: 16 }}>{STATUS_ICONS[model.status]}</Typography>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            fontSize: 15,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {model.name}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <StatusBadge status={model.status} />
        <IconButton size="small" onClick={handleMenuClick} aria-label="More options">
          <Typography sx={{ fontSize: 18 }}>⋮</Typography>
        </IconButton>
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItem onClick={() => handleMenuAction("details")}>View Details</MenuItem>
          <MenuItem onClick={() => handleMenuAction("logs")}>View Logs</MenuItem>
          <MenuItem onClick={() => handleMenuAction("rename")}>Rename</MenuItem>
          <Divider />
          <MenuItem onClick={() => handleMenuAction("delete")} sx={{ color: "error.main" }}>
            Delete
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};

interface MetaInfoProps {
  model: ModelData;
}

const MetaInfo: React.FC<MetaInfoProps> = ({ model }) => (
  <Box sx={{ mb: 2 }}>
    <Typography variant="body2" sx={{ color: "text.secondary", mb: 0.5, fontSize: 12 }}>
      {model.parameters ? `${model.parameters} parameters` : ""}
      {model.parameters && model.size ? " • " : ""}
      {model.size ? model.size : ""}
    </Typography>
    <Typography
      variant="body2"
      sx={{ color: "text.secondary", fontSize: 11, fontFamily: "monospace" }}
    >
      {model.path}
    </Typography>
    {model.uptime && model.status === "running" && (
      <Typography variant="body2" sx={{ color: "success.main", fontSize: 11, mt: 0.5 }}>
        Running for {model.uptime}
      </Typography>
    )}
  </Box>
);

interface StatsRowProps {
  model: ModelData;
}

const StatsRow: React.FC<StatsRowProps> = ({ model }) => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "space-around",
      py: 1.5,
      bgcolor: "action.hover",
      borderRadius: 1,
      mb: 2,
    }}
  >
    <StatItem label="Tokens/sec" value={model.tokensPerSec.toFixed(1)} icon="⚡" />
    <StatItem label="Active" value={model.activeRequests} icon="📡" />
    <StatItem label="Memory" value={model.memoryUsed} icon="🖥️" />
  </Box>
);

interface ActionButtonsProps {
  isRunning: boolean;
  isLoading: boolean;
  onStart: () => void;
  onStop: () => void;
  onConfigure: () => void;
  onStats: () => void;
  onClone: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  isRunning,
  isLoading,
  onStart,
  onStop,
  onConfigure,
  onStats,
  onClone,
}) => (
  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
    <Button
      variant={isRunning ? "outlined" : "contained"}
      onClick={isRunning ? onStop : onStart}
      disabled={isLoading}
      size="small"
      aria-label={isRunning ? "Stop model" : "Start model"}
    >
      {isRunning ? "Stop" : "Start"}
    </Button>
    <Tooltip title="Configure">
      <IconButton onClick={onConfigure} aria-label="Configure" size="small">
        <Typography sx={{ fontSize: 16 }}>⚙️</Typography>
      </IconButton>
    </Tooltip>
    <Tooltip title="Stats">
      <IconButton onClick={onStats} aria-label="Stats" size="small">
        <Typography sx={{ fontSize: 16 }}>📊</Typography>
      </IconButton>
    </Tooltip>
    <Tooltip title="Clone">
      <IconButton onClick={onClone} aria-label="Clone" size="small">
        <Typography sx={{ fontSize: 16 }}>📋</Typography>
      </IconButton>
    </Tooltip>
  </Box>
);

export const ModelCard: React.FC<ModelCardProps> = ({
  model,
  isSelected,
  onSelect,
  onStart,
  onStop,
  onConfigure,
  onStats,
  onClone,
  onMenu,
}) => {
  const isRunning = model.status === "running";
  const isLoading = model.status === "loading";

  return (
    <MuiCard
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        transition: "all 0.2s ease-in-out",
        "&:hover": { transform: "translateY(-2px)", boxShadow: 3 },
        border: isSelected ? 2 : 1,
        borderColor: isSelected ? "primary.main" : "divider",
      }}
    >
      {isLoading && <LinearProgress sx={{ position: "absolute", width: "100%" }} />}
      <CardContent sx={{ flex: 1, pt: isLoading ? 1 : 2, px: 2, pb: 1.5 }}>
        {onSelect && (
          <Box sx={{ mb: 1 }}>
            <input
              type="checkbox"
              checked={isSelected || false}
              onChange={(e) => onSelect?.(e.target.checked)}
              aria-label={`Select ${model.name}`}
            />
          </Box>
        )}
        <CardHeader model={model} onMenu={onMenu} />
        <MetaInfo model={model} />
        {isRunning && <StatsRow model={model} />}
      </CardContent>
      <Box sx={{ px: 2, pb: 2 }}>
        <ActionButtons
          isRunning={isRunning}
          isLoading={isLoading}
          onStart={onStart}
          onStop={onStop}
          onConfigure={onConfigure}
          onStats={onStats}
          onClone={onClone}
        />
      </Box>
    </MuiCard>
  );
};

export default ModelCard;
