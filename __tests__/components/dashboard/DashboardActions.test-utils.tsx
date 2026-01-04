import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { DashboardActions } from "@/components/dashboard/DashboardActions";

export const createMockHandlers = () => ({
  onRestart: jest.fn(),
  onStart: jest.fn(),
  onRefresh: jest.fn(),
  onDownloadLogs: jest.fn(),
});

export const renderDashboardActions = (serverRunning: boolean, serverLoading: boolean) =>
  render(
    <DashboardActions
      serverRunning={serverRunning}
      serverLoading={serverLoading}
      {...createMockHandlers()}
    />
  );
