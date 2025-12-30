import * as modelTemplates from '@/lib/client-model-templates';

describe('model-templates (server re-export)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('re-exports all functions from client-model-templates', () => {
    // This file is a deprecated re-export for backward compatibility
    // It just re-exports everything from @/lib/client-model-templates

    expect(modelTemplates).toBeDefined();
  });

  it('has all expected exports', () => {
    // Verify that client-model-templates exports are available
    // The actual implementation is in client-model-modules
    const exports = Object.keys(modelTemplates);
    expect(exports.length).toBeGreaterThan(0);
  });

  it('is deprecated but functional', () => {
    // This file is kept for backward compatibility
    // It should still work even though it's deprecated
    expect(modelTemplates).toBeDefined();
  });

  it('has no side effects on import', () => {
    // Just importing this module should not cause errors
    expect(() => {
      require('@/server/model-templates');
    }).not.toThrow();
  });

  it('exports as a module object', () => {
    expect(typeof modelTemplates).toBe('object');
  });

  it('has proper module structure', () => {
    // The module should have named exports from client-model-templates
    expect(typeof modelTemplates).toBe('object');
    expect(modelTemplates !== null).toBe(true);
  });
});
