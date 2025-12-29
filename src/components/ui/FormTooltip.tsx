"use client";

import { Tooltip, TooltipProps, Typography, Box, IconButton } from "@mui/material";
import { Info } from "@mui/icons-material";
import { TooltipContent } from "@/config/tooltip-config";

interface FormTooltipProps {
  content: TooltipContent;
  size?: "small" | "medium";
  placement?: TooltipProps["placement"];
  enterDelay?: number;
  enterNextDelay?: number;
  leaveDelay?: number;
  children?: React.ReactNode;
}

export function FormTooltip({
  content,
  size = "medium",
  placement = "right",
  children,
  enterDelay = 500,
  enterNextDelay = 500,
}: FormTooltipProps) {
  const fontSize = size === "small" ? "0.75rem" : "0.875rem";

  const tooltipContent = (
    <Box sx={{ maxWidth: 400, p: 1 }}>
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 600,
          mb: 1,
          color: "primary.main",
          fontSize: `${parseFloat(fontSize) * 1.1}rem`,
        }}
      >
        {content.title}
      </Typography>

      <Typography variant="body2" sx={{ fontSize, mb: 1, lineHeight: 1.5 }}>
        {content.description}
      </Typography>

      {content.recommendedValue && (
        <Box sx={{ mb: 1 }}>
          <Typography
            variant="caption"
            sx={{
              fontSize: `${parseFloat(fontSize) * 0.9}rem`,
              fontWeight: 600,
              color: "success.main",
            }}
          >
            Recommended: {content.recommendedValue}
          </Typography>
        </Box>
      )}

      {content.effectOnModel && (
        <Box sx={{ mb: 1 }}>
          <Typography
            variant="caption"
            sx={{
              fontSize: `${parseFloat(fontSize) * 0.9}rem`,
              fontWeight: 600,
              color: "info.main",
            }}
          >
            Effect:
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontSize: `${parseFloat(fontSize) * 0.9}rem`,
              display: "block",
              lineHeight: 1.4,
            }}
          >
            {content.effectOnModel}
          </Typography>
        </Box>
      )}

      {content.whenToAdjust && (
        <Box>
          <Typography
            variant="caption"
            sx={{
              fontSize: `${parseFloat(fontSize) * 0.9}rem`,
              fontWeight: 600,
              color: "warning.main",
            }}
          >
            When to adjust:
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontSize: `${parseFloat(fontSize) * 0.9}rem`,
              display: "block",
              lineHeight: 1.4,
            }}
          >
            {content.whenToAdjust}
          </Typography>
        </Box>
      )}
    </Box>
  );

  if (!children) {
    return (
      <Tooltip
        title={tooltipContent}
        placement={placement}
        arrow
        enterDelay={enterDelay}
        enterNextDelay={enterNextDelay}
      >
        <IconButton
          size="small"
          sx={{
            color: "text.secondary",
            ml: 0.5,
            "&:hover": {
              color: "primary.main",
            },
          }}
          aria-label={`Info about ${content.title}`}
        >
          <Info sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <Tooltip
      title={tooltipContent}
      placement={placement}
      arrow
      enterDelay={enterDelay}
      enterNextDelay={enterNextDelay}
    >
      {children as React.ReactElement}
    </Tooltip>
  );
}

interface FieldWithTooltipProps {
  children: React.ReactNode;
  content: TooltipContent;
}

export function FieldWithTooltip({ children, content }: FieldWithTooltipProps) {
  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
      <Box sx={{ flex: 1 }}>{children}</Box>
      <FormTooltip content={content} />
    </Box>
  );
}

interface LabelWithTooltipProps {
  label: string;
  content: TooltipContent;
  required?: boolean;
}

export function LabelWithTooltip({ label, content, required }: LabelWithTooltipProps) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      <Typography variant="inherit" component="span">
        {label}
        {required && " *"}
      </Typography>
      <FormTooltip content={content} />
    </Box>
  );
}
