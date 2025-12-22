"use client";

import { Card, CardContent, CardHeader, Grid, Typography, Chip, Button, Box, LinearProgress, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { useStore } from "@lib/store";
import { motion } from "framer-motion";
import { PlayArrow, Stop, Settings, Delete, Add } from "@mui/icons-material";
import { useState } from "react";
import { useApiService } from "@hooks/use-api";

export function ModelsGrid() {
  const models = useStore((state) => state.models);
  const activeModel = useStore((state) => state.activeModelId);
  const { useStartModelMutation, useStopModelMutation } = useApiService();
  const startModelMutation = useStartModelMutation();
  const stopModelMutation = useStopModelMutation();

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelConfig | null>(null);

  const handleStartModel = (model: ModelConfig) => {
    startModelMutation.mutate(model.id);
  };

  const handleStopModel = (model: ModelConfig) => {
    stopModelMutation.mutate(model.id);
  };

  const handleSettingsClick = (model: ModelConfig) => {
    setSelectedModel(model);
    setOpenDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "success";
      case "loading":
        return "warning";
      case "error":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Card sx={{ height: "100%" }}>
      <CardHeader
        title="Model Management"
        subheader="Configure and control your AI models"
        action={
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            size="small"
          >
            Add Model
          </Button>
        }
      />
      <CardContent>
        {models.length === 0 ? (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            py={6}
          >
            <Typography variant="h6" color="text.secondary" mb={2}>
              No models available
            </Typography>
            <Button variant="outlined" startIcon={<Add />}>
              Add Your First Model
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {models.map((model, index) => (
              <Grid item xs={12} sm={6} lg={4} key={model.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    sx={{ height: "100%", position: "relative" }}
                    variant={model.id === activeModel ? "elevation" : "outlined"}
                    elevation={model.id === activeModel ? 8 : 1}
                  >
                    <CardHeader
                      title={model.name}
                      subheader={model.type}
                      action={
                        <Box display="flex" gap={0.5}>
                          <Tooltip title="Settings">
                            <IconButton
                              size="small"
                              onClick={() => handleSettingsClick(model)}
                            >
                              <Settings fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error">
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      }
                    />
                    <CardContent>
                      <Box mb={2}>
                        <Chip
                          label={model.status.toUpperCase()}
                          color={getStatusColor(model.status)}
                          size="small"
                          sx={{ fontWeight: "bold" }}
                        />
                      </Box>

                      {model.status === "loading" && (
                        <Box mb={2}>
                          <LinearProgress color="warning" sx={{ height: "4px" }} />
                        </Box>
                      )}

                      <Typography variant="body2" color="text.secondary" paragraph>
                        {model.parameters?.description || "No description available"}
                      </Typography>

                      <Box display="flex" gap={1} mt={2}>
                        {model.status === "idle" && (
                          <Button
                            variant="contained"
                            color="primary"
                            startIcon={<PlayArrow />}
                            size="small"
                            fullWidth
                            onClick={() => handleStartModel(model)}
                            disabled={startModelMutation.isPending}
                          >
                            Start
                          </Button>
                        )}
                        {model.status === "running" && (
                          <Button
                            variant="outlined"
                            color="secondary"
                            startIcon={<Stop />}
                            size="small"
                            fullWidth
                            onClick={() => handleStopModel(model)}
                            disabled={stopModelMutation.isPending}
                          >
                            Stop
                          </Button>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        )}
      </CardContent>

      {/* Model Settings Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Model Configuration</DialogTitle>
        <DialogContent dividers>
          {selectedModel && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedModel.name}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {selectedModel.type}
              </Typography>

              <Box mt={3} mb={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Parameters:
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    p: 2,
                    bgcolor: "background.paper",
                    borderRadius: "8px",
                    overflow: "auto",
                    fontSize: "0.8rem",
                  }}
                >
                  {JSON.stringify(selectedModel.parameters, null, 2)}
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="inherit">
            Close
          </Button>
          <Button variant="contained" color="primary" onClick={() => setOpenDialog(false)}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}