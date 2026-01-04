/**
 * Shared test utilities for app.config tests
 */

import { APP_CONFIG } from "@/config/app.config";

export function verifyAppConfigStructure() {
  expect(APP_CONFIG).toBeDefined();
  expect(typeof APP_CONFIG).toBe("object");
}

export function verifyNestedProperty(property: string, subProperties: string[]) {
  const config = APP_CONFIG as unknown as Record<string, unknown>;
  const nested = config[property] as Record<string, unknown>;

  expect(nested).toBeDefined();
  expect(typeof nested).toBe("object");

  subProperties.forEach((subProp) => {
    expect(nested).toHaveProperty(subProp);
  });
}

export function resetEnvironmentVariables() {
  delete process.env.NEXT_PUBLIC_API_URL;
  delete process.env.NEXT_PUBLIC_WS_URL;
  delete process.env.NEXT_PUBLIC_SENTRY_DSN;
}
