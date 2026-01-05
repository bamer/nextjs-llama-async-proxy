"use client";

import { useState } from "react";

import ListSubheader from "@mui/material/ListSubheader";
import Collapse from "@mui/material/Collapse";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Box, Typography } from "@mui/material";

interface NavSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  icon?: React.ReactNode;
}

export function NavSection({ title, children, defaultExpanded = true, icon }: NavSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <Box sx={{ mb: 1 }}>
      <ListSubheader
        component="div"
        onClick={() => setExpanded(!expanded)}
        sx={{
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          userSelect: "none",
          background: "transparent",
          transition: "background-color 0.2s ease",
          borderRadius: 1,
          "&:hover": {
            background: "action.hover",
          },
          "&::before": {
            content: '""',
            display: "block",
          },
        }}
        role="button"
        aria-expanded={expanded}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded(!expanded);
          }
        }}
      >
        <ExpandMoreIcon
          sx={{
            mr: 1,
            transition: "transform 0.2s ease-in-out",
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            fontSize: "1.2rem",
            color: "text.secondary",
          }}
        />
        {icon && (
          <Box sx={{ mr: 1, display: "flex", alignItems: "center", color: "text.secondary" }}>
            {icon}
          </Box>
        )}
        <Typography
          variant="overline"
          sx={{
            fontWeight: 600,
            letterSpacing: "0.05em",
            color: "text.secondary",
            textTransform: "uppercase",
          }}
        >
          {title}
        </Typography>
      </ListSubheader>
      <Collapse
        in={expanded}
        timeout={200}
        easing="ease-in-out"
        sx={{
          "& .MuiCollapse-wrapper": {
            transition: "height 0.2s ease-in-out",
          },
        }}
      >
        <Box sx={{ py: 0.5 }}>{children}</Box>
      </Collapse>
    </Box>
  );
}
