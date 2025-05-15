import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AutoHideProvider, useAutoHide } from '../contexts/AutoHideContext';
import AutoHidingPanel from '../components/ui/AutoHidingPanel';

// Mock timer functions
jest.useFakeTimers();

// Test component that uses the auto-hide hook
const TestComponent = ({ 
  id = 'test-panel', 
  defaultVisible = true, 
  isPinnable = true,
  timeout = 5000 
}) => {
  const { visible, setVisible, pinned, togglePin } = useAutoHide(id, defaultVisible, timeout);
  
  return (
    <div data-testid="test-container">
      <div data-testid="panel" style={{ display: visible ? 'block' : 'none' }}>
        Panel Content
      </div>
      <button data-testid="toggle-btn" onClick={() => setVisible(!visible)}>
        Toggle
      </button>
      {isPinnable && (
        <button data-testid="pin-btn" onClick={togglePin}>
          {pinned ? 'Unpin' : 'Pin'}
        </button>
      )}
      <div data-testid="status">
        {`Visible: ${visible}, Pinned: ${pinned}`}
      </div>
    </div>
  );
};

describe('Auto-hiding UI Components', () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });
  
  test('Panel should hide after timeout period of inactivity', () => {
    render(
      <AutoHideProvider>
        <TestComponent />
      </AutoHideProvider>
    );
    
    // Panel should be visible initially
    expect(screen.getByTestId('panel')).toBeVisible();
    
    // Fast-forward time to trigger auto-hide
    act(() => {
      jest.advanceTimersByTime(5100);
    });
    
    // Panel should now be hidden
    expect(screen.getByTestId('panel')).not.toBeVisible();
  });
  
  test('Panel should remain visible when pinned', () => {
    render(
      <AutoHideProvider>
        <TestComponent />
      </AutoHideProvider>
    );
    
    // Pin the panel
    fireEvent.click(screen.getByTestId('pin-btn'));
    
    // Fast-forward time beyond hide timeout
    act(() => {
      jest.advanceTimersByTime(6000);
    });
    
    // Panel should still be visible
    expect(screen.getByTestId('panel')).toBeVisible();
  });
  
  test('User interaction should reset the hide timer', () => {
    render(
      <AutoHideProvider>
        <TestComponent />
      </AutoHideProvider>
    );
    
    // Advance time partway to timeout
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    
    // Simulate user interaction
    fireEvent.click(screen.getByTestId('toggle-btn'));
    fireEvent.click(screen.getByTestId('toggle-btn')); // Toggle back to visible
    
    // Advance time but not enough for the new timer
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    
    // Panel should still be visible (timer was reset)
    expect(screen.getByTestId('panel')).toBeVisible();
    
    // Now advance to trigger the timeout
    act(() => {
      jest.advanceTimersByTime(2100);
    });
    
    // Panel should now be hidden
    expect(screen.getByTestId('panel')).not.toBeVisible();
  });
  
  test('Multiple panels should have independent visibility states', () => {
    render(
      <AutoHideProvider>
        <TestComponent id="panel1" defaultVisible={true} />
        <TestComponent id="panel2" defaultVisible={false} />
      </AutoHideProvider>
    );
    
    // Get status displays for both panels
    const statusElements = screen.getAllByTestId('status');
    
    // Check initial states
    expect(statusElements[0].textContent).toBe('Visible: true, Pinned: false');
    expect(statusElements[1].textContent).toBe('Visible: false, Pinned: false');
  });
  
  test('Toggling visibility should work correctly', () => {
    render(
      <AutoHideProvider>
        <TestComponent />
      </AutoHideProvider>
    );
    
    // Panel should be visible initially
    expect(screen.getByTestId('panel')).toBeVisible();
    
    // Toggle visibility off
    fireEvent.click(screen.getByTestId('toggle-btn'));
    expect(screen.getByTestId('panel')).not.toBeVisible();
    
    // Toggle visibility on
    fireEvent.click(screen.getByTestId('toggle-btn'));
    expect(screen.getByTestId('panel')).toBeVisible();
  });
  
  test('AutoHidingPanel component should wrap child content', () => {
    render(
      <AutoHideProvider>
        <AutoHidingPanel id="test-panel" defaultVisible={true} title="Test Panel">
          <div data-testid="child-content">Panel content here</div>
        </AutoHidingPanel>
      </AutoHideProvider>
    );
    
    // Child content should be rendered
    expect(screen.getByTestId('child-content')).toHaveTextContent('Panel content here');
  });
  
  test('Should show appropriate pin/unpin state', () => {
    render(
      <AutoHideProvider>
        <TestComponent />
      </AutoHideProvider>
    );
    
    // Initially unpinned
    expect(screen.getByTestId('pin-btn')).toHaveTextContent('Pin');
    
    // Toggle pin
    fireEvent.click(screen.getByTestId('pin-btn'));
    
    // Should now show "Unpin" text
    expect(screen.getByTestId('pin-btn')).toHaveTextContent('Unpin');
  });
});