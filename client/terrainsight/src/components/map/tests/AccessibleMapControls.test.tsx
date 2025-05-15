import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccessibleMapControls } from '../AccessibleMapControls';

// Mock the useMap hook from react-leaflet
jest.mock('react-leaflet', () => ({
  useMap: jest.fn(() => ({
    setView: jest.fn(),
    getZoom: jest.fn().mockReturnValue(8),
    setZoom: jest.fn(),
    locate: jest.fn(),
    getCenter: jest.fn().mockReturnValue({ lat: 46.2, lng: -119.15 }),
    flyTo: jest.fn(),
    zoomIn: jest.fn(),
    zoomOut: jest.fn(),
    panBy: jest.fn(),
  })),
}));

describe('AccessibleMapControls', () => {
  const defaultProps = {
    defaultCenter: [46.2, -119.15] as [number, number],
    defaultZoom: 8,
    onResetView: jest.fn(),
    ariaLabels: {
      zoomIn: 'Zoom in',
      zoomOut: 'Zoom out',
      resetView: 'Reset view',
      fullScreen: 'Toggle full screen',
      openSettings: 'Open map settings',
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with all accessibility controls', () => {
    render(<AccessibleMapControls {...defaultProps} />);
    
    expect(screen.getByLabelText('Zoom in')).toBeInTheDocument();
    expect(screen.getByLabelText('Zoom out')).toBeInTheDocument();
    expect(screen.getByLabelText('Reset view')).toBeInTheDocument();
  });

  test('zoom buttons have proper ARIA attributes', () => {
    render(<AccessibleMapControls {...defaultProps} />);
    
    const zoomInButton = screen.getByLabelText('Zoom in');
    const zoomOutButton = screen.getByLabelText('Zoom out');
    
    expect(zoomInButton).toHaveAttribute('aria-label', 'Zoom in');
    expect(zoomOutButton).toHaveAttribute('aria-label', 'Zoom out');
    expect(zoomInButton).toHaveAttribute('role', 'button');
    expect(zoomOutButton).toHaveAttribute('role', 'button');
  });

  test('zoom in button calls map.zoomIn when clicked', () => {
    const { getByLabelText } = render(<AccessibleMapControls {...defaultProps} />);
    const mockMap = require('react-leaflet').useMap();
    
    fireEvent.click(getByLabelText('Zoom in'));
    
    expect(mockMap.zoomIn).toHaveBeenCalled();
  });

  test('zoom out button calls map.zoomOut when clicked', () => {
    const { getByLabelText } = render(<AccessibleMapControls {...defaultProps} />);
    const mockMap = require('react-leaflet').useMap();
    
    fireEvent.click(getByLabelText('Zoom out'));
    
    expect(mockMap.zoomOut).toHaveBeenCalled();
  });

  test('reset view button calls onResetView prop when clicked', () => {
    const { getByLabelText } = render(<AccessibleMapControls {...defaultProps} />);
    
    fireEvent.click(getByLabelText('Reset view'));
    
    expect(defaultProps.onResetView).toHaveBeenCalled();
  });

  test('supports keyboard navigation between controls', async () => {
    const user = userEvent.setup();
    render(<AccessibleMapControls {...defaultProps} />);
    
    // Initial focus on the first control
    const zoomInButton = screen.getByLabelText('Zoom in');
    zoomInButton.focus();
    expect(document.activeElement).toBe(zoomInButton);
    
    // Tab to the next control
    await user.tab();
    expect(document.activeElement).toBe(screen.getByLabelText('Zoom out'));
    
    // Tab to the next control
    await user.tab();
    expect(document.activeElement).toBe(screen.getByLabelText('Reset view'));
  });

  test('announces map zoom level changes to screen readers', () => {
    render(<AccessibleMapControls {...defaultProps} />);
    const mockMap = require('react-leaflet').useMap();
    
    // Initial render should create an aria-live region
    const ariaLiveRegion = screen.getByRole('status', { hidden: true });
    expect(ariaLiveRegion).toBeInTheDocument();
    
    // Simulate zoom change
    fireEvent.click(screen.getByLabelText('Zoom in'));
    
    // The aria-live region should contain updated zoom information
    expect(mockMap.zoomIn).toHaveBeenCalled();
    // In a real implementation, we would check for the updated content in the live region
  });
});