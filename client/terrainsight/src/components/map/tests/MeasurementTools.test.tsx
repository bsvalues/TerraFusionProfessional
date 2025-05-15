import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MeasurementTools } from '../MeasurementTools';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

// Mock react-leaflet and leaflet dependencies
jest.mock('react-leaflet', () => ({
  useMap: jest.fn(),
}));

// Mock map instance
const mockMap = {
  on: jest.fn(),
  off: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  remove: jest.fn(),
  addLayer: jest.fn(),
  removeLayer: jest.fn()
};

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  (useMap as jest.Mock).mockReturnValue(mockMap);
});

describe('MeasurementTools Component', () => {
  test('renders measurement controls correctly', () => {
    render(<MeasurementTools />);
    
    expect(screen.getByText('Measurement Tools')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /distance/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /area/i })).toBeInTheDocument();
  });

  test('toggles between distance and area measurement', () => {
    render(<MeasurementTools />);
    
    // Start with distance measurement
    const distanceButton = screen.getByRole('button', { name: /distance/i });
    fireEvent.click(distanceButton);
    
    expect(screen.getByText('Distance Measurement')).toBeInTheDocument();
    expect(screen.getByText('Click points on map to measure')).toBeInTheDocument();
    
    // Switch to area measurement
    const areaButton = screen.getByRole('button', { name: /area/i });
    fireEvent.click(areaButton);
    
    expect(screen.getByText('Area Measurement')).toBeInTheDocument();
    expect(screen.getByText('Click points to draw a polygon')).toBeInTheDocument();
  });

  test('switches between metric and imperial units', () => {
    render(<MeasurementTools />);
    
    // Default should be metric
    expect(screen.getByRole('button', { name: /metric/i })).toHaveAttribute('data-state', 'active');
    
    // Switch to imperial
    const imperialButton = screen.getByRole('button', { name: /imperial/i });
    fireEvent.click(imperialButton);
    
    expect(screen.getByRole('button', { name: /imperial/i })).toHaveAttribute('data-state', 'active');
  });

  test('displays distance measurement correctly', () => {
    render(<MeasurementTools />);
    
    // Start distance measurement
    const distanceButton = screen.getByRole('button', { name: /distance/i });
    fireEvent.click(distanceButton);
    
    // Mock the measurement callback
    const mockMeasurementCallback = jest.fn();
    window.dispatchEvent(new CustomEvent('map:distance-measured', { 
      detail: { 
        distance: 1500, // 1.5 km
        points: [[46.23, -119.23], [46.24, -119.24]]
      }
    }));
    
    // Check if distance is displayed correctly
    expect(screen.getByText('1.5 km')).toBeInTheDocument();
  });

  test('displays area measurement correctly', () => {
    render(<MeasurementTools />);
    
    // Start area measurement
    const areaButton = screen.getByRole('button', { name: /area/i });
    fireEvent.click(areaButton);
    
    // Mock the measurement callback
    window.dispatchEvent(new CustomEvent('map:area-measured', { 
      detail: { 
        area: 250000, // 0.25 km²
        points: [[46.23, -119.23], [46.24, -119.23], [46.24, -119.24], [46.23, -119.24]]
      }
    }));
    
    // Check if area is displayed correctly
    expect(screen.getByText('0.25 km²')).toBeInTheDocument();
  });

  test('resets measurement when cancel button is clicked', () => {
    render(<MeasurementTools />);
    
    // Start distance measurement
    const distanceButton = screen.getByRole('button', { name: /distance/i });
    fireEvent.click(distanceButton);
    
    // Trigger a measurement
    window.dispatchEvent(new CustomEvent('map:distance-measured', { 
      detail: { 
        distance: 1500,
        points: [[46.23, -119.23], [46.24, -119.24]]
      }
    }));
    
    // Check if measurement is displayed
    expect(screen.getByText('1.5 km')).toBeInTheDocument();
    
    // Click cancel button
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    
    // Check if measurement is cleared
    expect(screen.queryByText('1.5 km')).not.toBeInTheDocument();
  });

  test('cleans up event listeners on unmount', () => {
    const { unmount } = render(<MeasurementTools />);
    unmount();
    
    expect(mockMap.off).toHaveBeenCalled();
  });

  test('handles keyboard shortcuts', () => {
    const { container } = render(<MeasurementTools />);
    
    // Simulate 'd' key press for distance measurement
    fireEvent.keyDown(container, { key: 'm', code: 'KeyM' });
    expect(screen.getByText('Distance Measurement')).toBeInTheDocument();
    
    // Simulate 'a' key press for area measurement
    fireEvent.keyDown(container, { key: 'a', code: 'KeyA' });
    expect(screen.getByText('Area Measurement')).toBeInTheDocument();
    
    // Simulate 'Escape' key press to cancel measurement
    fireEvent.keyDown(container, { key: 'Escape', code: 'Escape' });
    expect(screen.queryByText('Area Measurement')).not.toBeInTheDocument();
  });
});