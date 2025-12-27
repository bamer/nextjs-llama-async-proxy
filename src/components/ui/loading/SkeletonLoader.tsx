"use client";

import { Box, Card, CardContent, Skeleton, Typography } from "@mui/material";
import { useTheme } from "@/contexts/ThemeContext";

interface SkeletonCardProps {
  count?: number;
  height?: number;
}

export function SkeletonCard({ count = 1, height = 200 }: SkeletonCardProps) {
  const { isDark } = useTheme();

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Box
          key={index}
          sx={{
            p: 3,
            background: isDark
              ? "rgba(30, 41, 59, 0.5)"
              : "rgba(248, 250, 252, 0.8)",
            backdropFilter: "blur(10px)",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}`,
            borderRadius: 2,
            height,
          }}
        >
          <Skeleton
            variant="text"
            sx={{
              fontSize: "1.25rem",
              width: "60%",
              mb: 2,
            }}
          />
          <Skeleton
            variant="rectangular"
            sx={{
              height: 60,
              mb: 2,
              borderRadius: 1,
            }}
          />
          <Skeleton
            variant="rectangular"
            sx={{
              height: 8,
              width: "40%",
              borderRadius: 1,
            }}
          />
        </Box>
      ))}
    </>
  );
}

interface SkeletonMetricCardProps {
  icon?: string;
}

export function SkeletonMetricCard({ icon }: SkeletonMetricCardProps) {
  const { isDark } = useTheme();

  return (
    <Card
      sx={{
        height: "100%",
        background: isDark ? "rgba(30, 41, 59, 0.5)" : "rgba(248, 250, 252, 0.8)",
        backdropFilter: "blur(10px)",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}`,
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            mb: 2,
          }}
        >
          {icon && (
            <Typography variant="h3" sx={{ mr: 1 }}>
              {icon}
            </Typography>
          )}
          <Skeleton
            variant="text"
            sx={{
              fontSize: "1.15rem",
              width: "40%",
            }}
          />
        </Box>
        <Skeleton
          variant="text"
          sx={{
            fontSize: "2.75rem",
            width: "30%",
            mb: 2,
          }}
        />
        <Skeleton
          variant="rectangular"
          sx={{
            height: 8,
            borderRadius: 1,
          }}
        />
      </CardContent>
    </Card>
  );
}

interface SkeletonTableRowProps {
  rows?: number;
  columns?: number;
}

export function SkeletonTableRow({ rows = 3, columns = 4 }: SkeletonTableRowProps) {
  const { isDark } = useTheme();

  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <Box
          key={rowIndex}
          sx={{
            display: "flex",
            alignItems: "center",
            p: 2,
            background: isDark
              ? "rgba(30, 41, 59, 0.3)"
              : "rgba(248, 250, 252, 0.5)",
            borderRadius: 1,
            mb: 1,
          }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              variant="text"
              sx={{
                fontSize: "0.875rem",
                width: "30%",
                mr: 2,
              }}
            />
          ))}
        </Box>
      ))}
    </>
  );
}

interface SkeletonLogEntryProps {
  count?: number;
}

export function SkeletonLogEntry({ count = 5 }: SkeletonLogEntryProps) {
  const { isDark } = useTheme();

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Box
          key={index}
          sx={{
            mb: 2,
            background: isDark
              ? "rgba(30, 41, 59, 0.5)"
              : "rgba(248, 250, 252, 0.8)",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}`,
            borderRadius: 1,
            p: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 1.5,
            }}
          >
            <Skeleton
              variant="rectangular"
              sx={{
                width: 60,
                height: 20,
                borderRadius: 1,
              }}
            />
            <Skeleton
              variant="text"
              sx={{
                fontSize: "0.7rem",
                width: 80,
              }}
            />
          </Box>
          <Skeleton
            variant="text"
            sx={{
              fontSize: "0.875rem",
              width: "100%",
            }}
          />
        </Box>
      ))}
    </>
  );
}

interface SkeletonSettingsFormProps {
  fields?: number;
}

export function SkeletonSettingsForm({ fields = 6 }: SkeletonSettingsFormProps) {
  const { isDark } = useTheme();

  return (
    <Box
      sx={{
        p: 4,
        background: isDark
          ? "rgba(30, 41, 59, 0.5)"
          : "rgba(248, 250, 252, 0.8)",
        backdropFilter: "blur(10px)",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}`,
        borderRadius: 2,
      }}
    >
      <Skeleton
        variant="text"
        sx={{
          fontSize: "1.5rem",
          width: "40%",
          mb: 3,
        }}
      />
      {Array.from({ length: fields }).map((_, index) => (
        <Box
          key={index}
          sx={{
            mb: 3,
          }}
        >
          <Skeleton
            variant="text"
            sx={{
              fontSize: "0.875rem",
              width: "25%",
              mb: 1,
            }}
          />
          <Skeleton
            variant="rectangular"
            sx={{
              height: 56,
              borderRadius: 1,
            }}
          />
        </Box>
      ))}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          mt: 2,
        }}
      >
        <Skeleton
          variant="rectangular"
          sx={{
            width: 120,
            height: 40,
            borderRadius: 1,
          }}
        />
        <Skeleton
          variant="rectangular"
          sx={{
            width: 100,
            height: 40,
            borderRadius: 1,
          }}
        />
      </Box>
    </Box>
  );
}
