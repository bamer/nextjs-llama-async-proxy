import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useDebouncedState } from '@/hooks/useDebouncedState';

describe('useDebouncedState', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return initial value', () => {
    const { result } = renderHook(() => useDebouncedState('initial'));
    
    expect(result.current[0]).toBe('initial');
    expect(result.current[2]).toBe('initial');
  });

  it('should provide setter function', () => {
    const { result } = renderHook(() => useDebouncedState('initial'));
    
    expect(typeof result.current[1]).toBe('function');
  });

  it('should debounce value updates', () => {
    const { result } = renderHook(() => useDebouncedState('initial', 100));
    
    // Call setDebounced multiple times quickly
    act(() => {
      result.current[1]('value1');
      result.current[1]('value2');
      result.current[1]('value3');
    });
    
    // Debounced value should not change yet
    expect(result.current[0]).toBe('value3');
    expect(result.current[2]).toBe('initial');
    
    // Advance timers
    act(() => {
      jest.advanceTimersByTime(100);
    });
    
    // Now debounced value should change
    expect(result.current[2]).toBe('value3');
  });

  it('should use default delay of 300ms', () => {
    const { result } = renderHook(() => useDebouncedState('initial'));
    
    act(() => {
      result.current[1]('updated');
    });
    
    expect(result.current[0]).toBe('updated');
    expect(result.current[2]).toBe('initial');
    
    // Advance timers to default delay
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    expect(result.current[2]).toBe('updated');
  });

  it('should clear previous timeout on new value', () => {
    const { result } = renderHook(() => useDebouncedState('initial', 100));
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    
    act(() => {
      result.current[1]('value1');
      result.current[1]('value2');
    });
    
    // clearTimeout should have been called
    expect(clearTimeoutSpy).toHaveBeenCalled();
    
    clearTimeoutSpy.mockRestore();
  });

  it('should cleanup timeout on unmount', () => {
    const { unmount } = renderHook(() => useDebouncedState('initial', 100));
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    
    unmount();
    
    // clearTimeout should have been called for cleanup
    expect(clearTimeoutSpy).toHaveBeenCalled();
    
    clearTimeoutSpy.mockRestore();
  });

  it('should work with different types', () => {
    // Test with number
    const numberHook = renderHook(() => useDebouncedState(0, 100));
    act(() => {
      numberHook.result.current[1](42);
    });
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(numberHook.result.current[2]).toBe(42);
    numberHook.unmount();
    
    // Test with object
    const objHook = renderHook(() => useDebouncedState({ count: 0 }, 100));
    act(() => {
      objHook.result.current[1]({ count: 1 });
    });
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(objHook.result.current[2]).toEqual({ count: 1 });
    objHook.unmount();
    
    // Test with array
    const arrHook = renderHook(() => useDebouncedState<number[]>([], 100));
    act(() => {
      arrHook.result.current[1]([1, 2, 3]);
    });
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(arrHook.result.current[2]).toEqual([1, 2, 3]);
    arrHook.unmount();
  });
});
