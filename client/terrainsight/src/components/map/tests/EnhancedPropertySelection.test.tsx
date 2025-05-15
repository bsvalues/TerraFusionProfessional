import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PropertySelectionProvider, usePropertySelection } from '../PropertySelectionContext';
import { Property } from '@/shared/types';

// Mock properties for testing
const mockProperties: Property[] = [
  {
    id: '1',
    parcelId: 'P123456',
    address: '123 Main St, Richland, WA',
    squareFeet: 2500,
    yearBuilt: 1998,
    value: '450000',
    landValue: '120000',
    coordinates: [46.2804, -119.2752]
  },
  {
    id: '2',
    parcelId: 'P789012',
    address: '456 Oak Ave, Kennewick, WA',
    squareFeet: 2100,
    yearBuilt: 2004,
    value: '375000',
    landValue: '95000',
    coordinates: [46.2087, -119.1361]
  },
  {
    id: '3',
    parcelId: 'P345678',
    address: '789 Pine Ln, Pasco, WA',
    squareFeet: 3200,
    yearBuilt: 2012,
    value: '525000',
    landValue: '150000',
    coordinates: [46.2395, -119.1005]
  },
  {
    id: '4',
    parcelId: 'P901234',
    address: '567 Cedar Blvd, Richland, WA',
    squareFeet: 1800,
    yearBuilt: 1995,
    value: '320000',
    landValue: '85000',
    coordinates: [46.2750, -119.2800]
  },
  {
    id: '5',
    parcelId: 'P567890',
    address: '890 Elm St, Kennewick, WA',
    squareFeet: 2300,
    yearBuilt: 2008,
    value: '410000',
    landValue: '110000',
    coordinates: [46.2100, -119.1400]
  }
];

// Test component that uses the context
const TestComponent = () => {
  const {
    selectedProperties,
    selectProperty,
    unselectProperty,
    isPropertySelected,
    clearSelectedProperties,
    selectProperties,
    filterProperties,
    sortProperties,
    bulkOperation
  } = usePropertySelection();

  return (
    <div>
      <h1>Property Selection Test</h1>
      <button onClick={() => selectProperty(mockProperties[0])}>Select Property 1</button>
      <button onClick={() => selectProperty(mockProperties[1])}>Select Property 2</button>
      <button onClick={() => unselectProperty(mockProperties[0])}>Unselect Property 1</button>
      <button onClick={() => clearSelectedProperties()}>Clear Selection</button>
      <button onClick={() => selectProperties([mockProperties[2], mockProperties[3]])}>Select Multiple</button>
      <button onClick={() => filterProperties(p => parseInt(p.value || '0') > 400000)}>Filter Expensive</button>
      <button onClick={() => sortProperties((a, b) => parseInt(a.value || '0') - parseInt(b.value || '0'))}>Sort By Value</button>
      <button onClick={() => bulkOperation('remove', p => parseInt(p.value || '0') < 400000)}>Remove Cheaper</button>
      
      <div data-testid="selected-count">{selectedProperties.length}</div>
      <ul data-testid="selected-properties">
        {selectedProperties.map(property => (
          <li key={property.id} data-testid={`property-${property.id}`}>
            {property.address} - {property.value}
          </li>
        ))}
      </ul>
    </div>
  );
};

describe('Enhanced PropertySelectionContext', () => {
  
  test('should filter selected properties based on criteria', async () => {
    render(
      <PropertySelectionProvider maxSelectedProperties={10}>
        <TestComponent />
      </PropertySelectionProvider>
    );
    
    // Select all properties first
    fireEvent.click(screen.getByText('Select Property 1'));
    fireEvent.click(screen.getByText('Select Property 2'));
    fireEvent.click(screen.getByText('Select Multiple'));
    
    // Verify initial selection count
    expect(screen.getByTestId('selected-count').textContent).toBe('4');
    
    // Apply filter for expensive properties (>400000)
    fireEvent.click(screen.getByText('Filter Expensive'));
    
    // Verify filtered results (should have properties with value > 400000)
    expect(screen.getByTestId('selected-count').textContent).toBe('2');
    expect(screen.queryByText(/123 Main St/)).toBeInTheDocument();
    expect(screen.queryByText(/789 Pine Ln/)).toBeInTheDocument();
    expect(screen.queryByText(/456 Oak Ave/)).not.toBeInTheDocument();
  });
  
  test('should sort selected properties', async () => {
    render(
      <PropertySelectionProvider maxSelectedProperties={10}>
        <TestComponent />
      </PropertySelectionProvider>
    );
    
    // Select all properties first
    fireEvent.click(screen.getByText('Select Property 1'));
    fireEvent.click(screen.getByText('Select Property 2'));
    fireEvent.click(screen.getByText('Select Multiple'));
    
    // Sort by value (ascending)
    fireEvent.click(screen.getByText('Sort By Value'));
    
    // Get all property elements
    const propertyItems = screen.getAllByTestId(/property-/);
    
    // Check if they are sorted by value (ascending)
    expect(propertyItems[0].textContent).toContain('456 Oak Ave');
    expect(propertyItems[1].textContent).toContain('567 Cedar Blvd');
    expect(propertyItems[2].textContent).toContain('123 Main St');
    expect(propertyItems[3].textContent).toContain('789 Pine Ln');
  });
  
  test('should perform bulk operations on selected properties', async () => {
    render(
      <PropertySelectionProvider maxSelectedProperties={10}>
        <TestComponent />
      </PropertySelectionProvider>
    );
    
    // Select all properties first
    fireEvent.click(screen.getByText('Select Property 1'));
    fireEvent.click(screen.getByText('Select Property 2'));
    fireEvent.click(screen.getByText('Select Multiple'));
    
    // Verify initial selection count
    expect(screen.getByTestId('selected-count').textContent).toBe('4');
    
    // Remove cheaper properties (<400000)
    fireEvent.click(screen.getByText('Remove Cheaper'));
    
    // Verify result (should only have properties with value >= 400000)
    expect(screen.getByTestId('selected-count').textContent).toBe('2');
    expect(screen.queryByText(/123 Main St/)).toBeInTheDocument();
    expect(screen.queryByText(/789 Pine Ln/)).toBeInTheDocument();
    expect(screen.queryByText(/456 Oak Ave/)).not.toBeInTheDocument();
    expect(screen.queryByText(/567 Cedar Blvd/)).not.toBeInTheDocument();
  });
});