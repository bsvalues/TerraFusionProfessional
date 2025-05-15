import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MapLegend from '../MapLegend';

// Mock the accessibility context
jest.mock('@/contexts/MapAccessibilityContext', () => ({
  useMapAccessibility: () => ({
    highContrastMode: false,
    toggleHighContrastMode: jest.fn(),
    keyboardNavigation: true,
    screenReaderAnnouncements: true,
    fontSizeScale: 1,
    reducedMotion: false,
    announceToScreenReader: jest.fn(),
  }),
}));

describe('MapLegend', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders legend with all property types', () => {
    render(<MapLegend />);
    
    // Check if all property types are present
    expect(screen.getByText('Residential')).toBeInTheDocument();
    expect(screen.getByText('Commercial')).toBeInTheDocument();
    expect(screen.getByText('Industrial')).toBeInTheDocument();
    expect(screen.getByText('Agricultural')).toBeInTheDocument();
  });

  test('legend can be toggled on and off', () => {
    render(<MapLegend />);
    
    const toggleButton = screen.getByLabelText('Toggle legend');
    const legendContent = screen.getByTestId('legend-content');
    
    // Initially visible
    expect(legendContent).toBeVisible();
    
    // Click to hide
    fireEvent.click(toggleButton);
    expect(legendContent).not.toBeVisible();
    
    // Click to show again
    fireEvent.click(toggleButton);
    expect(legendContent).toBeVisible();
  });

  test('legend is keyboard accessible', () => {
    render(<MapLegend />);
    
    const toggleButton = screen.getByLabelText('Toggle legend');
    const legendContent = screen.getByTestId('legend-content');
    
    // Initially visible
    expect(legendContent).toBeVisible();
    
    // Press Enter to hide
    fireEvent.keyDown(toggleButton, { key: 'Enter' });
    expect(legendContent).not.toBeVisible();
    
    // Press Space to show again
    fireEvent.keyDown(toggleButton, { key: ' ' });
    expect(legendContent).toBeVisible();
  });

  test('renders marker types section', () => {
    render(<MapLegend />);
    
    expect(screen.getByText('Marker Types')).toBeInTheDocument();
    expect(screen.getByText('Default')).toBeInTheDocument();
    expect(screen.getByText('Selected')).toBeInTheDocument();
    expect(screen.getByText('Cluster')).toBeInTheDocument();
    expect(screen.getByText('Heatmap')).toBeInTheDocument();
  });

  test('displays high contrast colors when high contrast mode is active', () => {
    // Create a new mock for high contrast mode
    jest.unmock('@/contexts/MapAccessibilityContext');
    jest.mock('@/contexts/MapAccessibilityContext', () => ({
      useMapAccessibility: () => ({
        highContrastMode: true,
        toggleHighContrastMode: jest.fn(),
        keyboardNavigation: true,
        screenReaderAnnouncements: true,
        fontSizeScale: 1,
        reducedMotion: false,
        announceToScreenReader: jest.fn(),
      }),
    }));
    
    render(<MapLegend />);
    
    // Check for high contrast version of the legend
    // This is an implementation detail that will need to match the actual component
    const residentialMarker = screen.getByTestId('residential-marker');
    expect(residentialMarker).toHaveStyle('background-color: #2E8540'); // High contrast green
  });
});