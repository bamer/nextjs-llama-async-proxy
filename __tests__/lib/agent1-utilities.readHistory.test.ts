import { readHistory } from '@/lib/monitor';
import { mockedFs, createMockHistory } from './agent1-utilities.test-utils';

describe('Monitor - readHistory', () => {
  const mockHistoryPath = require('path').join(process.cwd(), 'data', 'monitoring-history.json');

  beforeEach(() => {
    jest.clearAllMocks();
    mockedFs.existsSync.mockReturnValue(false);
  });

  it('should return empty array if file does not exist', () => {
    mockedFs.existsSync.mockReturnValue(false);

    const result = readHistory();

    expect(result).toEqual([]);
    expect(mockedFs.existsSync).toHaveBeenCalledWith(mockHistoryPath);
  });

  it('should parse valid JSON from file', () => {
    const mockData = createMockHistory();

    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue(JSON.stringify(mockData));

    const result = readHistory();

    expect(result).toEqual(mockData);
    expect(result).toHaveLength(2);
  });

  it('should return empty array on JSON parse error', () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue('not valid json {{{');

    const result = readHistory();

    expect(result).toEqual([]);
  });

  it('should return empty array on file read error', () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockImplementation(() => {
      throw new Error('Read error');
    });

    const result = readHistory();

    expect(result).toEqual([]);
  });

  it('should read as utf8', () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue('[]');

    readHistory();

    expect(mockedFs.readFileSync).toHaveBeenCalledWith(mockHistoryPath, 'utf8');
  });
});
