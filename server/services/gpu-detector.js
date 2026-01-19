/**
 * GPU Detection Service - Real-time GPU metrics collection
 * Socket.IO-first, no database persistence
 *
 * DETECTION STRATEGY:
 * 1. NVIDIA: Uses nvidia-smi (discrete GPUs only)
 * 2. AMD dGPU: Uses rocm-smi only if ROCm is installed (discrete GPUs)
 * 3. AMD iGPU: Uses sysfs (/sys/class/drm/) - no metrics available
 * 4. Intel iGPU: Uses sysfs (/sys/class/drm/) - no metrics available
 *
 * IMPORTANT: Integrated GPUs (iGPU) don't have monitoring tools.
 * They are detected for display purposes but won't show metrics.
 */

import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";

const execAsync = promisify(exec);

// Track detection availability
let nvidiaSmiAvailable = false;
let rocmSmiAvailable = false;

/**
 * Detect all GPUs and collect real-time metrics
 * @returns {Promise<Array>} Array of GPU objects with full details
 */
export async function detectAndCollectGpus() {
  const gpus = [];

  console.log("[GPU-DETECTOR] Starting comprehensive GPU detection...");

  // Check tool availability first (run once)
  await checkToolAvailability();

  // Detect NVIDIA GPUs (discrete only)
  const nvidiaGpus = await detectNvidiaGpus();
  gpus.push(...nvidiaGpus);

  // Detect AMD GPUs (both discrete and integrated)
  const amdGpus = await detectAmdGpus();
  gpus.push(...amdGpus);

  // Detect Intel GPUs (integrated only)
  const intelGpus = await detectIntelGpus();
  gpus.push(...intelGpus);

  console.log(`[GPU-DETECTOR] Detection complete: ${gpus.length} total GPU(s) found`);
  console.log(`[GPU-DETECTOR] Summary: NVIDIA=${nvidiaGpus.length}, AMD=${amdGpus.length}, Intel=${intelGpus.length}`);

  return gpus;
}

/**
 * Check which GPU monitoring tools are available
 * This runs once to avoid repeated command execution
 */
async function checkToolAvailability() {
  // Check nvidia-smi
  try {
    await execAsync("which nvidia-smi || test -x /usr/bin/nvidia-smi", { timeout: 2000 });
    nvidiaSmiAvailable = true;
  } catch {
    nvidiaSmiAvailable = false;
  }

  // Check rocm-smi/amd-smi
  try {
    await execAsync("which rocm-smi || which amd-smi || test -x /opt/rocm/bin/rocm-smi", { timeout: 2000 });
    rocmSmiAvailable = true;
  } catch {
    rocmSmiAvailable = false;
  }

  console.debug("[GPU] Tool availability:", {
    nvidia: nvidiaSmiAvailable,
    rocm: rocmSmiAvailable
  });
}

/**
 * Detect NVIDIA GPUs using nvidia-smi with full metrics
 * @returns {Promise<Array>} Array of NVIDIA GPU objects
 */
async function detectNvidiaGpus() {
  const gpus = [];

  if (!nvidiaSmiAvailable) {
    console.debug("[GPU-DETECTOR] nvidia-smi not available, skipping NVIDIA detection");
    return gpus;
  }

  try {
    console.debug("[GPU-DETECTOR] Running nvidia-smi to detect NVIDIA GPUs...");

    // Get detailed GPU information including metrics
    const { stdout } = await execAsync(
      `/usr/bin/nvidia-smi --query-gpu=index,uuid,name,memory.total,driver_version,utilization.gpu,memory.used,memory.total,temperature.gpu,power.draw,fan.speed,clocks.gr,clocks.mem,utilization.encoder,utilization.decoder,pci.bus_id --format=csv,noheader,nounits 2>/dev/null`,
      { encoding: "utf8", timeout: 5000 }
    );

    const lines = stdout.trim().split("\n");
    console.debug(`[GPU-DETECTOR] nvidia-smi returned ${lines.length} GPU(s)`);

    for (const line of lines) {
      const parts = line.split(",").map(p => p.trim());
      if (parts.length < 10) continue;

      const index = parseInt(parts[0]) || 0;
      const vramTotalMiB = parseInt(parts[3]) || 0;
      const name = parts[2] || `NVIDIA GPU ${index}`;

      console.debug(`[GPU-DETECTOR] NVIDIA GPU ${index}: ${name}, ${vramTotalMiB}MiB VRAM`);

      gpus.push({
        deviceId: `nvidia-${index}`,
        name,
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
        isIntegrated: false,
      });
    }

    console.debug(`[GPU-DETECTOR] Found ${gpus.length} NVIDIA GPU(s)`);
  } catch (error) {
    console.error("[GPU-DETECTOR] nvidia-smi query failed:", error.message);
  }

  return gpus;
}

