/**
 * @jest-environment node
 */

/**
 * Tests for header-parser.js
 */

import { jest } from "@jest/globals";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("header-parser", () => {
  let parseGgufHeaderSync;

  beforeAll(async () => {
    const module =
      await import("/home/bamer/nextjs-llama-async-proxy/server/gguf/header-parser.js");
    parseGgufHeaderSync = module.parseGgufHeaderSync;
  });

  test("should parse valid GGUF header", () => {
    const testFile = path.join(__dirname, "test-header.gguf");
    const buffer = Buffer.alloc(24);
    const view = new DataView(buffer.buffer);
    view.setUint32(0, 0x46554747, true); // GGUF magic
    view.setUint32(4, 3, true);
    view.setBigUint64(8, 0n, true);
    view.setBigUint64(16, 0n, true);
    fs.writeFileSync(testFile, buffer);
    try {
      const result = parseGgufHeaderSync(testFile);
      expect(result).not.toBeNull();
    } finally {
      fs.unlinkSync(testFile);
    }
  });

  test("should return null for invalid magic", () => {
    const testFile = path.join(__dirname, "test-bad.gguf");
    const buffer = Buffer.alloc(24);
    const view = new DataView(buffer.buffer);
    view.setUint32(0, 0xdeadbeef, true);
    view.setUint32(4, 3, true);
    fs.writeFileSync(testFile, buffer);
    try {
      const result = parseGgufHeaderSync(testFile);
      expect(result).toBeNull();
    } finally {
      fs.unlinkSync(testFile);
    }
  });

  test("should return null for non-existent file", () => {
    const result = parseGgufHeaderSync("/non/existent.gguf");
    expect(result).toBeNull();
  });
});
