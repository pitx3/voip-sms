// tests/integration/example-unsafe.test.js

import { describe, it, expect } from 'vitest';

describe('UNSAFE TEST - Should only run with the test-unsafe command', () => {
  it('should only run with npm test-unsafe', () => {
    console.log('🚨 UNSAFE TEST RAN - This should only happen with test-unsafe command');
    expect(true).toBe(true);
  });
});