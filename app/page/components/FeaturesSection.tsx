"use client";

import { Box, Typography, Grid, Card, CardContent } from "@mui/material";
import Link from "next/link";
import { useTheme } from "@/contexts/ThemeContext";
import { features } from "../features-data";

export function FeaturesSection() {
  const { isDark } = useTheme();

  return (
    <Box sx={{ mb: 6 }}>
      <Typography variant="h4" fontWeight="bold" textAlign="center" mb={4}>
        Key Features
      </Typography>
      <Grid container spacing={4}>
        {features.map((feature, index) => (
          <Grid key={index} size={{ xs: 12, sm: 6, lg: 3 }}>
            <Link href={feature.path} style={{ textDecoration: "none" }}>
              <Card
                sx={{
                  height: "100%",
                  transition: "transform 0.3s, box-shadow 0.3s",
                  background: isDark ? "rgba(30, 41, 59, 0.5)" : "rgba(248, 250, 252, 0.8)",
                  backdropFilter: "blur(10px)",
                  border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)"}`,
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: isDark
                      ? "0 12px 24px rgba(0, 0, 0, 0.2)"
                      : "0 12px 24px rgba(0, 0, 0, 0.1)",
                  },
                }}
              >
                <CardContent sx={{ textAlign: "center", p: 4 }}>
                  <Box mb={2} fontSize="3rem" sx={{ color: isDark ? "#3b82f6" : "#0d9ef8" }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Link>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
