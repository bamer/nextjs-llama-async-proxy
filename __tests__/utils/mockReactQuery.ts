import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export const createMockQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  });
};

export const MockQueryClientProvider: React.FC<{ client: QueryClient }> = ({ client, children }) => {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

export const mockQueryData = <T>(data: T, isLoading = false): {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
} => ({
  data,
  isLoading,
  isError: false,
  error: undefined,
});

export const mockQueryError = (error: Error): {
  data: undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error;
} => ({
  data: undefined,
  isLoading: false,
  isError: true,
  error,
});

export const mockMutationData = <T>(data: T, isLoading = false, isSuccess = false): {
  data: T | undefined;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: unknown;
} => ({
  data: isSuccess ? data : undefined,
  isLoading,
  isSuccess,
  isError: false,
  error: undefined,
});

export const waitForQueryToLoad = async (timeout = 1000): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, timeout));
};
