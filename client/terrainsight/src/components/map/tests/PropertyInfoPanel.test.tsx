import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PropertyInfoPanel } from '../PropertyInfoPanel';
import { Property } from '@/shared/types';

// Mock the neighborhoodService
jest.mock('@/services/neighborhoodService', () => ({
  __esModule: true,
  default: {
    getNeighborhoodData: jest.fn().mockResolvedValue({
      name: 'Test Neighborhood',
      overview: {
        description: 'A test neighborhood',
        type: 'Residential',
        ratings: {
          overall: 85,
          safety: 80,
          schools: 90,
          amenities: 75,
          costOfLiving: 70,
          outdoorActivities: 85,
        },
      },
      // Other required fields would be added here
    }),
  },
  NeighborhoodData: jest.fn(),
}));

// Mock the NeighborhoodContext
jest.mock('../../../components/neighborhood/NeighborhoodContext', () => ({
  useNeighborhood: () => ({
    currentNeighborhoodData: {
      name: 'Test Neighborhood',
      overview: {
        description: 'A test neighborhood',
        type: 'Residential',
        ratings: {
          overall: 85,
          safety: 80,
          schools: 90,
          amenities: 75,
          costOfLiving: 70,
          outdoorActivities: 85,
        },
      },
      // Other required fields would be added here
    },
    loadNeighborhoodData: jest.fn().mockResolvedValue({}),
    isLoading: false,
    error: null,
  }),
}));

const mockProperty: Property = {
  id: 'prop1',
  parcelId: '12345',
  address: '123 Test Street',
  owner: 'Test Owner',
  value: '350000',
  salePrice: '345000',
  squareFeet: 2000,
  yearBuilt: 1995,
  landValue: '85000',
  coordinates: [46.23, -119.15],
};

describe('PropertyInfoPanel', () => {
  test('renders empty state when no property is selected', () => {
    render(<PropertyInfoPanel property={null} />);
    
    expect(screen.getByText(/No property selected/i)).toBeInTheDocument();
  });
  
  test('renders property details when a property is selected', () => {
    render(<PropertyInfoPanel property={mockProperty} />);
    
    expect(screen.getByText(mockProperty.address)).toBeInTheDocument();
    expect(screen.getByText(mockProperty.parcelId)).toBeInTheDocument();
    expect(screen.getByText(/Test Owner/i)).toBeInTheDocument();
    expect(screen.getByText(/\$350,000/i)).toBeInTheDocument();
    expect(screen.getByText(/2,000 sqft/i)).toBeInTheDocument();
    expect(screen.getByText(/1995/i)).toBeInTheDocument();
  });
  
  test('displays neighborhood information', () => {
    render(<PropertyInfoPanel property={mockProperty} />);
    
    expect(screen.getByText(/Test Neighborhood/i)).toBeInTheDocument();
    expect(screen.getByText(/Residential/i)).toBeInTheDocument();
  });
  
  test('calls onClose when close button is clicked', () => {
    const mockOnClose = jest.fn();
    render(<PropertyInfoPanel property={mockProperty} onClose={mockOnClose} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
  
  test('renders actions for selected property', () => {
    render(<PropertyInfoPanel property={mockProperty} />);
    
    expect(screen.getByText(/View Details/i)).toBeInTheDocument();
    expect(screen.getByText(/Neighborhood Insights/i)).toBeInTheDocument();
  });
});