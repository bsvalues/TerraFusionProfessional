/**
 * Pure JavaScript Test - No React or Application Imports
 * 
 * This test uses Jest but doesn't import any application code or React.
 */

describe('Pure JavaScript Tests', () => {
  test('true should be true', () => {
    expect(true).toBe(true);
  });

  test('1 + 1 should equal 2', () => {
    expect(1 + 1).toBe(2);
  });

  test('strings should concatenate', () => {
    expect('hello' + ' world').toBe('hello world');
  });

  test('arrays should work', () => {
    const arr = [1, 2, 3];
    expect(arr.length).toBe(3);
    expect(arr[0]).toBe(1);
  });

  test('objects should work', () => {
    const obj = { name: 'test', value: 42 };
    expect(obj.name).toBe('test');
    expect(obj.value).toBe(42);
  });
});