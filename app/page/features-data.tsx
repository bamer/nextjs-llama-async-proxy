import { Dashboard, ModelTraining, Monitor, Settings } from "@mui/icons-material";

export interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  path: string;
}

export const features: Feature[] = [
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
