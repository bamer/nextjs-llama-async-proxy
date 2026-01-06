/**
 * Constants
 * File type mappings and configuration constants
 */

// File type to quantization map
export const fileTypeMap = {
  0: "F32",
  1: "F16",
  2: "Q4_0",
  3: "Q4_1",
  6: "Q5_0",
  7: "Q5_1",
  8: "Q8_0",
  9: "Q8_1",
  10: "Q2_K",
  11: "Q3_K_S",
  12: "Q3_K_M",
  13: "Q3_K_L",
  14: "Q4_K_S",
  15: "Q4_K_M",
  16: "Q5_K_S",
  17: "Q5_K_M",
  18: "Q6_K",
  19: "Q8_K",
};

// Router port configuration
export const DEFAULT_LLAMA_PORT = 8080;
export const MAX_PORT = 8090;
