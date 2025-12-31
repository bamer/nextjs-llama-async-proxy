"use client";

import { useCallback, useEffect, useRef, useState, useEffectEvent as ReactUseEffectEvent } from "react";
import { useStore } from "@/lib/store";
import type { AppStore } from "@/lib/store/types";
import { requestIdleCallback, cancelIdleCallback } from "@/utils/request-idle-callback";
import {
  loadChartHistoryFromDatabase,
  flushAccumulatedUpdates,
  processMetricsForChart,
  type AccumulatedUpdates,
} from "@/utils/chart-history-utils";

const DEBOUNCE_MS = 5000; // 5 seconds minimum between updates
const BATCH_FLUSH_MS = 100; // 100ms to flush accumulated chart updates

export function useChartHistory() {
  const metrics = useStore((state: AppStore) => state.metrics);
  const chartHistory = useStore((state: AppStore) => state.chartHistory);
  const setChartData = useStore((state: AppStore) => state.setChartData);

  const [loadingHistory, setLoadingHistory] = useState(true);
  const lastUpdateRef = useRef<number>(0);

  // Accumulator for batching chart updates
  const accumulatedUpdatesRef = useRef<AccumulatedUpdates>({
    cpu: null,
    memory: null,
    requests: null,
    gpuUtil: null,
    power: null,
  });

  const flushIdleHandleRef = useRef<number | void>(undefined);

  const loadChartHistory = useCallback(async (): Promise<void> => {
    setLoadingHistory(true);
    await loadChartHistoryFromDatabase(setChartData);
    setLoadingHistory(false);
  }, [setChartData]);

  const flushUpdates = useCallback(() => {
    const updates = accumulatedUpdatesRef.current;
    flushAccumulatedUpdates(updates, chartHistory, setChartData);

    accumulatedUpdatesRef.current = {
      cpu: null,
      memory: null,
      requests: null,
      gpuUtil: null,
      power: null,
    };
  }, [chartHistory, setChartData]);

  const flushUpdatesStable = ReactUseEffectEvent(flushUpdates);

  const processMetrics = ReactUseEffectEvent(() => {
    const updates = processMetricsForChart(lastUpdateRef.current, DEBOUNCE_MS);
    if (!updates) return;

    accumulatedUpdatesRef.current = updates;

    const handle = requestIdleCallback(
      () => {
        flushUpdatesStable();
      },
      { timeout: BATCH_FLUSH_MS }
    );
    flushIdleHandleRef.current = handle;

    lastUpdateRef.current = Date.now();
  });

  // Load chart history on mount
  useEffect(() => {
    loadChartHistory();
  }, [loadChartHistory]);

  // Process metrics whenever metrics data changes
  useEffect(() => {
    processMetrics();
  }, [metrics, processMetrics]);

  // Cleanup idle callback on unmount
  useEffect(() => {
    return () => {
      if (flushIdleHandleRef.current !== undefined) {
        cancelIdleCallback(flushIdleHandleRef.current);
      }
      flushIdleHandleRef.current = undefined;
    };
  }, []);

  return chartHistory;
}
