import { Box, Typography, Chip } from "@mui/material";

interface ConfigHeaderProps {
  icon: React.ReactNode;
  title: string;
  fieldsCount: number;
}

export function ConfigHeader({ icon, title, fieldsCount }: ConfigHeaderProps) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Box
        sx={{
          color: "primary.main",
          display: "flex",
          alignItems: "center",
        }}
      >
        {icon}
      </Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      <Chip
        label={fieldsCount}
        size="small"
        sx={{
          ml: 1,
          height: 20,
          fontSize: "0.75rem",
          backgroundColor: "primary.main",
          color: "primary.contrastText",
        }}
      />
    </Box>
  );
}
