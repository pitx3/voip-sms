// tests/renderer/utils/format.test.js

const { formatPhoneNumber, formatMessageTime } = require('../../../../src/renderer/utils/format.js');
// import { formatPhoneNumber, formatMessageTime } from '../../../../src/renderer/utils/format.js';

describe('formatPhoneNumber', () => {
  test('formats 11-digit US number with +1', () => {
    expect(formatPhoneNumber('+15551234567')).toBe('(555) 123-4567');
  });

  test('formats 11-digit US number without +', () => {
    expect(formatPhoneNumber('15551234567')).toBe('(555) 123-4567');
  });

  test('formats 10-digit number', () => {
    expect(formatPhoneNumber('5551234567')).toBe('(555) 123-4567');
  });

  test('formats number with dashes', () => {
    expect(formatPhoneNumber('555-123-4567')).toBe('(555) 123-4567');
  });

  test('formats number with dots', () => {
    expect(formatPhoneNumber('555.123.4567')).toBe('(555) 123-4567');
  });

  test('formats number with spaces', () => {
    expect(formatPhoneNumber('555 123 4567')).toBe('(555) 123-4567');
  });

  test('returns number as-is if too short', () => {
    expect(formatPhoneNumber('12345')).toBe('12345');
  });

  test('returns number as-is if too long', () => {
    expect(formatPhoneNumber('+12345678901234')).toBe('+12345678901234');
  });

  test('returns empty string for empty input', () => {
    expect(formatPhoneNumber('')).toBe('');
  });
});

describe('formatMessageTime', () => {
  test('formats morning time', () => {
    expect(formatMessageTime('2026-07-31 09:00:00')).toBe('9:00 AM');
  });

  test('formats afternoon time', () => {
    expect(formatMessageTime('2026-07-31 14:30:00')).toBe('2:30 PM');
  });

  test('formats midnight', () => {
    expect(formatMessageTime('2026-07-31 00:00:00')).toBe('12:00 AM');
  });

  test('formats noon', () => {
    expect(formatMessageTime('2026-07-31 12:00:00')).toBe('12:00 PM');
  });

  test('formats with single-digit hour', () => {
    expect(formatMessageTime('2026-07-31 05:15:00')).toBe('5:15 AM');
  });
});