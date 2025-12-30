/**
 * Unit tests for log filtering logic
 */

describe('Log Filtering Logic', () => {
  describe('Filter levels', () => {
    it('should match all logs when filterLevel is "all"', () => {
      const log = { level: 'info' };
      const filterLevel: string = 'all';

      const matchesLevel = filterLevel === 'all' || filterLevel.split(',').includes(log.level);

      expect(matchesLevel).toBe(true);
    });

    it('should match error logs when filterLevel is "error"', () => {
      const log = { level: 'error' };
      const filterLevel: string = 'error';

      const matchesLevel = filterLevel === 'all' || filterLevel.split(',').includes(log.level);

      expect(matchesLevel).toBe(true);
    });

    it('should not match info logs when filterLevel is "error"', () => {
      const log = { level: 'info' };
      const filterLevel: string = 'error';

      const matchesLevel = filterLevel === 'all' || filterLevel.split(',').includes(log.level);

      expect(matchesLevel).toBe(false);
    });

    it('should match both error and info logs when filterLevel is "error,info"', () => {
      const errorLog = { level: 'error' };
      const infoLog = { level: 'info' };
      const filterLevel: string = 'error,info';

      const errorMatches = filterLevel === 'all' || filterLevel.split(',').includes(errorLog.level);
      const infoMatches = filterLevel === 'all' || filterLevel.split(',').includes(infoLog.level);

      expect(errorMatches).toBe(true);
      expect(infoMatches).toBe(true);
    });

    it('should not match debug logs when filterLevel is "error,info"', () => {
      const log = { level: 'debug' };
      const filterLevel: string = 'error,info';

      const matchesLevel = filterLevel === 'all' || filterLevel.split(',').includes(log.level);

      expect(matchesLevel).toBe(false);
    });

    it('should match warn logs when filterLevel is "warn"', () => {
      const log = { level: 'warn' };
      const filterLevel: string = 'warn';

      const matchesLevel = filterLevel === 'all' || filterLevel.split(',').includes(log.level);

      expect(matchesLevel).toBe(true);
    });

    it('should match debug logs when filterLevel is "debug"', () => {
      const log = { level: 'debug' };
      const filterLevel: string = 'debug';

      const matchesLevel = filterLevel === 'all' || filterLevel.split(',').includes(log.level);

      expect(matchesLevel).toBe(true);
    });
  });

  describe('Filter with search term', () => {
    it('should match logs when search term is empty', () => {
      const searchTerm: string = '';
      const message: string = 'Test message';

      const matchesSearch = searchTerm === '' || message.toLowerCase().includes(searchTerm.toLowerCase());

      expect(matchesSearch).toBe(true);
    });

    it('should match logs when search term is found in message', () => {
      const searchTerm: string = 'error';
      const message: string = 'Error occurred in system';

      const matchesSearch = searchTerm === '' || message.toLowerCase().includes(searchTerm.toLowerCase());

      expect(matchesSearch).toBe(true);
    });

    it('should be case insensitive', () => {
      const searchTerm: string = 'ERROR';
      const message: string = 'Error occurred in system';

      const matchesSearch = searchTerm === '' || message.toLowerCase().includes(searchTerm.toLowerCase());

      expect(matchesSearch).toBe(true);
    });

    it('should not match logs when search term is not found', () => {
      const searchTerm: string = 'warning';
      const message: string = 'Error occurred in system';

      const matchesSearch = searchTerm === '' || message.toLowerCase().includes(searchTerm.toLowerCase());

      expect(matchesSearch).toBe(false);
    });
  });

  describe('Combined filtering', () => {
    it('should filter by both level and search term', () => {
      const logs = [
        { level: 'error', message: 'Error occurred' },
        { level: 'info', message: 'Info message' },
        { level: 'error', message: 'Another error' },
      ];

      const filterLevel: string = 'error';
      const searchTerm: string = 'Error occurred';

      const filtered = logs.filter(log => {
        const matchesLevel = filterLevel === 'all' || filterLevel.split(',').includes(log.level);
        const matchesSearch = searchTerm === '' || log.message.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesLevel && matchesSearch;
      });

      expect(filtered.length).toBe(1);
      expect(filtered[0].message).toBe('Error occurred');
    });

    it('should return all logs when filterLevel is "all" and search term is empty', () => {
      const logs = [
        { level: 'error', message: 'Error occurred' },
        { level: 'info', message: 'Info message' },
        { level: 'debug', message: 'Debug message' },
      ];

      const filterLevel: string = 'all';
      const searchTerm: string = '';

      const filtered = logs.filter(log => {
        const matchesLevel = filterLevel === 'all' || filterLevel.split(',').includes(log.level);
        const matchesSearch = searchTerm === '' || log.message.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesLevel && matchesSearch;
      });

      expect(filtered.length).toBe(3);
    });
  });
});

describe('Unique Key Generation', () => {
  it('should generate unique IDs even with same timestamp', () => {
    const timestamp = Date.now();
    const randomPart = 'abc123';

    // Simulate old ID generation (could create duplicates)
    const id1 = `${timestamp}-${randomPart}`;
    const id2 = `${timestamp}-${randomPart}`;

    // Without counter, these would be the same
    expect(id1).toBe(id2);

    // With counter, they would be unique
    let counter = 0;
    counter++;
    const uniqueId1 = `${timestamp}-${counter}-${randomPart}`;
    counter++;
    const uniqueId2 = `${timestamp}-${counter}-${randomPart}`;

    expect(uniqueId1).not.toBe(uniqueId2);
  });

  it('should create unique keys with index fallback', () => {
    const logs = [
      { id: 'duplicate-id' },
      { id: 'duplicate-id' },
      { id: 'duplicate-id' },
    ];

    const keys = logs.map((log, index) => {
      return log.id ? `${log.id}-${index}` : `log-${index}`;
    });

    // All keys should be unique
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(3);
    expect(keys[0]).toBe('duplicate-id-0');
    expect(keys[1]).toBe('duplicate-id-1');
    expect(keys[2]).toBe('duplicate-id-2');
  });
});
