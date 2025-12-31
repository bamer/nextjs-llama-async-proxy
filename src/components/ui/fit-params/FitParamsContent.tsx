"use client";

import { Grid, Stack, Box, Typography, Button } from "@mui/material";
import type { FitParamsData } from "@/hooks/use-fit-params";
import { useTheme } from "@/contexts/ThemeContext";
import { Info as InfoIcon } from "@mui/icons-material";
import {
  hasRecommendations,
  renderAnalysisStatus,
  getAllFitParamsInfo,
  getFitParamsStatus,
} from "@/lib/model-fit-params";
import FormSwitch from "@/components/ui/FormSwitch";

export interface FitParamsContentProps {
  fitParams: FitParamsData | null;
  selectedParams: Set<string>;
  onToggleParam: (paramName: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}

export default function FitParamsContent({
  fitParams,
  selectedParams,
  onToggleParam,
  onSelectAll,
  onClearAll,
}: FitParamsContentProps): React.ReactElement {
  const { isDark } = useTheme();
  const status = getFitParamsStatus(fitParams);

  if (!fitParams || fitParams.fit_params_error) {
    return (
      <Box>
        <Typography variant="body2">{status.message}</Typography>
      </Box>
    );
  }

  if (!hasRecommendations(fitParams)) {
    return (
      <Box>
        <Typography variant="body2">{status.message}</Typography>
      </Box>
    );
  }

  const paramInfos = getAllFitParamsInfo(fitParams);

  return (
    <Stack spacing={3}>
      {/* Analysis Status */}
      {renderAnalysisStatus(fitParams, isDark)}

      {/* Recommended Parameters */}
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
        Recommended Parameters
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Select which parameters to apply. All parameters will be applied together.
      </Typography>

      <Grid container spacing={2}>
        {paramInfos.map((paramInfo) => (
          <Grid key={paramInfo.key} size={{ xs: 12 }}>
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              justifyContent="space-between"
            >
              <Box>
                <Typography variant="body2" fontWeight="medium">
                  {paramInfo.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {paramInfo.value}
                </Typography>
              </Box>
              <FormSwitch
                checked={selectedParams.has(paramInfo.key)}
                onChange={() => onToggleParam(paramInfo.key)}
                label=""
                size="small"
              />
            </Stack>
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions */}
      <Box sx={{ mt: 3, display: "flex", gap: 2, justifyContent: "flex-end" }}>
        <Button
          size="small"
          onClick={onSelectAll}
          sx={{ mr: 1 }}
          disabled={selectedParams.size === 0}
        >
          Select All
        </Button>
        <Button
          size="small"
          onClick={onClearAll}
          disabled={selectedParams.size === 0}
        >
          Clear All
        </Button>
      </Box>

      {/* Raw Output (expandable) */}
      {fitParams.fit_params_raw_output && (
        <Box sx={{ mt: 2 }}>
          <Typography
            variant="subtitle2"
            fontWeight="bold"
            sx={{
              mb: 1,
              display: "flex",
              alignItems: "center",
              gap: 1,
              cursor: "pointer",
            }}
          >
            <InfoIcon sx={{ fontSize: 14 }} />
            Raw Analysis Output
          </Typography>
          <Box
            sx={{
              p: 2,
              bgcolor: isDark ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.1)",
              borderRadius: 1,
              fontFamily: "monospace",
              fontSize: "0.8rem",
              maxHeight: 200,
              overflowY: "auto",
            }}
          >
            <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>
              {fitParams.fit_params_raw_output}
            </pre>
          </Box>
        </Box>
      )}
    </Stack>
  );
}