/**
 * Detect AMD GPUs (both discrete and integrated)
 * @returns {Promise<Array>} Array of AMD GPU objects
 */
async function detectAmdGpus() {
  const gpus = [];

  console.debug("[GPU-DETECTOR] Starting AMD GPU detection...");

  // First, detect AMD devices via sysfs (works for both iGPU and dGPU)
  const sysfsGpus = await detectAmdSysfs();
  gpus.push(...sysfsGpus);

  console.debug(`[GPU-DETECTOR] AMD sysfs detection found ${sysfsGpus.length} GPU(s)`);

  // For discrete GPUs (has dedicated VRAM), also try ROCm SMI if available
  // Integrated GPUs (no dedicated VRAM) do NOT use ROCm - skip ROCm detection for them
  if (rocmSmiAvailable && sysfsGpus.length > 0) {
    const discreteGpus = sysfsGpus.filter(g => !g.isIntegrated && g.vramTotalBytes > 0);
    console.debug(`[GPU-DETECTOR] Found ${discreteGpus.length} discrete AMD GPU(s) eligible for ROCm`);

    if (discreteGpus.length > 0) {
      const rocmGpus = await detectAmdRocm();
      console.debug(`[GPU-DETECTOR] ROCm detection found ${rocmGpus.length} GPU(s)`);

      // Merge ROCm data into discrete sysfs GPUs only
      for (const rocmGpu of rocmGpus) {
        // Match by bus location or card ID
        const match = discreteGpus.find(g =>
          (g.busLocation && rocmGpu.busLocation && g.busLocation === rocmGpu.busLocation) ||
          g.deviceId.replace("amd-sysfs-", "") === rocmGpu.deviceId.replace("amd-rocm-", "")
        );
        if (match) {
          console.debug(`[GPU-DETECTOR] Merged ROCm data into ${match.deviceId}`);
          // Update with ROCm metrics but KEEP sysfs deviceId
          match.name = rocmGpu.name;
          match.metrics = rocmGpu.metrics;
          match.driverVersion = rocmGpu.driverVersion;
          match.isRocmCapable = true; // Flag to indicate ROCm metrics available
          match.lastUpdated = Date.now();
        } else {
          console.debug(`[GPU-DETECTOR] ROCm GPU ${rocmGpu.deviceId} did not match any sysfs GPU`);
        }
      }
    }
  } else if (!rocmSmiAvailable && sysfsGpus.length > 0) {
    console.debug("[GPU-DETECTOR] ROCm not available, skipping ROCm metrics enhancement");
  }

  console.debug(`[GPU-DETECTOR] AMD detection complete: ${gpus.length} GPU(s)`);
  return gpus;
}

/**
 * Detect AMD GPUs using ROCm SMI (discrete GPUs only)
 * @returns {Promise<Array>} Array of AMD GPU objects with full metrics
 */
