import { describe, it, expect } from 'vitest';
import { debounce } from '../debounce';

describe('debounce', () => {
  it('should debounce function calls', async () => {
    let callCount = 0;
    const fn = () => callCount++;
    const debouncedFn = debounce(fn, 100);

    // Call multiple times rapidly
    debouncedFn();
    debouncedFn();
    debouncedFn();

    // Should not have called yet
    expect(callCount).toBe(0);

    // Wait for debounce delay
    await new Promise(resolve => setTimeout(resolve, 150));

    // Should have called once
    expect(callCount).toBe(1);
  });

  it('should pass arguments to debounced function', async () => {
    let receivedArg: string | undefined;
    const fn = (arg: string) => {
      receivedArg = arg;
    };
    const debouncedFn = debounce(fn, 50);

    debouncedFn('test');

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(receivedArg).toBe('test');
  });
});
