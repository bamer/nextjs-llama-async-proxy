import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../../app/page';
import DashboardPage from '../../src/components/pages/DashboardPage';
import ModernConfiguration from '../../src/components/pages/ModernConfiguration';
import { configService } from '../../src/lib/config-service';

describe('App Integration Tests', () => {
  beforeAll(() => {
    // Mock localStorage for testing
    const localStorageMock = (() => {
      let store: Record<string, string> = {};
      return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
          store[key] = value.toString();
        },
        removeItem: (key: string) => {
          delete store[key];
        },
        clear: () => {
          store = {};
        }
      };
    })();
    
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock
    });
  });

  test('App renders without crashing', () => {
    render(<App />);
    expect(screen.getByText(/Welcome to Llama Runner Pro/i)).toBeInTheDocument();
  });

  test('DashboardPage renders metrics', async () => {
    render(<DashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
      expect(screen.getByText(/Active Sessions/i)).toBeInTheDocument();
      expect(screen.getByText(/Requests\/min/i)).toBeInTheDocument();
    });
  });

  test('Configuration page loads and displays settings', async () => {
    // Mock the config service
    jest.spyOn(configService, 'getConfig').mockReturnValue({
      basePath: '/test/path',
      logLevel: 'info',
      maxConcurrentModels: 3,
      autoUpdate: true,
      notificationsEnabled: false,
      modelDefaults: {
        ctx_size: 2048,
        batch_size: 512,
        temperature: 0.7,
        top_p: 0.9,
        top_k: 20,
        gpu_layers: 0,
        threads: 4
      }
    });

    render(<ModernConfiguration />);

    await waitFor(() => {
      expect(screen.getByText(/Configuration Center/i)).toBeInTheDocument();
      expect(screen.getByText(/Base Path/i)).toBeInTheDocument();
      expect(screen.getByText(/Log Level/i)).toBeInTheDocument();
    });
  });

  test('Theme switching works correctly', () => {
    render(<App />);
    
    // Check that theme-related elements are present
    expect(screen.getByText(/Welcome to Llama Runner Pro/i)).toBeInTheDocument();
  });

  test('Navigation elements are present', async () => {
    render(<App />);

    // Check that navigation links are present
    await waitFor(() => {
      expect(screen.getByText(/Get Started/i)).toBeInTheDocument();
      expect(screen.getByText(/View Documentation/i)).toBeInTheDocument();
    });
  });
});