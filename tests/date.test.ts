import { describe, it, expect } from 'vitest';
import { getLocalDateString, formatISODateString } from '../packages/shared/src/utils/date';

describe('Shared Date Utilities', () => {
  it('should format Date instance to YYYY-MM-DD local date string', () => {
    const testDate = new Date(2025, 0, 15); // Jan 15, 2025
    expect(getLocalDateString(testDate)).toBe('2025-01-15');
  });

  it('should validate and format YYYY-MM-DD date strings', () => {
    expect(formatISODateString('2025-12-31')).toBe('2025-12-31');
    expect(formatISODateString('invalid-date')).toBeNull();
    expect(formatISODateString('')).toBeNull();
  });
});
