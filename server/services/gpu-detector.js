/**
 * GPU Detection Service - Real-time GPU metrics collection
 * Socket.IO-first, no database persistence
 */

import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";

const execAsync = promisify(exec);

/**
 * Detect all GPUs and collect real-time metrics
 * @returns {Promise<Array>} Array of GPU objects with full details
 */
export async function detectAndCollectGpus() {
  const gpus = [];

  // Detect NVIDIA GPUs (primary method)
  const nvidiaGpus = await detectNvidiaGpus();
  gpus.push(...nvidiaGpus);

  // Detect AMD GPUs (ROCm or sysfs)
  const amdGpus = await detectAmdGpus();
  gpus.push(...amdGpus);

  // Detect Intel GPUs (sysfs)
  const intelGpus = await detectIntelGpus();
  gpus.push(...intelGpus);

  return gpus;
}

/**
 * Detect NVIDIA GPUs using nvidia-smi with full metrics
 * @returns {Promise<Array>} Array of NVIDIA GPU objects
 */
async function detectNvidiaGpus() {
  const gpus = [];

  try {
    // Get detailed GPU information including metrics
    // Note: cuda_version field may not be available on all systems
    const { stdout } = await execAsync(
      `/usr/bin/nvidia-smi --query-gpu=index,uuid,name,memory.total,driver_version,utilization.gpu,memory.used,memory.total,temperature.gpu,power.draw,fan.speed,clocks.gr,clocks.mem,utilization.encoder,utilization.decoder,pci.bus_id --format=csv,noheader,nounits 2>/dev/null`,
      { encoding: "utf8", timeout: 5000 }
    );

    const lines = stdout.trim().split("\n");

    for (const line of lines) {
      const parts = line.split(",").map(p => p.trim());
      if (parts.length < 10) continue;

      const index = parseInt(parts[0]) || 0;
      const vramTotalMiB = parseInt(parts[3]) || 0;

      gpus.push({
        deviceId: `nvidia-${index}`,
        name: parts[2] || `NVIDIA GPU ${index}`,
        vendor: "NVIDIA",
        vramTotalMiB,
        vramTotalBytes: vramTotalMiB * 1024 * 1024,
        driverVersion: parts[4] || null,
        cudaVersion: null,
        busLocation: parts[15] || null,
        metrics: {
          utilizationPercent: parseFloat(parts[5]) || 0,
          memoryUsedMiB: parseInt(parts[6]) || 0,
          memoryUsedBytes: (parseInt(parts[6]) || 0) * 1024 * 1024,
          memoryTotalMiB: parseInt(parts[7]) || vramTotalMiB,
          memoryTotalBytes: (parseInt(parts[7]) || vramTotalMiB) * 1024 * 1024,
          temperatureCelsius: parseFloat(parts[8]) || null,
          powerDrawWatts: parseFloat(parts[9]) || null,
          fanSpeedPercent: parseFloat(parts[10]) || null,
          clockSpeedMhz: parseFloat(parts[11]) || null,
          memoryClockMhz: parseFloat(parts[12]) || null,
          encoderUtilPercent: parseFloat(parts[13]) || null,
          decoderUtilPercent: parseFloat(parts[14]) || null,
          vramUsagePercent: vramTotalMiB > 0
            ? ((parseInt(parts[6]) || 0) / vramTotalMiB) * 100
            : 0,
        },
        status: "active",
        lastUpdated: Date.now(),
      });
    }
  } catch (error) {
    console.debug("[GPU] NVIDIA detection failed:", error.message);
  }

  return gpus;
}

/**
 * Detect AMD GPUs using rocm-smi or sysfs
 * @returns {Promise<Array>} Array of AMD GPU objects
 */
async function detectAmdGpus() {
  const gpus = [];

  // Try ROCm SMI first (for ROCm-enabled AMD GPUs)
  try {
    const { stdout } = await execAsync(
      "rocm-smi --showid --showmeminfo --showtemp --showpower --showuse --json 2>/dev/null",
      { encoding: "utf8", timeout: 5000 }
    );

    const data = JSON.parse(stdout);

    for (const [index, gpu] of Object.entries(data || {})) {
      if (!gpu["Card ID"]) continue;

      const vramTotalMiB = gpu["Memory"]["Total GC memory (MiB)"] || 0;
      const vramUsedMiB = gpu["Memory"]["Used GC memory (MiB)"] || 0;

      gpus.push({
        deviceId: `amd-rocm-${gpu["Card ID"]}`,
        name: gpu.VBIOS || `AMD GPU ${index}`,
        vendor: "AMD",
        vramTotalMiB,
        vramTotalBytes: vramTotalMiB * 1024 * 1024,
        driverVersion: gpu["Driver version"] || null,
        cudaVersion: null,
        busLocation: gpu["PCI Bus"] || null,
        metrics: {
          utilizationPercent: gpu["GPU use (%)"] || 0,
          memoryUsedMiB,
          memoryUsedBytes: vramUsedMiB * 1024 * 1024,
          memoryTotalMiB,
          memoryTotalBytes: vramTotalMiB * 1024 * 1024,
          temperatureCelsius: gpu["Temperature (Sensor edge) (C)"] || null,
          powerDrawWatts: gpu["Average Graphics Package Power (W)"] || null,
          fanSpeedPercent: gpu["Fan Speed (%)"] || null,
          clockSpeedMhz: null,
          memoryClockMhz: null,
          encoderUtilPercent: null,
          decoderUtilPercent: null,
          vramUsagePercent: vramTotalMiB > 0 ? (vramUsedMiB / vramTotalMiB) * 100 : 0,
        },
        status: "active",
        lastUpdated: Date.now(),
      });
    }
  } catch (error) {
    console.debug("[GPU] ROCm detection failed:", error.message);
  }

  // Fallback to sysfs for non-ROCm AMD GPUs
  if (gpus.length === 0) {
    const sysfsGpus = await detectAmdSysfs();
    gpus.push(...sysfsGpus);
  }

  return gpus;
}

