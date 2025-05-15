import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PropertySearchDialog } from '../PropertySearchDialog';
import { Property } from '@/shared/types';

// Mock property for testing
const mockReferenceProperty: Property = {
  id: 'property-1',
  parcelId: 'APN12345',
  address: '123 Main St, Benton County, WA',
  owner: 'John Doe',
  value: '$350,000',
  salePrice: '$325,000',
  squareFeet: 2200,
  yearBuilt: 2005,
  landValue: '$100,000',
  coordinates: [46.2, -119.1]
};

// Mock property list for search results
const mockProperties: Property[] = [
  mockReferenceProperty,
  {
    id: 'property-2',
    parcelId: 'APN12346',
    address: '125 Main St, Benton County, WA',
    owner: 'Jane Smith',
    value: '$355,000',
    salePrice: '$330,000',
    squareFeet: 2250,
    yearBuilt: 2006,
    landValue: '$105,000',
    coordinates: [46.201, -119.102]
  },
  {
    id: 'property-3',
    parcelId: 'APN12347',
    address: '130 Oak Ave, Benton County, WA',
    owner: 'Bob Johnson',
    value: '$400,000',
    salePrice: '$385,000',
    squareFeet: 2600,
    yearBuilt: 2010,
    landValue: '$120,000',
    coordinates: [46.205, -119.105]
  }
];

// Mock callback functions
const mockOnSearch = jest.fn();
const mockOnSelect = jest.fn();
const mockOnClose = jest.fn();

describe('PropertySearchDialog Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders search form with all filter options', () => {
    render(
      <PropertySearchDialog
        isOpen={true}
        referenceProperty={mockReferenceProperty}
        onSearch={mockOnSearch}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />
    );

    // Verify all search form elements are present
    expect(screen.getByText(/Find Comparable Properties/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Distance Radius/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Square Footage Range/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Year Built Range/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Price Range/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Search/i })).toBeInTheDocument();
  });

  test('submits search with correct parameters', async () => {
    render(
      <PropertySearchDialog
        isOpen={true}
        referenceProperty={mockReferenceProperty}
        onSearch={mockOnSearch}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />
    );

    // Set search parameters
    fireEvent.change(screen.getByLabelText(/Distance Radius/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/Min Square Footage/i), { target: { value: '2000' } });
    fireEvent.change(screen.getByLabelText(/Max Square Footage/i), { target: { value: '2400' } });
    fireEvent.change(screen.getByLabelText(/Min Year Built/i), { target: { value: '2000' } });
    fireEvent.change(screen.getByLabelText(/Max Year Built/i), { target: { value: '2010' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Search/i }));
    
    // Verify search parameters are correctly passed to the onSearch callback
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith({
        radiusMiles: 1,
        squareFootageMin: 2000,
        squareFootageMax: 2400,
        yearBuiltMin: 2000,
        yearBuiltMax: 2010,
        referencePropertyId: 'property-1'
      });
    });
  });

  test('validates numeric inputs correctly', () => {
    render(
      <PropertySearchDialog
        isOpen={true}
        referenceProperty={mockReferenceProperty}
        onSearch={mockOnSearch}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />
    );

    // Try to enter invalid data
    fireEvent.change(screen.getByLabelText(/Distance Radius/i), { target: { value: 'abc' } });
    fireEvent.click(screen.getByRole('button', { name: /Search/i }));
    
    // Expect validation error and no search call
    expect(screen.getByText(/Please enter a valid number/i)).toBeInTheDocument();
    expect(mockOnSearch).not.toHaveBeenCalled();
  });

  test('handles empty result sets appropriately', async () => {
    // Mock search function that returns empty results
    const emptySearchMock = jest.fn().mockResolvedValue([]);
    
    render(
      <PropertySearchDialog
        isOpen={true}
        referenceProperty={mockReferenceProperty}
        onSearch={emptySearchMock}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
        initialSearchResults={[]}
      />
    );

    // Submit the search form
    fireEvent.click(screen.getByRole('button', { name: /Search/i }));
    
    // Check for empty state message
    await waitFor(() => {
      expect(screen.getByText(/No comparable properties found/i)).toBeInTheDocument();
    });
  });

  test('displays search results and allows property selection', async () => {
    // Mock search results
    const searchResultsMock = jest.fn().mockResolvedValue(mockProperties);
    
    render(
      <PropertySearchDialog
        isOpen={true}
        referenceProperty={mockReferenceProperty}
        onSearch={searchResultsMock}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
        initialSearchResults={mockProperties}
      />
    );

    // Verify results are displayed
    expect(screen.getByText('125 Main St, Benton County, WA')).toBeInTheDocument();
    expect(screen.getByText('130 Oak Ave, Benton County, WA')).toBeInTheDocument();
    
    // Select a property
    fireEvent.click(screen.getByText('Add to Comparison').closest('button'));
    
    // Verify selection callback
    expect(mockOnSelect).toHaveBeenCalledWith(mockProperties[1]);
  });
});