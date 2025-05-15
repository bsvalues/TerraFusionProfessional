import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PropertyComparisonTool } from '@/components/comparison/PropertyComparisonTool';
import { Property } from '@/shared/types';

// Sample test data
const mockProperties: Property[] = [
  {
    id: '1',
    parcelId: 'P123456',
    address: '123 Main St, Kennewick, WA',
    owner: 'John Doe',
    value: '350000',
    squareFeet: 2200,
    yearBuilt: 2005,
    landValue: '100000',
    coordinates: [46.2, -119.1]
  },
  {
    id: '2',
    parcelId: 'P234567',
    address: '456 Oak Ave, Richland, WA',
    owner: 'Jane Smith',
    value: '425000',
    squareFeet: 2600,
    yearBuilt: 2010,
    landValue: '120000',
    coordinates: [46.25, -119.15]
  },
  {
    id: '3',
    parcelId: 'P345678',
    address: '789 Pine Ln, Pasco, WA',
    owner: 'Robert Johnson',
    value: '525000',
    squareFeet: 3200,
    yearBuilt: 2012,
    landValue: '150000',
    coordinates: [46.23, -119.1]
  }
];

// Mock formatCurrency utility
jest.mock('@/lib/utils', () => ({
  cn: jest.fn().mockImplementation((...inputs) => inputs.join(' ')),
  formatCurrency: jest.fn().mockImplementation((value) => `$${value}`),
}));

describe('PropertyComparisonTool', () => {
  const onCloseMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders comparison tool with correct number of properties', () => {
    render(
      <PropertyComparisonTool
        properties={mockProperties}
        onClose={onCloseMock}
      />
    );
    
    // Check title
    expect(screen.getByText(/property comparison/i)).toBeInTheDocument();
    
    // Check for all property addresses
    expect(screen.getByText('123 Main St, Kennewick, WA')).toBeInTheDocument();
    expect(screen.getByText('456 Oak Ave, Richland, WA')).toBeInTheDocument();
    expect(screen.getByText('789 Pine Ln, Pasco, WA')).toBeInTheDocument();
  });

  test('calls onClose when close button is clicked', () => {
    render(
      <PropertyComparisonTool
        properties={mockProperties}
        onClose={onCloseMock}
      />
    );
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  test('displays property metrics in the table', () => {
    render(
      <PropertyComparisonTool
        properties={mockProperties}
        onClose={onCloseMock}
      />
    );
    
    // Check for key metrics
    expect(screen.getByText(/sale price/i)).toBeInTheDocument();
    expect(screen.getByText(/year built/i)).toBeInTheDocument();
    expect(screen.getByText(/square footage/i)).toBeInTheDocument();
    
    // Check for property values being displayed
    expect(screen.getAllByText(/\$350000/)).toHaveLength(1);
    expect(screen.getAllByText(/\$425000/)).toHaveLength(1);
    expect(screen.getAllByText(/\$525000/)).toHaveLength(1);
  });

  test('filters comparables when search is applied', () => {
    render(
      <PropertyComparisonTool
        properties={mockProperties}
        onClose={onCloseMock}
      />
    );
    
    // Find the search input
    const searchInput = screen.getByPlaceholderText(/search metrics/i);
    fireEvent.change(searchInput, { target: { value: 'square' } });
    
    // After filtering, only square footage metric should be visible
    expect(screen.getByText(/square footage/i)).toBeInTheDocument();
    expect(screen.queryByText(/sale price/i)).not.toBeInTheDocument();
  });

  test('exports comparison data when export button is clicked', () => {
    // Mock the document.createElement to track created links
    const mockCreateElement = jest.spyOn(document, 'createElement');
    mockCreateElement.mockImplementation((tagName) => {
      if (tagName === 'a') {
        return {
          setAttribute: jest.fn(),
          style: {},
          click: jest.fn(),
          remove: jest.fn(),
        } as unknown as HTMLAnchorElement;
      }
      return document.createElement(tagName);
    });
    
    render(
      <PropertyComparisonTool
        properties={mockProperties}
        onClose={onCloseMock}
      />
    );
    
    // Find export button
    const exportButton = screen.getByRole('button', { name: /export/i });
    fireEvent.click(exportButton);
    
    // Check if an anchor was created for the download
    expect(mockCreateElement).toHaveBeenCalledWith('a');
    
    // Cleanup
    mockCreateElement.mockRestore();
  });
});