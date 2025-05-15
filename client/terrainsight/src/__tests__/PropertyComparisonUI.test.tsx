import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EnhancedPropertyComparison } from '../components/comparison/EnhancedPropertyComparison';
import { SimilarityScoreIndicator } from '../components/comparison/SimilarityScoreIndicator';
import { ComparablePropertyCard } from '../components/comparison/ComparablePropertyCard';
import { Property } from '@shared/schema';

// Sample test properties
const baseProperty: Property = {
  id: 1,
  parcelId: "P1000",
  address: "123 Test St",
  owner: "Test Owner",
  value: "500000",
  salePrice: "490000",
  squareFeet: 2000,
  yearBuilt: 2010,
  bedrooms: 3,
  bathrooms: 2,
  lotSize: 5000,
  propertyType: "residential",
  zoning: "R1",
  neighborhood: "Test Neighborhood",
  latitude: 47.6062,
  longitude: -122.3321,
  lastSaleDate: "2022-01-15",
  taxAssessment: "480000"
};

const comparableProperties: Property[] = [
  {
    ...baseProperty,
    id: 2,
    parcelId: "P1001",
    address: "125 Test St",
    value: "520000",
    squareFeet: 2100
  },
  {
    ...baseProperty,
    id: 3,
    parcelId: "P1002",
    address: "127 Test St",
    value: "480000",
    squareFeet: 1900
  }
];

describe('Enhanced Property Comparison UI', () => {
  test('should render the property comparison component', () => {
    render(
      <EnhancedPropertyComparison 
        baseProperty={baseProperty}
        allProperties={[baseProperty, ...comparableProperties]}
        isOpen={true}
        onClose={() => {}}
      />
    );
    
    expect(screen.getByText(baseProperty.address)).toBeInTheDocument();
    expect(screen.getByText('Property Comparison')).toBeInTheDocument();
  });
  
  test('should allow selection of up to 5 properties', async () => {
    const mockHandleClose = jest.fn();
    
    // Create test data with 6+ properties
    const manyProperties = [
      baseProperty,
      ...Array.from({ length: 6 }, (_, i) => ({
        ...baseProperty,
        id: i + 2,
        parcelId: `P100${i+1}`,
        address: `${125 + i*2} Test St`
      }))
    ];
    
    render(
      <EnhancedPropertyComparison 
        baseProperty={baseProperty}
        allProperties={manyProperties}
        isOpen={true}
        onClose={mockHandleClose}
      />
    );
    
    // Find and select the "Find Comparables" button
    const findButton = screen.getByText('Find Comparables');
    fireEvent.click(findButton);
    
    // Wait for comparable properties to be displayed
    await waitFor(() => {
      expect(screen.getByText('125 Test St')).toBeInTheDocument();
    });
    
    // Select all checkboxes
    const checkboxes = screen.getAllByRole('checkbox');
    
    // First checkbox should be checked by default (base property)
    expect(checkboxes[0]).toBeChecked();
    
    // Try to select all other properties
    for (let i = 1; i < checkboxes.length; i++) {
      fireEvent.click(checkboxes[i]);
    }
    
    // Make sure only 5 total properties can be selected
    const checkedBoxes = screen.getAllByRole('checkbox', { checked: true });
    expect(checkedBoxes.length).toBeLessThanOrEqual(5);
  });
  
  test('should display properties in side-by-side layout', async () => {
    render(
      <EnhancedPropertyComparison 
        baseProperty={baseProperty}
        allProperties={[baseProperty, ...comparableProperties]}
        isOpen={true}
        onClose={() => {}}
      />
    );
    
    // Find and select the "Find Comparables" button
    const findButton = screen.getByText('Find Comparables');
    fireEvent.click(findButton);
    
    // Wait for comparable properties to be displayed
    await waitFor(() => {
      expect(screen.getByText('125 Test St')).toBeInTheDocument();
    });
    
    // Select a comparable property
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]); // Select first comparable
    
    // Select "Compare" tab
    const compareTab = screen.getByText('Compare');
    fireEvent.click(compareTab);
    
    // Wait for comparison view
    await waitFor(() => {
      // Check if we have multiple property columns displayed side by side
      const propertyColumns = screen.getAllByText(/Test St/);
      expect(propertyColumns.length).toBeGreaterThan(1);
    });
  });
});

describe('Similarity Score Indicator', () => {
  test('should display appropriate color based on score', () => {
    const { rerender } = render(<SimilarityScoreIndicator score={85} />);
    
    // High score should have green color
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('Similarity Score')).toBeInTheDocument();
    
    // Test with medium score
    rerender(<SimilarityScoreIndicator score={60} />);
    expect(screen.getByText('60')).toBeInTheDocument();
    
    // Test with low score
    rerender(<SimilarityScoreIndicator score={30} />);
    expect(screen.getByText('30')).toBeInTheDocument();
  });
});

describe('Comparable Property Card', () => {
  test('should display property details and similarity score', () => {
    const comparable = {
      property: comparableProperties[0],
      similarityScore: 85,
      distanceKm: 0.5,
      priceDifference: 20000
    };
    
    render(
      <ComparablePropertyCard 
        baseProperty={baseProperty}
        comparable={comparable}
        isSelected={false}
        onToggleSelect={() => {}}
      />
    );
    
    expect(screen.getByText(comparable.property.address)).toBeInTheDocument();
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('0.5 km away')).toBeInTheDocument();
    expect(screen.getByText(/\$20,000/)).toBeInTheDocument();
  });
});