"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { Typography, Box, Button, Card, CardContent, Grid } from "@mui/material";


import { Rocket, Dashboard, ModelTraining, Monitor, Settings, BarChart, Code, Cloud, Terminal } from "@mui/icons-material";
import Link from "next/link";
import { useTheme } from "@/contexts/ThemeContext";

export default function HomePage() {
  const { isDark } = useTheme();

  const features = [
    {
      icon: <Dashboard color="primary" sx={{ fontSize: 40 }} />,
      title: "Real-time Dashboard",
      description: "Monitor your AI models with live metrics and performance data",
      path: "/dashboard",
    },
    {
      icon: <ModelTraining color="secondary" sx={{ fontSize: 40 }} />,
      title: "Model Management",
      description: "Easily configure and control multiple AI models",
      path: "/models",
    },
    {
      icon: <Monitor color="success" sx={{ fontSize: 40 }} />,
      title: "Advanced Monitoring",
      description: "Track system health and performance in real-time",
      path: "/monitoring",
    },
    {
      icon: <Settings color="warning" sx={{ fontSize: 40 }} />,
      title: "Custom Configuration",
      description: "Fine-tune your setup with advanced settings",
      path: "/settings",
    },
  ];

  const stats = [
    { value: "4+", label: "Active Models", color: "primary" },
    { value: "99.9%", label: "Uptime", color: "secondary" },
    { value: "150ms", label: "Avg Response", color: "success" },
    { value: "1000+", label: "Requests", color: "warning" },
  ];

  return (
    
    <MainLayout>
      <Box sx={{ flexGrow: 1, py: 4 }}>
        {/* Hero section */}
          <Box textAlign="center" mb={6}>
              <Box sx={{ 
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: isDark ? 'linear-gradient(135deg, #3b82f6 0%, #a855f7 100%)' : 'linear-gradient(135deg, #0d9ef8 0%, #a855f7 100%)',
                boxShadow: isDark ? '0 8px 30px rgba(59, 130, 246, 0.3)' : '0 8px 30px rgba(13, 158, 248, 0.3)',
                mb: 3
              }}>
                <Rocket sx={{ color: 'white', fontSize: 40 }} />
              </Box>

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
              sx={{ 
                fontWeight: "bold",
                px: 4,
                py: 1.5,
                borderRadius: '8px',
                boxShadow: isDark ? '0 4px 12px rgba(59, 130, 246, 0.3)' : '0 4px 12px rgba(13, 158, 248, 0.3)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: isDark ? '0 6px 20px rgba(59, 130, 246, 0.4)' : '0 6px 20px rgba(13, 158, 248, 0.4)',
                }
              }}
            >
              Get Started
            </Button>
          </Box>
        {/* Features grid */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" fontWeight="bold" textAlign="center" mb={4}>
            Key Features
          </Typography>
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item key={index} xs={12} sm={6} lg={3}>
                 
                  <Link href={feature.path} style={{ textDecoration: "none" }}>
                    <Card
                      sx={{ 
                        height: "100%",
                        transition: "transform 0.3s, box-shadow 0.3s",
                        background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)',
                        backdropFilter: 'blur(10px)',
                        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
                        '&:hover': {
                          transform: 'translateY(-5px)',
                          boxShadow: isDark ? '0 12px 24px rgba(0, 0, 0, 0.2)' : '0 12px 24px rgba(0, 0, 0, 0.1)'
                        }
                      }}
                    >
                      <CardContent sx={{ textAlign: "center", p: 4 }}>
                        <Box mb={2} fontSize="3rem" sx={{ color: isDark ? '#3b82f6' : '#0d9ef8' }}>
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

        {/* Quick stats */}

          <Card sx={{ mb: 4, background: isDark ? 'rgba(30, 41, 59, 0.3)' : 'rgba(248, 250, 252, 0.5)', backdropFilter: 'blur(10px)' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, textAlign: 'center' }}>
                Quick Stats
              </Typography>
              <Grid container spacing={3} justifyContent="center">
                {stats.map((stat, index) => (
                  <Grid item key={index} xs={6} sm={3}>
                    <Typography variant="h4" fontWeight="bold" color={stat.color}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.label}
                    </Typography>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        {/* Technology Stack */}

          <Card sx={{ background: isDark ? 'rgba(30, 41, 59, 0.3)' : 'rgba(248, 250, 252, 0.5)', backdropFilter: 'blur(10px)' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2} textAlign="center">
                Built with Modern Technologies
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, flexWrap: 'wrap', mb: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ p: 2, background: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(13, 158, 248, 0.1)', borderRadius: '8px' }}>
                    <BarChart sx={{ color: isDark ? '#3b82f6' : '#0d9ef8', fontSize: 32 }} />
                  </Box>
                  <Typography variant="caption" fontWeight="medium">Next.js</Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ p: 2, background: isDark ? 'rgba(168, 85, 247, 0.1)' : 'rgba(168, 85, 247, 0.1)', borderRadius: '8px' }}>
                    <Code sx={{ color: isDark ? '#a855f7' : '#a855f7', fontSize: 32 }} />
                  </Box>
                  <Typography variant="caption" fontWeight="medium">Material UI</Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ p: 2, background: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.1)', borderRadius: '8px' }}>
                    <Cloud sx={{ color: isDark ? '#22c55e' : '#22c55e', fontSize: 32 }} />
                  </Box>
                  <Typography variant="caption" fontWeight="medium">WebSocket</Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ p: 2, background: isDark ? 'rgba(234, 179, 8, 0.1)' : 'rgba(234, 179, 8, 0.1)', borderRadius: '8px' }}>
                    <Terminal sx={{ color: isDark ? '#eab308' : '#eab308', fontSize: 32 }} />
                  </Box>
                  <Typography variant="caption" fontWeight="medium">TypeScript</Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Powered by modern web technologies for optimal performance and developer experience
              </Typography>
            </CardContent>
          </Card>
       
        {/* Getting started */}
        <Box sx={{ mt: 6 }}>
            <Card sx={{ background: isDark ? 'rgba(30, 41, 59, 0.3)' : 'rgba(248, 250, 252, 0.5)', backdropFilter: 'blur(10px)' }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  Getting Started
                </Typography>
                <Typography variant="body1" paragraph>
                  New to Llama Runner Pro? Here are some steps to help you get started:
                </Typography>
                <Box component="ol" sx={{ pl: 2, mb: 3 }}>
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
                    sx={{ borderRadius: '8px' }}
                  >
                    View Documentation
                  </Button>
                </Box>
              </CardContent>
            </Card>
        </Box>
      </Box>
    </MainLayout>
  );
}
