"use client";

import { Box } from "@mui/material";
import { MainLayout } from "@/components/layout/main-layout";
import { HeroSection } from "./page/components/HeroSection";
import { FeaturesSection } from "./page/components/FeaturesSection";
import { QuickStats } from "./page/components/QuickStats";
import { TechStack } from "./page/components/TechStack";
import { GettingStarted } from "./page/components/GettingStarted";

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
