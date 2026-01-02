"use client";

import { Box, Tabs } from "@mui/material";
import { memo } from "react";
import { ConfigType } from "@/types/model-config";
import { ConfigTypeSelectorProps } from "./types";
import { configTypeData } from "./config-type-data";
import { CompactTabContent } from "./CompactTabContent";
import { VerticalConfigItem } from "./VerticalConfigItem";
import { useTheme } from "@mui/material/styles";

const ConfigTypeSelector = memo(({ selectedType, onSelect, counts, compact = false }: ConfigTypeSelectorProps) => {
  const theme = useTheme();

  if (compact) {
    return (
      <Tabs
        value={selectedType || false}
        onChange={(_e, newValue) => onSelect(newValue as ConfigType)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          minHeight: 48,
          "& .MuiTabs-indicator": {
            height: 3,
            borderRadius: "3px 3px 0 0",
          },
          "& .MuiTab-root": {
            minHeight: 48,
            padding: "6px 16px",
            fontSize: "0.875rem",
            fontWeight: 500,
            textTransform: "none",
          },
        }}
      >
        {configTypeData.map(({ type, label, icon, color }) => (
          <CompactTabContent
            key={type}
            type={type}
            label={label}
            icon={icon}
            color={color}
            selectedType={selectedType}
            counts={counts}
          />
        ))}
      </Tabs>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
        p: 2,
        backgroundColor: theme.palette.mode === "dark" ? "grey.800" : "grey.100",
        borderRadius: 1,
      }}
    >
      {configTypeData.map((data) => (
        <VerticalConfigItem
          key={data.type}
          data={data}
          selectedType={selectedType}
          counts={counts}
          onSelect={onSelect}
        />
      ))}
    </Box>
  );
});

ConfigTypeSelector.displayName = "ConfigTypeSelector";

export default ConfigTypeSelector;
