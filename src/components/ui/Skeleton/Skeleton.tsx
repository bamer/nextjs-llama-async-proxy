"use client";

import { Skeleton as MuiSkeleton, Box, Grid } from "@mui/material";

export type SkeletonVariant = "card" | "table" | "list";

interface SkeletonProps {
  variant?: SkeletonVariant;
  count?: number;
}

function CardSkeleton() {
  return (
    <Box sx={{ p: 2, border: 1, borderColor: "divider", borderRadius: 2 }}>
      <MuiSkeleton variant="rectangular" width="100%" height={120} sx={{ borderRadius: 1, mb: 2 }} animation="wave" />
      <MuiSkeleton variant="text" width="60%" height={24} animation="wave" />
      <MuiSkeleton variant="text" width="80%" animation="wave" />
      <MuiSkeleton variant="text" width="40%" animation="wave" />
    </Box>
  );
}

function TableSkeleton({ count }: { count: number }) {
  return (
    <Box>
      <Box sx={{ display: "flex", gap: 2, mb: 1 }}>
        {[1, 2, 3, 4].map((i) => (
          <MuiSkeleton key={i} variant="text" width="25%" height={32} animation="wave" />
        ))}
      </Box>
      {Array.from({ length: count }).map((_, rowIndex) => (
        <Box key={rowIndex} sx={{ display: "flex", gap: 2, mb: 1 }}>
          <MuiSkeleton variant="text" width="25%" animation="wave" />
          <MuiSkeleton variant="text" width="25%" animation="wave" />
          <MuiSkeleton variant="text" width="25%" animation="wave" />
          <MuiSkeleton variant="text" width="25%" animation="wave" />
        </Box>
      ))}
    </Box>
  );
}

function ListSkeleton({ count }: { count: number }) {
  return (
    <Box>
      {Array.from({ length: count }).map((_, index) => (
        <Box key={index} sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1.5 }}>
          <MuiSkeleton variant="circular" width={40} height={40} animation="wave" />
          <Box sx={{ flex: 1 }}>
            <MuiSkeleton variant="text" width="40%" height={20} animation="wave" />
            <MuiSkeleton variant="text" width="60%" animation="wave" />
          </Box>
        </Box>
      ))}
    </Box>
  );
}

export function Skeleton({ variant = "card", count = 1 }: SkeletonProps) {
  const skeletonMap = {
    card: <CardSkeleton />,
    table: <TableSkeleton count={count} />,
    list: <ListSkeleton count={count} />,
  };

  if (variant === "card" && count > 1) {
    return (
      <Grid container spacing={2}>
        {Array.from({ length: count }).map((_, index) => (
          <Grid key={index} size={{ xs: 12, sm: 6, md: 4 }}>
            <CardSkeleton />
          </Grid>
        ))}
      </Grid>
    );
  }

  return skeletonMap[variant];
}
