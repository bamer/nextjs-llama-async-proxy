"use client";

import { useCallback, useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { useEffectEvent } from "./use-effect-event";
import { requestIdleCallback, cancelIdleCallback } from "@/utils/request-idle-callback";

const DEBOUNCE_MS = 5000; // 5 seconds minimum between updates
const BATCH_FLUSH_MS = 100; // 100ms to flush accumulated chart updates

export function useChartHistory() {
  const metrics = useStore((state) => state.metrics);
  const chartHistory = useStore((state) => state.chartHistory);
  const setChartData = useStore((state) => state.setChartData);

  // Track last update time for debouncing
  const lastUpdateRef = useRef<number>(0);

  // Accumulator for batching chart updates - stores values for all chart types
  const accumulatedUpdatesRef = useRef<{
    cpu: number | null;
    memory: number | null;
    requests: number | null;
    gpuUtil: number | null;
    power: number | null;
  }>({
    cpu: null,
    memory: null,
    requests: null,
    gpuUtil: null,
    power: null,
  });

  // Track flush timeout ID for requestIdleCallback
  const flushIdleHandleRef = useRef<number | void>(undefined);

  // Helper function to create a chart data point
  const createDataPoint = useCallback((value: number) => {
    const now = new Date();
    const displayTime = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    return { time: now.toISOString(), displayTime, value };
  }, []);

  // Flush accumulated updates to store in a single transaction
  // This is called by requestIdleCallback or setTimeout to batch all chart updates
  const flushUpdates = useCallback(() => {
    const updates = accumulatedUpdatesRef.current;

    // Create chart data points from accumulated values
    const chartDataUpdates: Record<string, Array<{ time: string; displayTime: string; value: number }>> = {};

    if (updates.cpu !== null) {
      chartDataUpdates.cpu = [createDataPoint(updates.cpu)];
    }
    if (updates.memory !== null) {
      chartDataUpdates.memory = [createDataPoint(updates.memory)];
    }
    if (updates.requests !== null) {
      chartDataUpdates.requests = [createDataPoint(updates.requests)];
    }
    if (updates.gpuUtil !== null) {
      chartDataUpdates.gpuUtil = [createDataPoint(updates.gpuUtil)];
    }
    if (updates.power !== null) {
      chartDataUpdates.power = [createDataPoint(updates.power)];
    }

    // Merge with existing chart history (limit to 60 points per chart)
    const mergedData = Object.fromEntries(
      Object.entries(chartDataUpdates).map(([key, newPoints]) => [
        key,
        [
          ...chartHistory[key as keyof typeof chartHistory],
          ...newPoints,
        ].slice(-60),
      ])
    );

    // Update store with all chart data in one transaction
    // This is the key batching improvement - single store update instead of 5 separate calls
    if (Object.keys(mergedData).length > 0) {
      setChartData(mergedData);
    }

    // Clear accumulated updates
    accumulatedUpdatesRef.current = {
      cpu: null,
      memory: null,
      requests: null,
      gpuUtil: null,
      power: null,
    };
  }, [chartHistory, setChartData, createDataPoint]);

  // Use useEffectEvent for flushUpdates to keep it stable
  // This allows processMetrics to call flushUpdates without recreating it
  const flushUpdatesStable = useEffectEvent(flushUpdates);

  // Accumulate metrics without updating store immediately
  // This avoids calling setState on every metrics change
  // Using useEffectEvent to make this function stable
  const processMetrics = useEffectEvent(() => {
    // Access latest metrics from store directly (not from closure)
    const currentMetrics = useStore.getState().metrics;
    if (!currentMetrics) return;

    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;

    // Only update if at least 5 seconds have passed (debounce)
    if (timeSinceLastUpdate < DEBOUNCE_MS) {
      return;
    }

    // Accumulate chart updates instead of calling setChartData immediately
    // This is batching accumulation phase - no setState calls here
    accumulatedUpdatesRef.current.cpu = currentMetrics.cpuUsage;
    accumulatedUpdatesRef.current.memory = currentMetrics.memoryUsage;
    accumulatedUpdatesRef.current.requests = currentMetrics.totalRequests;

    if (currentMetrics.gpuUsage !== undefined) {
      accumulatedUpdatesRef.current.gpuUtil = currentMetrics.gpuUsage;
    }

    if (currentMetrics.gpuPowerUsage !== undefined) {
      accumulatedUpdatesRef.current.power = currentMetrics.gpuPowerUsage;
    }

    // Schedule flush using requestIdleCallback for non-blocking updates
    // This defers setState call until browser is idle
    const handle = requestIdleCallback(
      () => {
        flushUpdatesStable();
      },
      { timeout: BATCH_FLUSH_MS }
    );
    flushIdleHandleRef.current = handle;

    // Update last update time
    lastUpdateRef.current = now;
  });

  // Process metrics whenever metrics data changes
  // processMetrics is stable via useEffectEvent, so only metrics is in deps
  useEffect(() => {
    processMetrics();
  }, [metrics, processMetrics]);

  // Cleanup idle callback on unmount
  useEffect(() => {
    return () => {
      // Cancel pending idle callback
      cancelIdleCallback(flushIdleHandleRef.current);
      flushIdleHandleRef.current = undefined;
    };
  }, []);

  return chartHistory;
}
