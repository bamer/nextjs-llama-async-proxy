import {
  configSchema,
  parameterSchema,
  websocketSchema,
} from '@/lib/validators';
import { expectValidationError } from './validators.utils';
import {
  describeConfigSchemaScenarios,
  describeParameterSchemaScenarios,
  describeWebsocketSchemaScenarios,
  describeTypeExportsScenarios,
  describeParseVsSafeParseScenarios,
} from './validators.scenarios';

describe('validators', () => {
  describe('configSchema', () => {
    describeConfigSchemaScenarios(configSchema, expectValidationError);
  });

  describe('parameterSchema', () => {
    describeParameterSchemaScenarios(parameterSchema, expectValidationError);
  });

  describe('websocketSchema', () => {
    describeWebsocketSchemaScenarios(websocketSchema, expectValidationError);
  });

  describe('type exports', () => {
    describeTypeExportsScenarios();
  });

  describe('parse vs safeParse', () => {
    describeParseVsSafeParseScenarios(configSchema);
  });
});
