import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MiniMap } from '../MiniMap';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

// Mock react-leaflet and leaflet dependencies
jest.mock('react-leaflet', () => ({
  useMap: jest.fn(),
  MapContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Rectangle: () => <div data-testid="viewport-rectangle" />,
}));

// Mock map instance with common Leaflet methods
const mockMainMap = {
  getCenter: jest.fn().mockReturnValue({ lat: 46.23, lng: -119.23 }),
  getZoom: jest.fn().mockReturnValue(10),
  getBounds: jest.fn().mockReturnValue({
    getNorthEast: () => ({ lat: 46.25, lng: -119.20 }),
    getSouthWest: () => ({ lat: 46.21, lng: -119.26 }),
  }),
  on: jest.fn(),
  off: jest.fn(),
  setView: jest.fn(),
  fitBounds: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

// Mock mini map instance
const mockMiniMap = {
  on: jest.fn(),
  off: jest.fn(),
  setView: jest.fn(),
  fitBounds: jest.fn(),
  addLayer: jest.fn(),
  removeLayer: jest.fn(),
};

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  (useMap as jest.Mock).mockReturnValue(mockMainMap);
});

describe('MiniMap Component', () => {
  test('renders mini-map correctly', () => {
    render(<MiniMap />);
    
    expect(screen.getByTestId('mini-map-container')).toBeInTheDocument();
  });

  test('shows and hides mini-map when toggle button is clicked', () => {
    render(<MiniMap />);
    
    // Mini-map should be visible by default
    expect(screen.getByTestId('mini-map-container')).toHaveStyle('display: block');
    
    // Click toggle button to hide mini-map
    const toggleButton = screen.getByRole('button', { name: /toggle mini-map/i });
    fireEvent.click(toggleButton);
    
    // Mini-map should be hidden
    expect(screen.getByTestId('mini-map-container')).toHaveStyle('display: none');
    
    // Click toggle button again to show mini-map
    fireEvent.click(toggleButton);
    
    // Mini-map should be visible again
    expect(screen.getByTestId('mini-map-container')).toHaveStyle('display: block');
  });

  test('updates viewport rectangle when main map moves', () => {
    render(<MiniMap />);
    
    // Simulate map moveend event
    const moveEndCallback = mockMainMap.on.mock.calls.find(call => call[0] === 'moveend')[1];
    expect(moveEndCallback).toBeDefined();
    
    // Trigger the callback
    moveEndCallback();
    
    // Check if viewport rectangle is updated
    expect(mockMainMap.getBounds).toHaveBeenCalled();
  });

  test('updates main map when mini-map is clicked', () => {
    render(<MiniMap />);
    
    // Mock function to handle mini-map click
    const clickCallback = jest.fn();
    
    // Simulate map click event
    const clickHandler = screen.getByTestId('mini-map-click-handler');
    fireEvent.click(clickHandler, { clientX: 50, clientY: 50 });
    
    // Main map should be updated
    expect(mockMainMap.setView).toHaveBeenCalled();
  });

  test('zooms to preset views when buttons are clicked', () => {
    render(<MiniMap />);
    
    // Click county view button
    const countyButton = screen.getByRole('button', { name: /county view/i });
    fireEvent.click(countyButton);
    
    // Main map should be updated to county view
    expect(mockMainMap.fitBounds).toHaveBeenCalled();
    
    // Click neighborhood view button
    const neighborhoodButton = screen.getByRole('button', { name: /neighborhood view/i });
    fireEvent.click(neighborhoodButton);
    
    // Main map should be updated to neighborhood view
    expect(mockMainMap.fitBounds).toHaveBeenCalledTimes(2);
  });

  test('cleans up event listeners on unmount', () => {
    const { unmount } = render(<MiniMap />);
    unmount();
    
    // Check if event listeners are removed
    expect(mockMainMap.off).toHaveBeenCalled();
  });

  test('handles keyboard shortcuts', () => {
    render(<MiniMap />);
    
    // Simulate 'm' key press to toggle mini-map
    fireEvent.keyDown(document, { key: 'n', code: 'KeyN' });
    
    // Check if mini-map visibility is toggled
    expect(screen.getByTestId('mini-map-container')).toHaveStyle('display: none');
    
    // Simulate 'm' key press again to toggle mini-map back
    fireEvent.keyDown(document, { key: 'n', code: 'KeyN' });
    
    // Check if mini-map visibility is toggled again
    expect(screen.getByTestId('mini-map-container')).toHaveStyle('display: block');
  });

  test('allows dragging viewport rectangle to navigate main map', async () => {
    render(<MiniMap />);
    
    // Mock the rectangle drag event handler
    const rectangleElement = screen.getByTestId('viewport-rectangle');
    
    // Simulate drag start
    fireEvent.mouseDown(rectangleElement);
    
    // Simulate drag move
    fireEvent.mouseMove(rectangleElement, { clientX: 100, clientY: 100 });
    
    // Simulate drag end
    fireEvent.mouseUp(rectangleElement);
    
    // Wait for the effect to be applied
    await waitFor(() => {
      expect(mockMainMap.setView).toHaveBeenCalled();
    });
  });
});