"use client";

import { Box, Typography, LinearProgress, Grid } from "@mui/material";
import { MainLayout } from "@/components/layout/main-layout";
import { SkeletonCard } from "@/components/ui";

export function ModelSkeletonLoader() {
  return (
    <MainLayout>
      <Box sx={{ p: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
            AI Models Management
          </Typography>
          <LinearProgress sx={{ height: 4, borderRadius: 2 }} />
        </Box>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <SkeletonCard height={200} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <SkeletonCard height={200} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <SkeletonCard height={200} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <SkeletonCard height={200} />
          </Grid>
        </Grid>
      </Box>
    </MainLayout>
  );
}
