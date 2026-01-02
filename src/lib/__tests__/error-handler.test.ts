import {
  describeAppErrorScenarios,
  describeValidationErrorScenarios,
  describeNotFoundErrorScenarios,
  describeNetworkErrorScenarios,
  describeServerErrorScenarios,
  describeHandleErrorScenarios,
  describeIsAppErrorScenarios,
  describeLogErrorScenarios,
} from './error-handler.scenarios';

describe('error-handler', () => {
  describe('AppError', () => {
    describeAppErrorScenarios();
  });

  describe('ValidationError', () => {
    describeValidationErrorScenarios();
  });

  describe('NotFoundError', () => {
    describeNotFoundErrorScenarios();
  });

  describe('NetworkError', () => {
    describeNetworkErrorScenarios();
  });

  describe('ServerError', () => {
    describeServerErrorScenarios();
  });

  describe('handleError', () => {
    describeHandleErrorScenarios();
  });

  describe('isAppError', () => {
    describeIsAppErrorScenarios();
  });

  describe('logError', () => {
    describeLogErrorScenarios();
  });
});
