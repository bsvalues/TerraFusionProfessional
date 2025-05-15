import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { AccessiblePropertyMarker } from '../AccessiblePropertyMarker';
import { Property } from '@shared/schema';

// Mock the react-leaflet components
jest.mock('react-leaflet', () => ({
  Marker: ({ children, eventHandlers, ref }) => (
    <div data-testid="marker" onClick={eventHandlers?.click}>
      {children}
    </div>
  ),
  Popup: ({ children }) => <div data-testid="popup">{children}</div>,
  useMap: jest.fn(() => ({
    flyTo: jest.fn(),
  })),
}));

// Mock the getElement method on the Marker reference
const mockMarkerRef = {
  current: {
    getElement: jest.fn().mockReturnValue({
      setAttribute: jest.fn(),
      addEventListener: jest.fn(),
      style: {}
    }),
    openPopup: jest.fn()
  },
};

describe('AccessiblePropertyMarker', () => {
  const mockProperty: Property = {
    id: 1,
    parcelId: 'TEST123',
    address: '123 Main St',
    owner: 'Test Owner',
    value: 250000,
    salePrice: 255000,
    squareFeet: 2000,
    yearBuilt: 2005,
    bedrooms: 3,
    bathrooms: 2,
    propertyType: 'residential',
    landValue: 100000,
    latitude: 46.23,
    longitude: -119.14,
    neighborhood: 'Test Neighborhood',
    zoning: 'residential',
    lotSize: 0.25,
    taxAssessment: 245000,
    attributes: {}
  };

  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders properly with property data', () => {
    const { getByText } = render(
      <AccessiblePropertyMarker
        property={mockProperty}
        isSelected={false}
        onSelect={mockOnSelect}
        markerRef={mockMarkerRef as any}
      />
    );
    
    // The popup content should have the property address
    expect(getByText('123 Main St')).toBeInTheDocument();
  });

  test('calls onSelect when marker is clicked', () => {
    const { getByTestId } = render(
      <AccessiblePropertyMarker
        property={mockProperty}
        isSelected={false}
        onSelect={mockOnSelect}
        markerRef={mockMarkerRef as any}
      />
    );
    
    fireEvent.click(getByTestId('marker'));
    expect(mockOnSelect).toHaveBeenCalledWith(mockProperty);
  });

  test('adds proper accessibility attributes to the marker', () => {
    render(
      <AccessiblePropertyMarker
        property={mockProperty}
        isSelected={false}
        onSelect={mockOnSelect}
        markerRef={mockMarkerRef as any}
      />
    );
    
    // The marker should be made focusable with correct ARIA attributes
    expect(mockMarkerRef.current.getElement).toHaveBeenCalled();
    const setAttributeMock = mockMarkerRef.current.getElement().setAttribute;
    
    expect(setAttributeMock).toHaveBeenCalledWith('tabindex', '0');
    expect(setAttributeMock).toHaveBeenCalledWith('role', 'button');
    expect(setAttributeMock).toHaveBeenCalledWith('aria-label', expect.stringContaining('residential property at 123 Main St'));
  });

  test('adds different attributes when selected', () => {
    render(
      <AccessiblePropertyMarker
        property={mockProperty}
        isSelected={true}
        onSelect={mockOnSelect}
        markerRef={mockMarkerRef as any}
      />
    );
    
    const setAttributeMock = mockMarkerRef.current.getElement().setAttribute;
    
    // Should indicate selection in aria-label
    expect(setAttributeMock).toHaveBeenCalledWith('aria-label', expect.stringContaining('Currently selected'));
    
    // Should set aria-expanded when selected (for popup state)
    expect(setAttributeMock).toHaveBeenCalledWith('aria-expanded', 'true');
  });

  test('adds keyboard event listeners for accessibility', () => {
    render(
      <AccessiblePropertyMarker
        property={mockProperty}
        isSelected={false}
        onSelect={mockOnSelect}
        markerRef={mockMarkerRef as any}
      />
    );
    
    const addEventListenerMock = mockMarkerRef.current.getElement().addEventListener;
    
    // Should add keyboard event listeners
    expect(addEventListenerMock).toHaveBeenCalledWith('keydown', expect.any(Function));
    expect(addEventListenerMock).toHaveBeenCalledWith('focus', expect.any(Function));
    expect(addEventListenerMock).toHaveBeenCalledWith('blur', expect.any(Function));
  });
});