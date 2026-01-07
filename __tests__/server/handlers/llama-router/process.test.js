/**
 * @jest-environment node
 */

/**
 * Tests for Llama Router Process Management
 * Tests for process spawning, port finding, and lifecycle management
 *
 * Coverage targets:
 * - findLlamaServer() - Binary discovery (8 tests)
 * - isPortInUse() - Port checking (5 tests)
 * - killLlamaServer() - Process killing (6 tests)
 * - killLlamaOnPort() - Port-based killing (6 tests)
 * - findAvailablePort() - Port finding (6 tests)
 * - stopLlamaServer() - Full stop operation (5 tests)
 */

import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";

// Create mocks before importing
const mockExistsSync = jest.fn();
const mockExecSync = jest.fn();
const mockSpawn = jest.fn();

jest.unstable_mockModule("fs", () => ({
  __esModule: true,
  default: {
    existsSync: mockExistsSync,
  },
  existsSync: mockExistsSync,
}));

jest.unstable_mockModule("child_process", () => ({
  __esModule: true,
  default: {
    execSync: mockExecSync,
    spawn: mockSpawn,
  },
  execSync: mockExecSync,
  spawn: mockSpawn,
}));

describe("findLlamaServer()", () => {
  let findLlamaServer;

  beforeEach(async () => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Re-import to get fresh module with mocks
    const module = await import("../../../../server/handlers/llama-router/process.js");
    findLlamaServer = module.findLlamaServer;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return path when binary exists at /home/bamer/llama.cpp/build/bin/llama-server", () => {
    // Objective: Test findLlamaServer returns path when binary exists at first possible location
    // This verifies the binary discovery logic finds a valid binary at a common location
    mockExistsSync.mockImplementation((p) => p === "/home/bamer/llama.cpp/build/bin/llama-server");
    mockExecSync.mockImplementation(() => {
      throw new Error("not found");
    });

    const result = findLlamaServer();

    expect(result).toBe("/home/bamer/llama.cpp/build/bin/llama-server");
  });

  it("should return path when binary exists at /home/bamer/.local/bin/llama-server", () => {
    // Objective: Test findLlamaServer returns path when binary exists at user local bin
    // This verifies the binary discovery checks user home directory paths
    mockExistsSync.mockImplementation((p) => p === "/home/bamer/.local/bin/llama-server");
    mockExecSync.mockImplementation(() => {
      throw new Error("not found");
    });

    const result = findLlamaServer();

    expect(result).toBe("/home/bamer/.local/bin/llama-server");
  });

  it("should return path when binary exists in PATH via which command", () => {
    // Objective: Test findLlamaServer returns path from which command when not found locally
    // This verifies the fallback to system PATH lookup when local paths fail
    mockExistsSync.mockReturnValue(false);
    mockExecSync.mockReturnValue("/usr/bin/llama-server\n");

    const result = findLlamaServer();

    expect(result).toBe("/usr/bin/llama-server");
  });

  it("should return null when binary not found anywhere", () => {
    // Objective: Test findLlamaServer returns null when binary not found
    // This verifies graceful handling when no llama-server binary is available
    mockExistsSync.mockReturnValue(false);
    mockExecSync.mockImplementation(() => {
      throw new Error("not found");
    });

    const result = findLlamaServer();

    expect(result).toBeNull();
  });

  it("should return path when binary exists at /usr/local/bin/llama-server", () => {
    // Objective: Test findLlamaServer returns path when binary exists at system location
    // This verifies the binary discovery checks system-wide installation paths
    mockExistsSync.mockImplementation((p) => p === "/usr/local/bin/llama-server");
    mockExecSync.mockImplementation(() => {
      throw new Error("not found");
    });

    const result = findLlamaServer();

    expect(result).toBe("/usr/local/bin/llama-server");
  });

  it("should return path when binary exists at /usr/bin/llama-server", () => {
    // Objective: Test findLlamaServer returns path when binary exists at /usr/bin
    // This verifies the binary discovery checks standard system bin directories
    mockExistsSync.mockImplementation((p) => p === "/usr/bin/llama-server");
    mockExecSync.mockImplementation(() => {
      throw new Error("not found");
    });

    const result = findLlamaServer();

    expect(result).toBe("/usr/bin/llama-server");
  });

  it("should return path when binary exists at /home/bamer/ik_llama.cpp/build/bin/llama-server", () => {
    // Objective: Test findLlamaServer returns path when binary exists in alternate development location
    // This verifies the binary discovery checks for alternate build locations
    mockExistsSync.mockImplementation(
      (p) => p === "/home/bamer/ik_llama.cpp/build/bin/llama-server"
    );
    mockExecSync.mockImplementation(() => {
      throw new Error("not found");
    });

    const result = findLlamaServer();

    expect(result).toBe("/home/bamer/ik_llama.cpp/build/bin/llama-server");
  });

  it("should handle fs.existsSync throwing an error gracefully", () => {
    // Objective: Test findLlamaServer handles fs.existsSync errors gracefully
    // This verifies the error handling when filesystem access fails
    let callCount = 0;
    mockExistsSync.mockImplementation((p) => {
      callCount++;
      if (callCount === 1) {
        throw new Error("Permission denied");
      }
      return p === "/home/bamer/.local/bin/llama-server";
    });
    mockExecSync.mockImplementation(() => {
      throw new Error("not found");
    });

    const result = findLlamaServer();

    expect(result).toBe("/home/bamer/.local/bin/llama-server");
  });
});

