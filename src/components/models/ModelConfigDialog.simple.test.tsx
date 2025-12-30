import React from 'react';
import { render, screen } from '@testing-library/react';
import { ModelConfigDialog } from './ModelConfigDialog';

// Mock the tooltip config
jest.mock('@/config/tooltip-config', () => ({
  PARAM_DESCRIPTIONS: {
    temperature: 'Test temperature description',
    top_p: 'Test top_p description',
    ctx_size: 'Test context size description',
  },
}));

describe('ModelConfigDialog Import Test', () => {
  it('can import ModelConfigDialog', () => {
    expect(ModelConfigDialog).toBeDefined();
    expect(typeof ModelConfigDialog).toBe('function');
  });
});