import { renderHook, act } from '@testing-library/react';
import { useEffectEvent } from '@/hooks/use-effect-event';

describe('useEffectEvent', () => {
  it('should return a function that delegates to the handler', () => {
    const mockHandler = jest.fn((a: number, b: string) => a + b.length);

    const { result } = renderHook(() => useEffectEvent(mockHandler));

    expect(typeof result.current).toBe('function');

    // Call the returned function
    const resultValue = result.current(5, 'hello');
    expect(resultValue).toBe(10); // 5 + 5
    expect(mockHandler).toHaveBeenCalledWith(5, 'hello');
  });

  it('should maintain stable function reference across renders', () => {
    const mockHandler = jest.fn();

    const { result, rerender } = renderHook(() => useEffectEvent(mockHandler));

    const firstRef = result.current;

    rerender();
    rerender();
    rerender();

    const secondRef = result.current;

    expect(firstRef).toBe(secondRef);
  });

  it('should always call the latest handler version', () => {
    let version = 'version1';

    const { result, rerender } = renderHook(
      ({ handler }) => useEffectEvent(handler),
      {
        initialProps: { handler: () => version }
      }
    );

    // Call with first handler
    expect(result.current()).toBe('version1');

    // Change the version
    version = 'version2';
    rerender({ handler: () => version });

    // Call again - should use new handler
    expect(result.current()).toBe('version2');
  });

  it('should handle different function signatures', () => {
    // No parameters
    const { result: result1 } = renderHook(() => useEffectEvent(() => 42));
    expect(result1.current()).toBe(42);

    // Multiple parameters
    const { result: result2 } = renderHook(() =>
      useEffectEvent((a: number, b: number, c: number) => a + b + c)
    );
    expect(result2.current(1, 2, 3)).toBe(6);

    // Async function
    const asyncHandler = async (value: string) => `processed_${value}`;
    const { result: result3 } = renderHook(() => useEffectEvent(asyncHandler));

    act(async () => {
      const result = await result3.current('test');
      expect(result).toBe('processed_test');
    });
  });

  it('should handle functions that throw errors', () => {
    const errorHandler = () => {
      throw new Error('Test error');
    };

    const { result } = renderHook(() => useEffectEvent(errorHandler));

    expect(() => {
      result.current();
    }).toThrow('Test error');
  });

  it('should handle functions that return undefined', () => {
    const undefinedHandler = () => undefined;

    const { result } = renderHook(() => useEffectEvent(undefinedHandler));

    expect(result.current()).toBeUndefined();
  });

  it('should handle functions that return null', () => {
    const nullHandler = () => null;

    const { result } = renderHook(() => useEffectEvent(nullHandler));

    expect(result.current()).toBeNull();
  });

  it('should handle complex return types', () => {
    const complexHandler = () => ({
      data: [1, 2, 3],
      metadata: { source: 'test' },
      timestamp: Date.now(),
    });

    const { result } = renderHook(() => useEffectEvent(complexHandler));

    const returnValue = result.current();
    expect(returnValue).toHaveProperty('data');
    expect(returnValue).toHaveProperty('metadata');
    expect(returnValue).toHaveProperty('timestamp');
    expect(Array.isArray(returnValue.data)).toBe(true);
  });

  it('should work with arrow functions', () => {
    const arrowHandler = (x: number) => x * 2;

    const { result } = renderHook(() => useEffectEvent(arrowHandler));

    expect(result.current(5)).toBe(10);
  });

  it('should work with function declarations', () => {
    function declaredHandler(value: string) {
      return value.toUpperCase();
    }

    const { result } = renderHook(() => useEffectEvent(declaredHandler));

    expect(result.current('hello')).toBe('HELLO');
  });

  it('should work with bound functions', () => {
    const context = { multiplier: 3 };
    const boundHandler = function(this: typeof context, x: number) {
      return x * this.multiplier;
    }.bind(context);

    const { result } = renderHook(() => useEffectEvent(boundHandler));

    expect(result.current(4)).toBe(12);
  });

  it('should handle handler changes during render', () => {
    let callCount = 0;

    const { result, rerender } = renderHook(() => {
      callCount++;
      return useEffectEvent(() => callCount);
    });

    // First render
    expect(result.current()).toBe(1);

    // Second render - handler should be updated
    rerender();
    expect(result.current()).toBe(2);

    // Third render
    rerender();
    expect(result.current()).toBe(3);
  });

  it('should handle empty function', () => {
    const emptyHandler = () => {};

    const { result } = renderHook(() => useEffectEvent(emptyHandler));

    expect(result.current()).toBeUndefined();
  });

  it('should preserve this context for methods', () => {
    const obj = {
      value: 42,
      handler() {
        return this.value;
      }
    };

    const { result } = renderHook(() => useEffectEvent(obj.handler.bind(obj)));

    expect(result.current()).toBe(42);
  });

  it('should handle recursive functions', () => {
    const recursiveHandler = function factorial(n: number): number {
      if (n <= 1) return 1;
      return n * factorial(n - 1);
    };

    const { result } = renderHook(() => useEffectEvent(recursiveHandler));

    expect(result.current(5)).toBe(120); // 5! = 120
  });

  it('should handle functions with rest parameters', () => {
    const restHandler = (...args: number[]) => args.reduce((sum, n) => sum + n, 0);

    const { result } = renderHook(() => useEffectEvent(restHandler));

    expect(result.current(1, 2, 3, 4)).toBe(10);
  });

  it('should handle functions with default parameters', () => {
    const defaultHandler = (a: number = 10, b: number = 20) => a + b;

    const { result } = renderHook(() => useEffectEvent(defaultHandler));

    expect(result.current()).toBe(30);
    expect(result.current(5)).toBe(25);
    expect(result.current(5, 8)).toBe(13);
  });

  it('should work with generic functions', () => {
    function genericHandler<T>(value: T): T {
      return value;
    }

    const { result } = renderHook(() => useEffectEvent(genericHandler));

    expect(result.current('string')).toBe('string');
    expect(result.current(42)).toBe(42);
    expect(result.current({ key: 'value' })).toEqual({ key: 'value' });
  });

  it('should handle function identity preservation', () => {
    const originalHandler = jest.fn();

    const { result } = renderHook(() => useEffectEvent(originalHandler));

    // The returned function should call the original
    result.current('arg1', 'arg2');

    expect(originalHandler).toHaveBeenCalledWith('arg1', 'arg2');
    expect(originalHandler).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple instances independently', () => {
    const handler1 = jest.fn(() => 'handler1');
    const handler2 = jest.fn(() => 'handler2');

    const { result: result1 } = renderHook(() => useEffectEvent(handler1));
    const { result: result2 } = renderHook(() => useEffectEvent(handler2));

    result1.current();
    result2.current();

    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
    expect(result1.current()).toBe('handler1');
    expect(result2.current()).toBe('handler2');
  });

  it('should handle handler that returns a promise', async () => {
    const promiseHandler = async (delay: number) => {
      await new Promise(resolve => setTimeout(resolve, delay));
      return 'done';
    };

    const { result } = renderHook(() => useEffectEvent(promiseHandler));

    const promise = result.current(10);

    expect(promise).toBeInstanceOf(Promise);

    await act(async () => {
      const result = await promise;
      expect(result).toBe('done');
    });
  });

  it('should handle extremely large argument lists', () => {
    const largeArgsHandler = (...args: number[]) => Math.max(...args);

    const { result } = renderHook(() => useEffectEvent(largeArgsHandler));

    const args = Array.from({ length: 1000 }, (_, i) => i);
    expect(result.current(...args)).toBe(999);
  });

  it('should work correctly with React strict mode', () => {
    // This test simulates what happens in React's strict mode
    // where effects might run multiple times
    let renderCount = 0;
    const handler = () => ++renderCount;

    const { result, rerender } = renderHook(() => useEffectEvent(handler));

    // Simulate strict mode behavior
    rerender();
    rerender();

    expect(result.current()).toBe(4); // Each rerender updates the handler
  });
});