"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { Typography, Box, Button, Grid, Card, CardContent } from "@mui/material";
import { motion } from "framer-motion";
import { Rocket, Dashboard, ModelTraining, Monitor, Settings } from "@mui/icons-material";
import Link from "next/link";

export default function HomePage() {
  const features = [
    {
      icon: <Dashboard color="primary" />,
      title: "Real-time Dashboard",
      description: "Monitor your AI models with live metrics and performance data",
      path: "/dashboard",
    },
    {
      icon: <ModelTraining color="secondary" />,
      title: "Model Management",
      description: "Easily configure and control multiple AI models",
      path: "/models",
    },
    {
      icon: <Monitor color="success" />,
      title: "Advanced Monitoring",
      description: "Track system health and performance in real-time",
      path: "/monitoring",
    },
    {
      icon: <Settings color="warning" />,
      title: "Custom Configuration",
      description: "Fine-tune your setup with advanced settings",
      path: "/settings",
    },
  ];

  return (
    <MainLayout>
      <Box sx={{ flexGrow: 1, py: 4 }}>
        {/* Hero section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box textAlign="center" mb={6}>
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <Rocket color="primary" sx={{ fontSize: 60, mb: 2 }} />
            </motion.div>
            <Typography variant="h2" component="h1" fontWeight="bold" gutterBottom>
              Welcome to Llama Runner Pro
            </Typography>
            <Typography variant="h5" color="text.secondary" maxWidth="800px" mx="auto" mb={4}>
              The ultimate platform for managing and monitoring your AI models with real-time
              data and advanced analytics
            </Typography>
            <Button
              variant="contained"
              size="large"
              color="primary"
              component={Link}
              href="/dashboard"
              sx={{ fontWeight: "bold" }}
            >
              Get Started
            </Button>
          </Box>
        </motion.div>

        {/* Features grid */}
        <Grid container spacing={4} mb={6}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={feature.path} style={{ textDecoration: "none" }}>
                  <Card
                    sx={{ height: "100%", transition: "transform 0.3s", "&:hover": { transform: "translateY(-5px)" } }}
                  >
                  <CardContent sx={{ textAlign: "center", p: 4 }}>
                    <Box mb={2} fontSize="3rem">
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
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Quick stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Quick Stats
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" fontWeight="bold" color="primary">
                      4+
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Models
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" fontWeight="bold" color="secondary">
                      99.9%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Uptime
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" fontWeight="bold" color="success">
                      150ms
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg Response
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" fontWeight="bold" color="warning">
                      1000+
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Requests
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </motion.div>

        {/* Getting started */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Getting Started
              </Typography>
              <Typography variant="body1" paragraph>
                New to Llama Runner Pro? Here are some steps to help you get started:
              </Typography>
              <Box component="ol" sx={{ pl: 2 }}>
                <li>Connect your AI models through the settings</li>
                <li>Configure model parameters and settings</li>
                <li>Start monitoring real-time performance</li>
                <li>Analyze metrics and optimize your setup</li>
              </Box>
              <Box mt={3} display="flex" justifyContent="flex-end">
                <Button
                  variant="outlined"
                  color="primary"
                  component={Link}
                  href="/docs"
                >
                  View Documentation
                </Button>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      </Box>
    </MainLayout>
  );
}