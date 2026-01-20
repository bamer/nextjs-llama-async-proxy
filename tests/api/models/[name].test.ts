import { POST, GET } from '@/app/api/models/[name]/start/route';

describe('POST /api/models/[name]/start', () => {
  const modelName = 'test-model';

  beforeEach(() => {
    jest.clearAllMocks();
    const mockedFs = require('fs');
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue(JSON.stringify({}));
    mockedFs.writeFileSync.mockImplementation(() => {});
  });

  it('starts a model when it is idle', async () => {
    const request = { nextUrl: { pathname: `/api/models/${modelName}/start` } } as any;
    const postResponse = await POST(request);
    const postJson = await postResponse.json();
    expect(postResponse.status).toBe(200);
    expect(postJson.success).toBe(true);
    expect(postJson.modelName).toBe(modelName);
    expect(postJson.message).toBe('Model started successfully');
  });

  it('returns 400 when model name is missing', async () => {
    const request = { nextUrl: { pathname: '/api/models//start' } } as any;
    const postResponse = await POST(request);
    const postJson = await postResponse.json();
    expect(postResponse.status).toBe(400);
    expect(postJson.error).toBe('Model name is required');
  });

  it('prevents starting a model that is already in progress', async () => {
    const mockedFs = require('fs');
    mockedFs.readFileSync.mockReturnValue(JSON.stringify({ [modelName]: 'starting' }));
    const request = { nextUrl: { pathname: `/api/models/${modelName}/start` } } as any;
    const postResponse = await POST(request);
    const postJson = await postResponse.json();
    expect(postResponse.status).toBe(409);
    expect(postJson.error).toBe('Model is already in progress or started');
  });

  it('handles unexpected errors gracefully', async () => {
    const mockedFs = require('fs');
    mockedFs.readFileSync.mockImplementation(() => {
      throw new Error('Simulated disk error');
    });
    const request = { nextUrl: { pathname: `/api/models/${modelName}/start` } } as any;
    const postResponse = await POST(request);
    const postJson = await postResponse.json();
    expect(postResponse.status).toBe(500);
    expect(postJson.error).toBe('Internal server error');
  });
});

describe('GET /api/models/[name]/start', () => {
  const modelName = 'test-model';

  beforeEach(() => {
    jest.clearAllMocks();
    const mockedFs = require('fs');
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue(JSON.stringify({ [modelName]: 'started' }));
  });

  it('returns the current status of a model', async () => {
    const request = { nextUrl: { pathname: `/api/models/${modelName}/start` } } as any;
    const getResponse = await GET(request);
    const getJson = await getResponse.json();
    expect(getResponse.status).toBe(200);
    expect(getJson.modelName).toBe(modelName);
    expect(getJson.status).toBe('started');
  });

  it('returns 400 when model name is missing', async () => {
    const request = { nextUrl: { pathname: '/api/models//start' } } as any;
    const getResponse = await GET(request);
    const getJson = await getResponse.json();
    expect(getResponse.status).toBe(400);
    expect(getJson.error).toBe('Model name is required');
  });

  it('returns "idle" when no state is recorded for a model', async () => {
    const mockedFs = require('fs');
    mockedFs.readFileSync.mockReturnValue(JSON.stringify({}));
    const request = { nextUrl: { pathname: `/api/models/${modelName}/start` } } as any;
    const getResponse = await GET(request);
    const getJson = await getResponse.json();
    expect(getResponse.status).toBe(200);
    expect(getJson.status).toBe('idle');
  });
});