async function detectAmdRocm() {
  const gpus = [];

  if (!rocmSmiAvailable) {
    return gpus;
  }

  try {
    // Try rocm-smi first, then amd-smi
    let stdout;
    try {
      const result = await execAsync(
        "rocm-smi --showid --showmeminfo --showtemp --showpower --showuse --json 2>/dev/null",
        { encoding: "utf8", timeout: 5000 }
      );
      stdout = result.stdout;
    } catch {
      // Try amd-smi as fallback
      const result = await execAsync(
        "amd-smi metrics --json 2>/dev/null || amd-smi stat --json 2>/dev/null",
        { encoding: "utf8", timeout: 5000 }
      );
      stdout = result.stdout;
    }

    const data = JSON.parse(stdout);

    for (const [index, gpu] of Object.entries(data || {})) {
      if (!gpu["Card ID"] && !gpu["GPU ID"]) continue;

      const cardId = gpu["Card ID"] || gpu["GPU ID"];
      const vramTotalMiB = gpu["Memory"]?.["Total GC memory (MiB)"] || gpu["VRAM Total (MB)"] || 0;
      const vramUsedMiB = gpu["Memory"]?.["Used GC memory (MiB)"] || gpu["VRAM Used (MB)"] || 0;

      gpus.push({
        deviceId: `amd-rocm-${cardId}`,
        name: gpu.VBIOS || gpu["Card Name"] || `AMD GPU ${cardId}`,
        vendor: "AMD",
        vramTotalMiB,
        vramTotalBytes: vramTotalMiB * 1024 * 1024,
        driverVersion: gpu["Driver version"] || null,
        cudaVersion: null,
        busLocation: gpu["PCI Bus"] || null,
        metrics: {
          utilizationPercent: gpu["GPU use (%)"] || gpu["GPU Utilization (%)"] || 0,
          memoryUsedMiB,
          memoryUsedBytes: vramUsedMiB * 1024 * 1024,
          memoryTotalMiB,
          memoryTotalBytes: vramTotalMiB * 1024 * 1024,
          temperatureCelsius: gpu["Temperature (Sensor edge) (C)"] || gpu["Temperature (Sensor edge)"] || null,
          powerDrawWatts: gpu["Average Graphics Package Power (W)"] || gpu["Power (W)"] || null,
          fanSpeedPercent: gpu["Fan Speed (%)"] || null,
          clockSpeedMhz: null,
          memoryClockMhz: null,
          encoderUtilPercent: null,
          decoderUtilPercent: null,
          vramUsagePercent: vramTotalMiB > 0 ? (vramUsedMiB / vramTotalMiB) * 100 : 0,
        },
        status: "active",
        lastUpdated: Date.now(),
        isIntegrated: false,
      });
    }
  } catch (error) {
    // Silent - ROCm might not be installed for discrete GPUs either
  }

  return gpus;
}

/**
 * Detect AMD GPUs via sysfs (works for both iGPU and dGPU)
 * @returns {Promise<Array>} Array of AMD GPU objects from sysfs
 */
