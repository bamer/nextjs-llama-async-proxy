import type {
  Nullable,
  Optional,
  AsyncReturnType,
} from '@/types/global';

describe('Global Utility Types', () => {
  describe('Nullable', () => {
    it('allows null value', () => {
      const value: Nullable<string> = null;

      expect(value).toBe(null);
    });

    it('allows non-null value', () => {
      const value: Nullable<string> = 'test';

      expect(value).toBe('test');
    });

    it('allows number with null', () => {
      const value: Nullable<number> = 42;

      expect(value).toBe(42);
    });

    it('allows object with null', () => {
      const value: Nullable<{ id: number }> = { id: 1 };

      expect(value).toEqual({ id: 1 });
    });

    it('allows null object', () => {
      const value: Nullable<{ id: number }> = null;

      expect(value).toBe(null);
    });

    it('allows undefined if explicitly typed', () => {
      const value: Nullable<string | undefined> = undefined;

      expect(value).toBe(undefined);
    });
  });

  describe('Optional', () => {
    it('allows undefined value', () => {
      const value: Optional<string> = undefined;

      expect(value).toBe(undefined);
    });

    it('allows defined value', () => {
      const value: Optional<string> = 'test';

      expect(value).toBe('test');
    });

    it('allows number with undefined', () => {
      const value: Optional<number> = 42;

      expect(value).toBe(42);
    });

    it('allows object with undefined', () => {
      const value: Optional<{ id: number }> = { id: 1 };

      expect(value).toEqual({ id: 1 });
    });

    it('allows undefined object', () => {
      const value: Optional<{ id: number }> = undefined;

      expect(value).toBe(undefined);
    });

    it('allows undefined but not null', () => {
      const value: Optional<string> = undefined;

      expect(value).toBeUndefined();
    });
  });

  describe('AsyncReturnType', () => {
    it('infers return type of async function', () => {
      async function asyncFunction(): Promise<string> {
        return 'test';
      }

      type Result = AsyncReturnType<typeof asyncFunction>;

      const result: Result = 'test';

      expect(typeof result).toBe('string');
    });

    it('infers return type of async function with object', () => {
      async function asyncFunction(): Promise<{ id: number; name: string }> {
        return { id: 1, name: 'test' };
      }

      type Result = AsyncReturnType<typeof asyncFunction>;

      const result: Result = { id: 1, name: 'test' };

      expect(result).toEqual({ id: 1, name: 'test' });
    });

    it('infers return type of async function with number', () => {
      async function asyncFunction(): Promise<number> {
        return 42;
      }

      type Result = AsyncReturnType<typeof asyncFunction>;

      const result: Result = 42;

      expect(result).toBe(42);
    });

    it('infers return type of async function with boolean', () => {
      async function asyncFunction(): Promise<boolean> {
        return true;
      }

      type Result = AsyncReturnType<typeof asyncFunction>;

      const result: Result = true;

      expect(result).toBe(true);
    });

    it('infers return type of async function with array', () => {
      async function asyncFunction(): Promise<number[]> {
        return [1, 2, 3];
      }

      type Result = AsyncReturnType<typeof asyncFunction>;

      const result: Result = [1, 2, 3];

      expect(result).toEqual([1, 2, 3]);
    });

    it('handles non-async function (returns never)', () => {
      function syncFunction(): string {
        return 'test';
      }

      type Result = AsyncReturnType<typeof syncFunction>;

      const neverCheck: Result = undefined as never;

      expect(neverCheck).toBe(undefined);
    });
  });
});
