import { renderHook, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useApi } from '@/hooks/use-api';

jest.mock('@/services/api-service', () => ({
  ApiService: {
    getModels: jest.fn(() => Promise.resolve([])),
    getMetrics: jest.fn(() => Promise.resolve({ cpuUsage: 50 })),
  },
}));

jest.mock('@/lib/store', () => ({
  useStore: jest.fn((selector) => selector({ models: [], metrics: { cpuUsage: 50 } })),
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn((queryKey, queryFn) => ({
    data: [],
    isLoading: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
  })),
  useMutation: jest.fn((mutationFn) => ({
    mutate: jest.fn(),
    mutateAsync: jest.fn(),
    isLoading: false,
    isError: false,
  })),
  QueryClient: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('useApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with empty state', () => {
    const { result } = renderHook(() => useApi());
    expect(result.current).toBeDefined();
  });

  it('provides getModels function', () => {
    const { result } = renderHook(() => useApi());
    expect(typeof result.current.getModels).toBe('function');
  });

  it('provides getMetrics function', () => {
    const { result } = renderHook(() => useApi());
    expect(typeof result.current.getMetrics).toBe('function');
  });
});
