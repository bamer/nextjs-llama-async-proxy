// Mock for better-sqlite3 native module
const mockDb = {
  prepare: jest.fn(),
  exec: jest.fn(),
  pragma: jest.fn(),
  close: jest.fn(),
};

module.exports = mockDb;
module.exports.default = mockDb;
