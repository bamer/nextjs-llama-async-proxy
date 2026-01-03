import React from "react";
import type { Config } from "./types";

export function handleInputChange(
  e: React.ChangeEvent<HTMLInputElement>,
  _config: Config,
  setConfig: React.Dispatch<React.SetStateAction<Config>>,
): void {
  const { name, value, type, checked } = e.target;
  setConfig((prev) => ({
    ...prev,
    [name]: type === "checkbox" ? checked : type === "number" ? parseInt(value) : value,
  }));
}
