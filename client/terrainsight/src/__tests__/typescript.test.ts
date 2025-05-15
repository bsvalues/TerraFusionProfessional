/**
 * TypeScript Test - No React
 * 
 * This test uses TypeScript but doesn't import any React or UI components.
 */

interface TestObject {
  name: string;
  value: number;
}

describe('TypeScript Tests', () => {
  test('should support TypeScript types', () => {
    const obj: TestObject = { name: 'test', value: 42 };
    expect(obj.name).toBe('test');
    expect(obj.value).toBe(42);
  });

  test('should support TypeScript arrays', () => {
    const arr: number[] = [1, 2, 3];
    expect(arr.length).toBe(3);
    expect(arr[0]).toBe(1);
  });

  test('should support TypeScript string manipulation', () => {
    const greeting: string = 'Hello';
    const subject: string = 'World';
    const message: string = `${greeting}, ${subject}!`;
    
    expect(message).toBe('Hello, World!');
  });
});