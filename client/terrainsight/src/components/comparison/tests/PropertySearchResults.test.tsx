import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PropertySearchResults } from '../PropertySearchResults';
import { Property } from '@/shared/types';

// Sample properties for testing
const mockProperties: Property[] = [
  {
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
  },
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

// Mock property similarity scores
const mockSimilarityScores = {
  'property-1': { total: 100, components: {} },
  'property-2': { total: 92, components: {} },
  'property-3': { total: 78, components: {} }
};

// Mock callback functions
const mockOnSelect = jest.fn();
const mockOnSelectAll = jest.fn();
const mockOnSelectTop = jest.fn();

describe('PropertySearchResults Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders property results with correct data', () => {
    render(
      <PropertySearchResults
        properties={mockProperties}
        similarityScores={mockSimilarityScores}
        onSelect={mockOnSelect}
        onSelectAll={mockOnSelectAll}
        onSelectTop={mockOnSelectTop}
        selectedProperties={[]}
      />
    );

    // Check that all properties are rendered
    expect(screen.getByText('123 Main St, Benton County, WA')).toBeInTheDocument();
    expect(screen.getByText('125 Main St, Benton County, WA')).toBeInTheDocument();
    expect(screen.getByText('130 Oak Ave, Benton County, WA')).toBeInTheDocument();
    
    // Check that similarity scores are displayed
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('92%')).toBeInTheDocument();
    expect(screen.getByText('78%')).toBeInTheDocument();
  });

  test('sorts results correctly by various criteria', () => {
    render(
      <PropertySearchResults
        properties={mockProperties}
        similarityScores={mockSimilarityScores}
        onSelect={mockOnSelect}
        onSelectAll={mockOnSelectAll}
        onSelectTop={mockOnSelectTop}
        selectedProperties={[]}
      />
    );

    // Initially sorted by similarity (default)
    let rows = screen.getAllByRole('row').slice(1); // Skip header row
    expect(rows[0]).toHaveTextContent('123 Main St');
    expect(rows[1]).toHaveTextContent('125 Main St');
    expect(rows[2]).toHaveTextContent('130 Oak Ave');
    
    // Sort by square footage (ascending)
    fireEvent.click(screen.getByText('Square Feet'));
    rows = screen.getAllByRole('row').slice(1);
    expect(rows[0]).toHaveTextContent('123 Main St'); // 2200 sq ft
    expect(rows[1]).toHaveTextContent('125 Main St'); // 2250 sq ft
    expect(rows[2]).toHaveTextContent('130 Oak Ave'); // 2600 sq ft
    
    // Click again to sort descending
    fireEvent.click(screen.getByText('Square Feet'));
    rows = screen.getAllByRole('row').slice(1);
    expect(rows[0]).toHaveTextContent('130 Oak Ave'); // 2600 sq ft
    expect(rows[1]).toHaveTextContent('125 Main St'); // 2250 sq ft
    expect(rows[2]).toHaveTextContent('123 Main St'); // 2200 sq ft
  });

  test('filters results correctly', () => {
    render(
      <PropertySearchResults
        properties={mockProperties}
        similarityScores={mockSimilarityScores}
        onSelect={mockOnSelect}
        onSelectAll={mockOnSelectAll}
        onSelectTop={mockOnSelectTop}
        selectedProperties={[]}
      />
    );

    // Filter by address
    fireEvent.change(screen.getByPlaceholderText('Filter results...'), { 
      target: { value: 'Oak' } 
    });
    
    // Should only show the Oak Ave property
    expect(screen.queryByText('123 Main St, Benton County, WA')).not.toBeInTheDocument();
    expect(screen.queryByText('125 Main St, Benton County, WA')).not.toBeInTheDocument();
    expect(screen.getByText('130 Oak Ave, Benton County, WA')).toBeInTheDocument();
  });

  test('allows selection of properties from results', () => {
    render(
      <PropertySearchResults
        properties={mockProperties}
        similarityScores={mockSimilarityScores}
        onSelect={mockOnSelect}
        onSelectAll={mockOnSelectAll}
        onSelectTop={mockOnSelectTop}
        selectedProperties={[]}
      />
    );

    // Select the second property
    const selectButtons = screen.getAllByText('Add to Comparison');
    fireEvent.click(selectButtons[1]);
    
    // Check that the correct property was selected
    expect(mockOnSelect).toHaveBeenCalledWith(mockProperties[1]);
  });

  test('disables selection if property is already selected', () => {
    render(
      <PropertySearchResults
        properties={mockProperties}
        similarityScores={mockSimilarityScores}
        onSelect={mockOnSelect}
        onSelectAll={mockOnSelectAll}
        onSelectTop={mockOnSelectTop}
        selectedProperties={[mockProperties[0]]}
      />
    );

    // First property should show as already added
    expect(screen.getByText('Already Added')).toBeInTheDocument();
    
    // The button for the first property should be disabled
    const buttons = screen.getAllByRole('button', { name: /Add to Comparison|Already Added/i });
    expect(buttons[0]).toBeDisabled();
    expect(buttons[1]).not.toBeDisabled();
    expect(buttons[2]).not.toBeDisabled();
  });

  test('supports bulk selection actions', () => {
    render(
      <PropertySearchResults
        properties={mockProperties}
        similarityScores={mockSimilarityScores}
        onSelect={mockOnSelect}
        onSelectAll={mockOnSelectAll}
        onSelectTop={mockOnSelectTop}
        selectedProperties={[]}
      />
    );

    // Select all properties
    fireEvent.click(screen.getByText('Select All'));
    expect(mockOnSelectAll).toHaveBeenCalledWith(mockProperties);
    
    // Select top 2 properties
    fireEvent.click(screen.getByText('Select Top'));
    const topSelect = screen.getByRole('combobox');
    fireEvent.change(topSelect, { target: { value: '2' } });
    fireEvent.click(screen.getByText('Apply'));
    
    expect(mockOnSelectTop).toHaveBeenCalledWith(2);
  });

  test('shows appropriate loading states during search', () => {
    render(
      <PropertySearchResults
        properties={[]}
        similarityScores={{}}
        onSelect={mockOnSelect}
        onSelectAll={mockOnSelectAll}
        onSelectTop={mockOnSelectTop}
        selectedProperties={[]}
        isLoading={true}
      />
    );

    // Should show loading indicator
    expect(screen.getByText('Searching for comparable properties...')).toBeInTheDocument();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('displays empty state when no results are found', () => {
    render(
      <PropertySearchResults
        properties={[]}
        similarityScores={{}}
        onSelect={mockOnSelect}
        onSelectAll={mockOnSelectAll}
        onSelectTop={mockOnSelectTop}
        selectedProperties={[]}
        isLoading={false}
      />
    );

    // Should show empty state message
    expect(screen.getByText('No comparable properties found')).toBeInTheDocument();
  });
});