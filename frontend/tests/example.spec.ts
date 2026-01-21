import { test, expect } from '@playwright/test';

test.describe('Quick Smoke Tests', () => {
  test('basic math works', () => {
    expect(1 + 1).toBe(2);
  });

  test('string comparison works', () => {
    expect('hello').toBe('hello');
  });

  test('array operations work', () => {
    const arr = [1, 2, 3];
    expect(arr.length).toBe(3);
    expect(arr).toContain(2);
  });
});
