import { Box, Typography, Divider } from "@mui/material";
import { m } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";

export function ConfigurationHeader(): React.ReactNode {
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
            Configuration Center
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage your application settings and preferences
          </Typography>
        </m.div>
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
