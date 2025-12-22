"use client";

import { Card, CardContent, CardHeader, List, ListItem, ListItemText, Divider, Typography, Chip, Box, IconButton, Tooltip } from "@mui/material";
import { useStore } from "@lib/store";
import { motion } from "framer-motion";
import { Info, Warning, Error, CheckCircle } from "@mui/icons-material";
import { format } from "date-fns";

export function LogsViewer() {
  const logs = useStore((state) => state.logs);

  const getLogIcon = (level: string) => {
    switch (level) {
      case "error":
        return <Error color="error" fontSize="small" />;
      case "warn":
        return <Warning color="warning" fontSize="small" />;
      case "info":
        return <Info color="info" fontSize="small" />;
      default:
        return <CheckCircle color="success" fontSize="small" />;
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case "error":
        return "error";
      case "warn":
        return "warning";
      case "info":
        return "info";
      default:
        return "success";
    }
  };

  if (logs.length === 0) {
    return (
      <Card sx={{ height: "100%" }}>
        <CardHeader title="System Logs" subheader="Real-time application logs" />
        <CardContent>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            No logs available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardHeader
        title="System Logs"
        subheader="Real-time application logs"
        action={
          <Tooltip title="Clear logs">
            <IconButton edge="end" aria-label="clear">
              <CheckCircle />
            </IconButton>
          </Tooltip>
        }
      />
      <CardContent sx={{ flexGrow: 1, overflow: "auto", maxHeight: "600px" }}>
        <List dense>
          {logs.map((log, index) => (
            <motion.div
              key={log.id || index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ListItem alignItems="flex-start" sx={{ py: 1.5 }}>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" mb={0.5}>
                      {getLogIcon(log.level)}
                      <Chip
                        label={log.level.toUpperCase()}
                        color={getLogColor(log.level)}
                        size="small"
                        sx={{ ml: 1, fontWeight: "bold" }}
                      />
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        ml={1}
                        component="span"
                      >
                        {format(new Date(log.timestamp), "HH:mm:ss")}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Typography
                      variant="body2"
                      component="div"
                      color="text.primary"
                      sx={{ whiteSpace: "pre-wrap" }}
                    >
                      {log.message}
                      {log.context && (
                        <Box
                          component="pre"
                          sx={{
                            mt: 1,
                            p: 1,
                            bgcolor: "background.paper",
                            borderRadius: "4px",
                            overflow: "auto",
                            fontSize: "0.75rem",
                          }}
                        >
                          {JSON.stringify(log.context, null, 2)}
                        </Box>
                      )}
                    </Typography>
                  }
                />
              </ListItem>
              {index < logs.length - 1 && <Divider component="li" />}
            </motion.div>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}