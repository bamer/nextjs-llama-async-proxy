"use client";

import { useCallback, useEffect, useRef, useState, useEffectEvent as ReactUseEffectEvent } from "react";
import { useStore } from "@/lib/store";
import { requestIdleCallback, cancelIdleCallback } from "@/utils/request-idle-callback";

const DEBOUNCE_MS = 5000; // 5 seconds minimum between updates
const BATCH_FLUSH_MS = 100; // 100ms to flush accumulated chart updates

export function useChartHistory() {
  const metrics = useStore((state) => state.metrics);
  const chartHistory = useStore((state) => state.chartHistory);
  const setChartData = useStore((state) => state.setChartData);
  const rebuildChartHistory = useStore((state) => state.rebuildChartHistory);

  // Track loading state for history initialization
  const [loadingHistory, setLoadingHistory] = useState(true);

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

  /**
   * Load chart history from database API
   * This ensures charts have data on cold launch/refresh
   */
  const loadChartHistory = useCallback(async (): Promise<void> => {
    try {
      setLoadingHistory(true);
      const response = await fetch('/api/monitoring/history');

      if (!response.ok) {
        console.error('[useChartHistory] Failed to load chart history:', response.status);
        setLoadingHistory(false);
        return;
      }

      const result = await response.json();

      if (result.success && result.data) {
        const data = result.data;

        // Validate we have chart data arrays
        if (data.cpu && data.cpu.length > 0) {
          setChartData(data);
          console.log('[useChartHistory] Loaded chart history from database:', {
            cpu: data.cpu.length,
            memory: data.memory.length,
            requests: data.requests.length,
          });
        } else {
          // No history in database, initialize empty
          setChartData({
            cpu: [],
            memory: [],
            requests: [],
            gpuUtil: [],
            power: [],
          });
        }
      } else {
        // Initialize empty if no data
        setChartData({
          cpu: [],
          memory: [],
          requests: [],
          gpuUtil: [],
          power: [],
        });
      }
    } catch (error) {
      console.error('[useChartHistory] Error loading chart history:', error);
      // Initialize empty on error
      setChartData({
        cpu: [],
        memory: [],
        requests: [],
        gpuUtil: [],
        power: [],
      });
    } finally {
      setLoadingHistory(false);
    }
  }, [setChartData]);

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

    // Create complete ChartHistoryData with all 5 chart types
    // Always provide complete data structure to setChartData action
    const completeChartData = {
      cpu: updates.cpu !== null
        ? [...chartHistory.cpu, createDataPoint(updates.cpu)].slice(-60)
        : chartHistory.cpu,
      memory: updates.memory !== null
        ? [...chartHistory.memory, createDataPoint(updates.memory)].slice(-60)
        : chartHistory.memory,
      requests: updates.requests !== null
        ? [...chartHistory.requests, createDataPoint(updates.requests)].slice(-60)
        : chartHistory.requests,
      gpuUtil: updates.gpuUtil !== null
        ? [...chartHistory.gpuUtil, createDataPoint(updates.gpuUtil)].slice(-60)
        : chartHistory.gpuUtil,
      power: updates.power !== null
        ? [...chartHistory.power, createDataPoint(updates.power)].slice(-60)
        : chartHistory.power,
    };

    // Update store with all chart data in one transaction
    // This is key batching improvement - single store update instead of 5 separate calls
    setChartData(completeChartData);

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
  const flushUpdatesStable = ReactUseEffectEvent(flushUpdates);

  // Accumulate metrics without updating store immediately
  // This avoids calling setState on every metrics change
  // Using useEffectEvent to make this function stable
  const processMetrics = ReactUseEffectEvent(() => {
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

  // Load chart history on mount - ensures data available on cold launch/refresh
  useEffect(() => {
    // Load persisted history from database first
    loadChartHistory();
  }, [loadChartHistory]);

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