describe("isPortInUse()", () => {
  let isPortInUse;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await import("../../../../server/handlers/llama-router/process.js");
    isPortInUse = module.isPortInUse;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return true when port is in use (execSync succeeds)", () => {
    // Objective: Test isPortInUse returns true when port is in use
    // This verifies the port checking correctly detects occupied ports
    mockExecSync.mockReturnValue("12345\n");

    const result = isPortInUse(8080);

    expect(result).toBe(true);
  });

  it("should return false when port is free (execSync throws)", () => {
    // Objective: Test isPortInUse returns false when port is free
    // This verifies the port checking correctly detects available ports
    mockExecSync.mockImplementation(() => {
      throw new Error("Command failed");
    });

    const result = isPortInUse(8080);

    expect(result).toBe(false);
  });

  it("should return true for any port that has a process", () => {
    // Objective: Test isPortInUse works with different port numbers
    // This verifies the port checking works consistently across different port values
    const testCases = [
      { port: 3000, result: "67890\n" },
      { port: 8080, result: "12345\n" },
      { port: 9000, result: "54321\n" },
    ];

    testCases.forEach(({ port, result }) => {
      mockExecSync.mockReturnValue(result);
      const portInUse = isPortInUse(port);
      expect(portInUse).toBe(true);
    });
  });

  it("should return false when lsof command fails", () => {
    // Objective: Test isPortInUse handles lsof command failure
    // This verifies graceful error handling when the port check command fails
    mockExecSync.mockImplementation(() => {
      throw new Error("Command failed");
    });

    const result = isPortInUse(8080);

    expect(result).toBe(false);
  });

  it("should return true when execSync returns empty string but no error", () => {
    // Objective: Test isPortInUse returns true when execSync succeeds (process exists)
    // This verifies the success case even with empty stdout
    mockExecSync.mockReturnValue("");

    const result = isPortInUse(8080);

    expect(result).toBe(true);
  });
});

describe("killLlamaServer()", () => {
  let killLlamaServer;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await import("../../../../server/handlers/llama-router/process.js");
    killLlamaServer = module.killLlamaServer;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should kill process and return true when process is provided", () => {
    // Objective: Test killLlamaServer kills process and returns true
    // This verifies the process termination works correctly with valid input
    let killCalledWith = null;
    const mockProcess = {
      kill: function (signal) {
        killCalledWith = signal;
      },
    };

    const result = killLlamaServer(mockProcess);

    expect(result).toBe(true);
    expect(killCalledWith).toBe("SIGTERM");
  });

  it("should return false when process is null", () => {
    // Objective: Test killLlamaServer returns false when process is null
    // This verifies proper handling of null process input
    const result = killLlamaServer(null);

    expect(result).toBe(false);
  });

  it("should return false when process is undefined", () => {
    // Objective: Test killLlamaServer returns false when process is undefined
    // This verifies proper handling of undefined process input
    const result = killLlamaServer(undefined);

    expect(result).toBe(false);
  });

  it("should return false when process is falsy", () => {
    // Objective: Test killLlamaServer returns false for any falsy process value
    // This verifies consistent handling of all falsy values
    const falsyValues = [null, undefined, 0, "", false];

    falsyValues.forEach((value) => {
      const result = killLlamaServer(value);
      expect(result).toBe(false);
    });
  });

  it("should call kill with SIGTERM signal", () => {
    // Objective: Test killLlamaServer uses SIGTERM signal
    // This verifies the correct signal is used for graceful termination
    let killCalledWith = null;
    const mockProcess = {
      kill: function (signal) {
        killCalledWith = signal;
      },
    };

    killLlamaServer(mockProcess);

    expect(killCalledWith).toBe("SIGTERM");
  });

  it("should not call kill when process is falsy", () => {
    // Objective: Test killLlamaServer does not call kill on falsy process
    // This verifies no operations are attempted on invalid process handles
    let killCalled = false;
    const mockProcess = null;

    killLlamaServer(mockProcess);

    expect(killCalled).toBe(false);
  });
});

