import { Box, Typography, Chip, Divider } from "@mui/material";
import { m } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";

interface DashboardHeaderProps {
  isConnected: boolean;
}

export function DashboardHeader({
  isConnected,
}: DashboardHeaderProps): React.ReactNode {
  const { isDark } = useTheme();

  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <m.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h3" component="h1" fontWeight="bold">
            Llama Runner Pro Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Real-time AI Model Management & Monitoring
          </Typography>
        </m.div>
        <Box sx={{ textAlign: "right" }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, display: "block" }}>
            {isConnected ? "WebSocket Connected" : "WebSocket Disconnected"}
          </Typography>
          <Chip
            label={isConnected ? "CONNECTED" : "DISCONNECTED"}
            color={isConnected ? "success" : "error"}
            size="small"
            variant="filled"
            sx={{
              fontWeight: "bold",
              animation: !isConnected ? "pulse 2s infinite" : "none",
              "@keyframes pulse": {
                "0%": { boxShadow: "0 0 0 0 rgba(255, 82, 82, 0.7)" },
                "70%": { boxShadow: "0 0 0 10px rgba(255, 82, 82, 0)" },
                "100%": { boxShadow: "0 0 0 0 rgba(255, 82, 82, 0)" },
              },
            }}
          />
        </Box>
      </Box>

      <Divider
        sx={{
          my: 4,
          borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        }}
      />
    </>
  );
}
