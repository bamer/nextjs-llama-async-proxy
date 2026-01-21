    jest.doMock('better-sqlite3', () => {
      const jest = require('@jest/globals').jest; // Import jest specifically for this mock
      function MockBetterSQLite3(dbPath) {
        this.dbPath = dbPath;
        this.prepare = jest.fn(() => ({ run: jest.fn(), get: jest.fn(), all: jest.fn() }));
        this.exec = jest.fn();
        this.close = jest.fn();
        this.backup = jest.fn();
        this.pragma = jest.fn();
        this.on = jest.fn();
      }
      MockBetterSQLite3.prototype.backup = jest.fn(); // Ensure prototype method exists
      MockBetterSQLite3.prototype.constructor = MockBetterSQLite3;
      return { default: MockBetterSQLite3 }; // Export as default
    });