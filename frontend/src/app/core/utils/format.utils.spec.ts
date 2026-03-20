import { formatDate, isValidEmail, truncate, getInitials, daysUntil } from './format.utils';

describe('format.utils', () => {
  describe('formatDate', () => {
    it('should format a Date object correctly', () => {
      // Use explicit UTC date to avoid timezone issues
      const date = new Date('2024-03-15T12:00:00Z');
      const result = formatDate(date);
      expect(result).toContain('2024');
      expect(result).toContain('marzo');
    });

    it('should format a string date correctly', () => {
      const result = formatDate('2024-12-25');
      expect(result).toContain('2024');
      expect(result).toContain('diciembre');
    });
  });

  describe('isValidEmail', () => {
    it('should return true for valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.org')).toBe(true);
      expect(isValidEmail('admin@sub.domain.co.uk')).toBe(true);
    });

    it('should return false for invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('user name@domain.com')).toBe(false);
    });
  });

  describe('truncate', () => {
    it('should return original text if shorter than maxLength', () => {
      expect(truncate('Hello', 10)).toBe('Hello');
      expect(truncate('Hi', 5)).toBe('Hi');
    });

    it('should truncate text longer than maxLength', () => {
      expect(truncate('Hello World', 8)).toBe('Hello...');
      expect(truncate('This is a long text', 10)).toBe('This is...');
    });

    it('should handle exact length', () => {
      expect(truncate('Hello', 5)).toBe('Hello');
    });

    it('should handle empty string', () => {
      expect(truncate('', 10)).toBe('');
    });
  });

  describe('getInitials', () => {
    it('should return first letter of single name', () => {
      expect(getInitials('Juan')).toBe('J');
    });

    it('should return first letters of two names', () => {
      expect(getInitials('Juan Pérez')).toBe('JP');
    });

    it('should return first letters of full name', () => {
      expect(getInitials('María García López')).toBe('MG');
    });

    it('should handle lowercase names', () => {
      expect(getInitials('juan')).toBe('J');
    });

    it('should handle empty string', () => {
      expect(getInitials('')).toBe('');
    });
  });

  describe('daysUntil', () => {
    it('should return 0 for today', () => {
      const today = new Date();
      expect(daysUntil(today)).toBe(0);
    });

    it('should return positive number for future dates', () => {
      const future = new Date();
      future.setDate(future.getDate() + 5);
      expect(daysUntil(future)).toBe(5);
    });

    it('should return negative number for past dates', () => {
      const past = new Date();
      past.setDate(past.getDate() - 3);
      expect(daysUntil(past)).toBe(-3);
    });
  });
});
