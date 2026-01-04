/**
 * Shared test utilities for monitoring.config tests
 */

import { MONITORING_CONFIG } from "@/config/monitoring.config";

export function verifyMonitoringStructure() {
  expect(MONITORING_CONFIG).toBeDefined();
  expect(typeof MONITORING_CONFIG).toBe("object");
}

export function verifyBooleanProperty(path: string): boolean {
  const keys = path.split(".");
  let value: unknown = MONITORING_CONFIG;

  for (const key of keys) {
    value = (value as Record<string, unknown>)[key];
  }

  return typeof value === "boolean";
}

export function verifyNumberProperty(path: string): boolean {
  const keys = path.split(".");
  let value: unknown = MONITORING_CONFIG;

  for (const key of keys) {
    value = (value as Record<string, unknown>)[key];
  }

  return typeof value === "number";
}

export function verifyStringProperty(path: string): boolean {
  const keys = path.split(".");
  let value: unknown = MONITORING_CONFIG;

  for (const key of keys) {
    value = (value as Record<string, unknown>)[key];
  }

  return typeof value === "string";
}
