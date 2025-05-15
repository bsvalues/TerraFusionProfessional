/**
 * Minimal React Test
 * 
 * This test imports React but does not import any application components.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

// A minimal test component
const TestComponent = () => {
  return <div data-testid="test-component">Test Component</div>;
};

describe('Minimal React Tests', () => {
  test('can render a simple React component', () => {
    render(<TestComponent />);
    const element = screen.getByTestId('test-component');
    expect(element).toBeInTheDocument();
    expect(element.textContent).toBe('Test Component');
  });
});