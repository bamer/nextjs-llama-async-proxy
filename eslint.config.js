/**
 * ESLint Configuration for Vanilla JavaScript Llama Proxy Dashboard
 * Uses ESLint 9 flat config format
 */

export default [
  {
    files: ['**/*.js'],
    ignores: ['node_modules/', 'data/', 'coverage/', 'dist/', '__tests__/', '*.min.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        CustomEvent: 'readonly',
        HTMLElement: 'readonly',
        NodeList: 'readonly',
        DOMParser: 'readonly',
        URLSearchParams: 'readonly',
        Blob: 'readonly',
        confirm: 'readonly',
        alert: 'readonly',

        // Project globals
        Component: 'readonly',
        Router: 'readonly',
        StateManager: 'readonly',
        SocketClient: 'readonly',
        stateManager: 'readonly',
        socketClient: 'readonly',
        router: 'readonly',
        showNotification: 'readonly',
        AppUtils: 'readonly',
        FormatUtils: 'readonly',
        DomUtils: 'readonly',
        ValidationUtils: 'readonly',
        StorageUtils: 'readonly',

        // Page Controllers
        DashboardController: 'readonly',
        ModelsController: 'readonly',
        MonitoringController: 'readonly',
        ConfigurationController: 'readonly',
        SettingsController: 'readonly',
        LogsController: 'readonly',
        NotFoundController: 'readonly',

        // Layout Component
        Layout: 'readonly',

        // Dashboard Sub-components
        ServerStatusCard: 'readonly',
        MetricCard: 'readonly',
        ActiveModelsSummary: 'readonly',
        QuickActionsBar: 'readonly',
        ChartsSection: 'readonly',

        // Models Sub-components
        ModelTableRow: 'readonly',
        ModelDetailsPanel: 'readonly',

        // Node globals
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly'
      }
    },
    rules: {
      // Errors
      'no-unused-vars': 'warn',
      'no-undef': 'error',
      'no-console': 'off',
      'semi': ['error', 'always'],
      'quotes': ['error', 'double'],
      'eqeqeq': ['error', 'always'],
      'no-eval': 'error',
      'no-implied-eval': 'error',

      // Best practices
      'no-alert': 'warn',
      'no-debugger': 'warn',
      'no-dupe-args': 'error',
      'no-dupe-keys': 'error',
      'no-duplicate-case': 'error',
      'no-empty': 'warn',
      'no-eq-null': 'warn',
      'no-extra-semi': 'error',
      'no-func-assign': 'error',
      'no-invalid-regexp': 'error',
      'no-irregular-whitespace': 'error',
      'no-obj-calls': 'error',
      'no-prototype-builtins': 'warn',
      'no-regex-spaces': 'error',
      'no-sparse-arrays': 'warn',
      'no-unexpected-multiline': 'error',
      'no-unsafe-negation': 'error',

      // Style
      'array-bracket-spacing': ['error', 'never'],
      'object-curly-spacing': ['error', 'always'],
      'indent': ['error', 2],
      'max-len': ['warn', 100],
      'no-mixed-spaces-and-tabs': 'error',
      'no-trailing-spaces': 'warn',
      'prefer-const': 'warn',
      'prefer-template': 'warn'
    }
  }
];
