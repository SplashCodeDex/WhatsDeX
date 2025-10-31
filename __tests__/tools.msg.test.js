const { ucwords } = require('../tools/msg.js');

describe('ucwords', () => {
  it('should capitalize the first letter of each word', () => {
    expect(ucwords('hello world')).toBe('Hello World');
  });

  it('should handle single words', () => {
    expect(ucwords('hello')).toBe('Hello');
  });

  it('should handle already capitalized words', () => {
    expect(ucwords('Hello World')).toBe('Hello World');
  });

  it('should handle mixed case words', () => {
    expect(ucwords('hELLo wORLd')).toBe('Hello World');
  });

  it('should return null for null input', () => {
    expect(ucwords(null)).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(ucwords('')).toBe(null);
  });
});
