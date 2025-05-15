/**
 * Simple Test
 * 
 * This is the most basic test possible - it doesn't import any application code
 * and should pass regardless of application state.
 */

describe('Simple Test Suite', () => {
  test('true should be true', () => {
    expect(true).toBe(true);
  });

  test('1 + 1 should equal 2', () => {
    expect(1 + 1).toBe(2);
  });

  test('strings should concatenate', () => {
    expect('hello' + ' world').toBe('hello world');
  });
});