/**
 * Detect AMD GPUs via sysfs (fallback)
 * @returns {Promise<Array>} Array of AMD GPU objects from sysfs
 */
async function detectAmdSysfs() {
  const gpus = [];

  try {
    const drmPath = "/sys/class/drm";
    const entries = fs.readdirSync(drmPath);

    for (const entry of entries) {
      if (!entry.startsWith("card") || entry.includes("-")) continue;

      const devicePath = path.join(drmPath, entry, "device");
      const vendorPath = path.join(devicePath, "vendor");

      try {
        const vendor = fs.readFileSync(vendorPath, "utf8").trim();
        if (vendor !== "0x1002") continue; // Not AMD

        const namePath = path.join(devicePath, "name");
        let name = "AMD GPU";
        try {
          name = fs.readFileSync(namePath, "utf8").trim();
        } catch { /* use default */ }

        // Get VRAM info
        let vramTotalBytes = 0;
        const vramPaths = [
          path.join(devicePath, "mem_info_vram_total"),
          path.join(devicePath, "memory_total"),
        ];

        for (const vramPath of vramPaths) {
          try {
            vramTotalBytes = parseInt(fs.readFileSync(vramPath, "utf8").trim()) || 0;
            break;
          } catch { /* continue */ }
        }

        const vramTotalMiB = Math.round(vramTotalBytes / (1024 * 1024));

        gpus.push({
          deviceId: `amd-sysfs-${entry}`,
          name,
          vendor: "AMD",
          vramTotalMiB,
          vramTotalBytes,
          driverVersion: null,
          cudaVersion: null,
          busLocation: entry,
          metrics: {
            utilizationPercent: 0, // Not available via sysfs
            memoryUsedBytes: 0,
            memoryUsedMiB: 0,
            memoryTotalBytes,
            memoryTotalMiB: vramTotalMiB,
            temperatureCelsius: null,
            powerDrawWatts: null,
            fanSpeedPercent: null,
            clockSpeedMhz: null,
            memoryClockMhz: null,
            encoderUtilPercent: null,
            decoderUtilPercent: null,
            vramUsagePercent: 0,
          },
          status: "active",
          lastUpdated: Date.now(),
        });
      } catch {
        // Not an AMD GPU or missing info
      }
    }
  } catch (error) {
    console.debug("[GPU] AMD sysfs detection failed:", error.message);
  }

  return gpus;
}

/**
 * Detect Intel GPUs via sysfs
 * @returns {Promise<Array>} Array of Intel GPU objects
 */
async function detectIntelGpus() {
  const gpus = [];

  try {
    const drmPath = "/sys/class/drm";
    const entries = fs.readdirSync(drmPath);

    for (const entry of entries) {
      if (!entry.startsWith("card") || entry.includes("-")) continue;

      const devicePath = path.join(drmPath, entry, "device");
      const vendorPath = path.join(devicePath, "vendor");

      try {
        const vendor = fs.readFileSync(vendorPath, "utf8").trim();
        if (vendor !== "0x8086") continue; // Not Intel

        const namePath = path.join(devicePath, "name");
        let name = "Intel GPU";
        try {
          name = fs.readFileSync(namePath, "utf8").trim();
        } catch { /* use default */ }

        gpus.push({
          deviceId: `intel-${entry}`,
          name,
          vendor: "Intel",
          vramTotalMiB: 0,
          vramTotalBytes: 0,
          driverVersion: null,
          cudaVersion: null,
          busLocation: entry,
          metrics: {
            utilizationPercent: 0,
            memoryUsedBytes: 0,
            memoryUsedMiB: 0,
            memoryTotalBytes: 0,
            memoryTotalMiB: 0,
            temperatureCelsius: null,
            powerDrawWatts: null,
            fanSpeedPercent: null,
            clockSpeedMhz: null,
            memoryClockMhz: null,
            encoderUtilPercent: null,
            decoderUtilPercent: null,
            vramUsagePercent: 0,
          },
          status: "active",
          lastUpdated: Date.now(),
          isIntegrated: true,
        });
      } catch {
        // Not an Intel GPU or missing info
      }
    }
  } catch (error) {
    console.debug("[GPU] Intel detection failed:", error.message);
  }

  return gpus;
}

/**
 * Get GPU detection status
 * @returns {Object} Status of each detection method
 */
export function getDetectionStatus() {
  return {
    nvidia: { available: false, command: "nvidia-smi" },
    amd: { available: false, commands: ["rocm-smi", "sysfs"] },
    intel: { available: false, command: "sysfs" },
  };
}
