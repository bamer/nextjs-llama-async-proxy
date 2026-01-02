"use client";

import { Box } from "@mui/material";
import { MainLayout } from "@/components/layout/main-layout";
import { HeroSection } from "./components/HeroSection";
import { FeaturesSection } from "./components/FeaturesSection";
import { QuickStats } from "./components/QuickStats";
import { TechStack } from "./components/TechStack";
import { GettingStarted } from "./components/GettingStarted";

export default function HomePage() {
  return (
    <MainLayout>
      <Box sx={{ flexGrow: 1, py: 4 }}>
        <HeroSection />
        <FeaturesSection />
        <QuickStats />
        <TechStack />
        <GettingStarted />
      </Box>
    </MainLayout>
  );
}
