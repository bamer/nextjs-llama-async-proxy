import {
  loadModelTemplates,
  getModelTemplatesSync,
  __resetCache__,
} from '@/lib/client-model-templates';
import {
  setupMocks,
  cleanupMocks,
} from './client-model-templates.utils';
import {
  describeLoadModelTemplatesScenarios,
  describeSaveTemplatesFileScenarios,
  describeSaveModelTemplateScenarios,
  describeGetModelTemplateScenarios,
  describeGetModelTemplatesScenarios,
  describeGetModelTemplatesSyncScenarios,
  describeResetCacheScenarios,
} from './client-model-templates.scenarios';

describe('client-model-templates', () => {
  beforeEach(() => {
    setupMocks();
  });

  afterEach(() => {
    cleanupMocks();
  });

  describe('loadModelTemplates', () => {
    describeLoadModelTemplatesScenarios();
  });

  describe('saveTemplatesFile', () => {
    describeSaveTemplatesFileScenarios();
  });

  describe('saveModelTemplate', () => {
    describeSaveModelTemplateScenarios();
  });

  describe('getModelTemplate', () => {
    describeGetModelTemplateScenarios();
  });

  describe('getModelTemplates', () => {
    describeGetModelTemplatesScenarios();
  });

  describe('getModelTemplatesSync', () => {
    describeGetModelTemplatesSyncScenarios();
  });

  describe('__resetCache__', () => {
    describeResetCacheScenarios();
  });
});