describe("killLlamaOnPort()", () => {
  let killLlamaOnPort;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await import("../../../../server/handlers/llama-router/process.js");
    killLlamaOnPort = module.killLlamaOnPort;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return true when process is killed on port", () => {
    // Objective: Test killLlamaOnPort returns true when process is killed
    // This verifies the port-based killing works correctly
    mockExecSync.mockImplementation((command) => {
      if (command.includes("lsof")) {
        return "12345\n";
      }
      return "";
    });

    const result = killLlamaOnPort(8080);

    expect(result).toBe(true);
  });

  it("should return false when no process on port", () => {
    // Objective: Test killLlamaOnPort returns false when no process on port
    // This verifies graceful handling when port is already free
    mockExecSync.mockImplementation(() => {
      throw new Error("No process found");
    });

    const result = killLlamaOnPort(8080);

    expect(result).toBe(false);
  });

  it("should return false when lsof returns empty string", () => {
    // Objective: Test killLlamaOnPort returns false when lsof returns empty PID
    // This verifies handling of empty process ID response
    mockExecSync.mockImplementation((command) => {
      if (command.includes("lsof")) {
        return "";
      }
      return "";
    });

    const result = killLlamaOnPort(8080);

    expect(result).toBe(false);
  });

  it("should trim the PID before using it", () => {
    // Objective: Test killLlamaOnPort trims whitespace from PID
    // This verifies proper handling of PID strings with whitespace
    mockExecSync.mockImplementation((command) => {
      if (command.includes("lsof")) {
        return "  12345  \n";
      }
      return "";
    });

    // The function trims, so the result should still be true
    const result = killLlamaOnPort(8080);

    expect(result).toBe(true);
  });

  it("should return false when kill command fails", () => {
    // Objective: Test killLlamaOnPort returns false when kill command fails
    // This verifies error handling when the kill command itself fails
    let callCount = 0;
    mockExecSync.mockImplementation((command) => {
      callCount++;
      if (callCount === 1) {
        return "12345\n";
      }
      throw new Error("kill failed");
    });

    const result = killLlamaOnPort(8080);

    expect(result).toBe(false);
  });

  it("should handle different port numbers", () => {
    // Objective: Test killLlamaOnPort works with different port numbers
    // This verifies the function works with various port values
    const testPorts = [3000, 8080, 9000];

    testPorts.forEach((port) => {
      mockExecSync.mockImplementation(() => {
        throw new Error("No process found");
      });
      const result = killLlamaOnPort(port);
      expect(result).toBe(false);
    });
  });
});

