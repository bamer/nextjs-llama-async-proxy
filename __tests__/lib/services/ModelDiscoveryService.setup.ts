import * as path from "path";

jest.mock("fs");
jest.mock("path");

// Mock logger
const mockLogger = {
  warn: jest.fn(),
  error: jest.fn(),
};

jest.mock("@/lib/logger", () => ({
  getLogger: () => mockLogger,
}));

// Mock fs.promises
const fsPromises = require("fs").promises;
const mockedFsPromises = {
  readdir: jest.fn(),
  stat: jest.fn(),
  readFile: jest.fn(),
} as {
    readdir: jest.Mock;
    stat: jest.Mock;
    readFile: jest.Mock;
  };

const originalFs = require("fs");
originalFs.promises = mockedFsPromises;

const mockedPath = path as jest.Mocked<typeof path>;

export interface TestSetup {
  mockLogger: typeof mockLogger;
  mockedFsPromises: {
    readdir: jest.Mock;
    stat: jest.Mock;
    readFile: jest.Mock;
  };
  mockedPath: jest.Mocked<typeof path>;
}

export const setupModelDiscoveryService = (): TestSetup => {
  jest.clearAllMocks();
  jest.resetAllMocks();

  mockedPath.resolve.mockImplementation((p: string) => p);
  mockedPath.join.mockImplementation((...args: string[]) => args.join("/"));
  mockedPath.basename.mockImplementation((p: string, ext?: string) => {
    if (ext) return p.replace(ext, "");
    return p.split("/").pop() || p;
  });
  mockedPath.extname.mockImplementation((p: string) => {
    const match = p.match(/\.[^.]+$/);
    return match ? match[0] : "";
  });
  mockedPath.format.mockImplementation(
    (p: unknown) => `${(p as { dir?: string }).dir || ""}/${(p as { name: string }).name}${(p as { ext?: string }).ext || ""}`
  );
  mockedPath.dirname.mockImplementation((p: string) =>
    p.split("/").slice(0, -1).join("/")
  );

  return {
    mockLogger,
    mockedFsPromises,
    mockedPath,
  };
};

export { mockedFsPromises, mockedPath };