async function detectAmdSysfs() {
  const gpus = [];

  try {
    const drmPath = "/sys/class/drm";
    const entries = fs.readdirSync(drmPath);

    console.debug(`[GPU-DETECTOR] Scanning ${drmPath} for AMD GPUs...`);

    for (const entry of entries) {
      // Match card0, card1, etc. (but not card0-DP-1, card0-HDMI-A-1, etc.)
      if (!entry.startsWith("card") || entry.includes("-")) continue;

      const devicePath = path.join(drmPath, entry, "device");
      const vendorPath = path.join(devicePath, "vendor");

      try {
        const vendor = fs.readFileSync(vendorPath, "utf8").trim();
        if (vendor !== "0x1002") continue; // Not AMD

        console.debug(`[GPU-DETECTOR] Found AMD device: ${entry} (vendor: ${vendor})`);

        const namePath = path.join(devicePath, "name");
        let name = "AMD GPU";
        try {
          name = fs.readFileSync(namePath, "utf8").trim();
        } catch { /* use default */ }

        // Check if this is an integrated GPU
        // Method 1: Check PCI bus topology - integrated GPUs are behind southbridge bridges
        // Typical integrated GPU bridges: 00:01.0, 00:01.1, 00:08.0, 00:08.1 (AMD), 00:02.0 (Intel)
        // Discrete GPUs are behind PCIe root ports: 01:00.0+, 02:00.0+ (NVIDIA, AMD dGPU)
        // Method 2: For AMD APUs with shared memory (Raven Ridge, etc.), VRAM is actually system memory
        const devicePathReal = fs.realpathSync(devicePath);
        console.debug(`[GPU-DETECTOR] ${entry} real path: ${devicePathReal}`);

        // More flexible detection for integrated GPUs
        // Check for various southbridge patterns: 00:08, 00:01, 00:02, etc.
        const isBehindBridge = /\/0000:00:[0-9a-f]{2}\./.test(devicePathReal);
        const isBehindHighPCI = /\/0000:[1-9a-f][0-9a-f]:00\./.test(devicePathReal);
        
        // Simpler approach: if VRAM file exists but is small, it's integrated
        // Discrete GPUs have large VRAM, integrated use shared system memory
        const vramPath = path.join(devicePath, "mem_info_vram_total");
        let vramTotalBytes = 0;
        let hasVramFile = false;

        try {
          const vramContent = fs.readFileSync(vramPath, "utf8").trim();
          vramTotalBytes = parseInt(vramContent) || 0;
          hasVramFile = true;
          console.debug(`[GPU-DETECTOR] ${entry} VRAM file: ${vramTotalBytes} bytes`);
        } catch {
          console.debug(`[GPU-DETECTOR] ${entry} No VRAM file found`);
        }

        // Heuristic: If device is behind a low PCI slot (00:xx) and has small/no VRAM, it's integrated
        const isIntegrated = isBehindBridge && !isBehindHighPCI;

        console.debug(`[GPU-DETECTOR] ${entry} Detection: isBehindBridge=${isBehindBridge}, isBehindHighPCI=${isBehindHighPCI}, isIntegrated=${isIntegrated}`);

        // For integrated GPUs, try to get shared memory info
        let sharedMemoryTotal = 0;
        if (isIntegrated) {
          try {
            const memPath = path.join(devicePath, "mem_info_shared_total");
            sharedMemoryTotal = parseInt(fs.readFileSync(memPath, "utf8").trim()) || 0;
            console.debug(`[GPU-DETECTOR] ${entry} shared memory: ${sharedMemoryTotal} bytes`);
          } catch {
            console.debug(`[GPU-DETECTOR] ${entry} No shared memory file`);
          }
          // Use the VRAM total as shared memory for APUs if shared_total not available
          if (vramTotalBytes > 0 && sharedMemoryTotal === 0) {
            sharedMemoryTotal = vramTotalBytes;
            console.debug(`[GPU-DETECTOR] ${entry} Using VRAM as shared memory: ${sharedMemoryTotal} bytes`);
          }
        }

        const vramTotalMiB = Math.round(vramTotalBytes / (1024 * 1024));
        const finalVramBytes = isIntegrated ? sharedMemoryTotal : vramTotalBytes;
        const finalVramMiB = Math.round(finalVramBytes / (1024 * 1024));

        console.debug(`[GPU-DETECTOR] ${entry} Final: name="${name}", integrated=${isIntegrated}, vram=${finalVramMiB}MiB`);

        gpus.push({
          deviceId: `amd-sysfs-${entry}`,
          name: `${name}${isIntegrated ? " (Integrated)" : ""}`,
          vendor: "AMD",
          vramTotalMiB: finalVramMiB,
          vramTotalBytes: finalVramBytes,
          driverVersion: null,
          cudaVersion: null,
          busLocation: entry,
          metrics: {
            // No metrics available via sysfs for AMD GPUs initially
            utilizationPercent: 0,
            memoryUsedBytes: 0,
            memoryUsedMiB: 0,
            memoryTotalBytes: finalVramBytes,
            memoryTotalMiB: finalVramMiB,
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
          isIntegrated,
        });
      } catch (e) {
        console.debug(`[GPU-DETECTOR] Error processing ${entry}:`, e.message);
      }
    }

    console.debug(`[GPU-DETECTOR] Found ${gpus.length} AMD GPU(s) via sysfs`);
  } catch (error) {
    console.error(`[GPU-DETECTOR] sysfs scan error:`, error.message);
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
          name: `${name} (Integrated)`,
          vendor: "Intel",
          vramTotalMiB: 0,
          vramTotalBytes: 0,
          driverVersion: null,
          cudaVersion: null,
          busLocation: entry,
          metrics: {
            // No metrics available via sysfs for Intel GPUs
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
    // sysfs might not be accessible
  }

  return gpus;
}

/**
 * Get GPU detection status
 * @returns {Object} Status of each detection method
 */
export function getDetectionStatus() {
  return {
    nvidia: { available: nvidiaSmiAvailable, command: "nvidia-smi" },
    amd: { available: true, commands: ["rocm-smi", "sysfs"] }, // sysfs always available
    intel: { available: true, command: "sysfs" },
  };
}