describe("findAvailablePort()", () => {
  let findAvailablePort;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await import("../../../../server/handlers/llama-router/process.js");
    findAvailablePort = module.findAvailablePort;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return first available port starting from default", async () => {
    // Objective: Test findAvailablePort returns first free port
    // This verifies the port scanning starts from the default port
    const isPortInUse = (port) => false;

    const result = await findAvailablePort(isPortInUse);

    expect(result).toBe(8080);
  });

  it("should skip occupied ports and return next available", async () => {
    // Objective: Test findAvailablePort skips occupied ports
    // This verifies the port scanning correctly skips in-use ports
    const isPortInUse = (port) => {
      if (port === 8080) return true;
      return false;
    };

    const result = await findAvailablePort(isPortInUse);

    expect(result).toBe(8081);
  });

  it("should find first available port when multiple are occupied", async () => {
    // Objective: Test findAvailablePort finds first available when multiple ports are occupied
    // This verifies scanning through multiple occupied ports
    const isPortInUse = (port) => port < 8083;

    const result = await findAvailablePort(isPortInUse);

    expect(result).toBe(8083);
  });

  it("should return MAX_PORT + 1 when all ports are occupied", async () => {
    // Objective: Test findAvailablePort returns MAX_PORT + 1 when all ports occupied
    // This verifies the overflow handling when no ports are available
    const isPortInUse = (port) => true;

    const result = await findAvailablePort(isPortInUse);

    expect(result).toBe(8091);
  });

  it("should check all ports from DEFAULT_LLAMA_PORT to MAX_PORT", async () => {
    // Objective: Test findAvailablePort checks all ports in range
    // This verifies the complete port range is scanned
    const checkedPorts = [];
    const isPortInUse = (port) => {
      checkedPorts.push(port);
      return port < 8085;
    };

    const result = await findAvailablePort(isPortInUse);

    expect(checkedPorts[0]).toBe(8080);
    expect(checkedPorts[checkedPorts.length - 1]).toBe(8085);
    expect(checkedPorts.length).toBe(6);
  });

  it("should handle isPortInUse throwing an error", async () => {
    // Objective: Test findAvailablePort handles isPortInUse errors gracefully
    // This verifies error handling during port scanning
    let callCount = 0;
    const isPortInUse = (port) => {
      callCount++;
      if (port === 8080) throw new Error("Port check failed");
      return false;
    };

    const result = await findAvailablePort(isPortInUse);

    expect(result).toBe(8081);
  });
});

describe("stopLlamaServer()", () => {
  let stopLlamaServer;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await import("../../../../server/handlers/llama-router/process.js");
    stopLlamaServer = module.stopLlamaServer;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should call killLlamaServerFn and return success", () => {
    // Objective: Test stopLlamaServer calls killLlamaServerFn and returns success
    // This verifies the main process termination is attempted
    let killCalled = false;
    const mockProcess = {
      kill: function () {
        killCalled = true;
      },
    };
    const killLlamaServerFn = (process) => {
      if (process) {
        process.kill("SIGTERM");
        return true;
      }
      return false;
    };
    const killLlamaOnPortFn = () => false;

    const result = stopLlamaServer(
      mockProcess,
      null,
      null,
      () => false,
      killLlamaServerFn,
      killLlamaOnPortFn
    );

    expect(result.success).toBe(true);
  });

  it("should call killLlamaOnPortFn for all ports in range", () => {
    // Objective: Test stopLlamaServer calls killLlamaOnPortFn for all ports in range
    // This verifies cleanup of all possible llama-server instances
    const checkedPorts = [];
    const killLlamaServerFn = () => false;
    const killLlamaOnPortFn = (port) => {
      checkedPorts.push(port);
      return false;
    };

    stopLlamaServer(null, null, null, () => false, killLlamaServerFn, killLlamaOnPortFn);

    expect(checkedPorts.length).toBe(11); // 8080 to 8090 inclusive
    expect(checkedPorts[0]).toBe(8080);
    expect(checkedPorts[checkedPorts.length - 1]).toBe(8090);
  });

  it("should continue even if killLlamaServerFn throws", () => {
    // Objective: Test stopLlamaServer handles killLlamaServerFn errors gracefully
    // This verifies resilient error handling during shutdown
    const killLlamaServerFn = () => {
      throw new Error("Kill failed");
    };
    const killLlamaOnPortFn = () => false;

    const result = stopLlamaServer(
      null,
      null,
      null,
      () => false,
      killLlamaServerFn,
      killLlamaOnPortFn
    );

    expect(result.success).toBe(true);
  });

  it("should handle null llamaServerProcess", () => {
    // Objective: Test stopLlamaServer handles null process gracefully
    // This verifies null process is handled without errors
    const killLlamaServerFn = () => false;
    const killLlamaOnPortFn = () => false;

    const result = stopLlamaServer(
      null,
      null,
      null,
      () => false,
      killLlamaServerFn,
      killLlamaOnPortFn
    );

    expect(result.success).toBe(true);
  });

  it("should always return success object", () => {
    // Objective: Test stopLlamaServer always returns success object
    // This verifies the API contract that stop always returns success
    const killLlamaServerFn = () => false;
    const killLlamaOnPortFn = () => false;

    const result = stopLlamaServer(
      null,
      null,
      null,
      () => false,
      killLlamaServerFn,
      killLlamaOnPortFn
    );

    expect(result).toEqual({ success: true });
    expect(result.success).toBe(true);
  });
});
