import { AUTHENTICATION_FORBIDDEN } from '@/lib/auth';

describe('auth', () => {
  describe('AUTHENTICATION_FORBIDDEN constant', () => {
    it('should export AUTHENTICATION_FORBIDDEN as true', () => {
      expect(AUTHENTICATION_FORBIDDEN).toBe(true);
    });

    it('should be a boolean value', () => {
      expect(typeof AUTHENTICATION_FORBIDDEN).toBe('boolean');
    });
  });
});
