import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NeighborhoodScoreCard } from '../components/neighborhood/NeighborhoodScoreCard';
import { NeighborhoodTimeline } from '../services/neighborhoodComparisonReportService';

// Mock the file-saver module
jest.mock('file-saver', () => ({
  saveAs: jest.fn(),
}));

// Sample test data
const mockNeighborhoods: NeighborhoodTimeline[] = [
  {
    id: 'n1',
    name: 'Richland Heights',
    growthRate: 5.2,
    data: [
      { year: '2020', value: 450000, percentChange: 4.2, transactionCount: 32 },
      { year: '2021', value: 472500, percentChange: 5.0, transactionCount: 45 },
      { year: '2022', value: 498000, percentChange: 5.4, transactionCount: 38 }
    ]
  },
  {
    id: 'n2',
    name: 'West Pasco',
    growthRate: 3.8,
    data: [
      { year: '2020', value: 320000, percentChange: 3.1, transactionCount: 27 },
      { year: '2021', value: 335000, percentChange: 4.7, transactionCount: 31 },
      { year: '2022', value: 347000, percentChange: 3.6, transactionCount: 24 }
    ]
  }
];

describe('NeighborhoodScoreCard Component', () => {
  test('renders with no selected neighborhoods', () => {
    render(
      <NeighborhoodScoreCard 
        neighborhoods={mockNeighborhoods} 
        selectedNeighborhoods={[]} 
      />
    );
    
    // Verify empty state message is displayed
    expect(screen.getByText(/No Neighborhoods Selected/i)).toBeInTheDocument();
  });
  
  test('displays score cards for selected neighborhoods', () => {
    render(
      <NeighborhoodScoreCard 
        neighborhoods={mockNeighborhoods} 
        selectedNeighborhoods={['n1', 'n2']} 
      />
    );
    
    // Verify neighborhood names are displayed
    expect(screen.getByText('Richland Heights')).toBeInTheDocument();
    expect(screen.getByText('West Pasco')).toBeInTheDocument();
    
    // Verify overall score section exists
    const overallScoreElements = screen.getAllByText(/Overall Score/i);
    expect(overallScoreElements.length).toBe(2);
  });
  
  test('toggles between visualization types', async () => {
    render(
      <NeighborhoodScoreCard 
        neighborhoods={mockNeighborhoods} 
        selectedNeighborhoods={['n1']} 
      />
    );
    
    // Check default view is card
    expect(screen.queryByText(/Radar chart visualization would display here/i)).not.toBeInTheDocument();
    
    // Switch to radar view
    fireEvent.click(screen.getByRole('button', { name: /radar/i }));
    
    // Verify radar view is displayed
    expect(screen.getByText(/Radar chart visualization would display here/i)).toBeInTheDocument();
    
    // Switch to bar view
    fireEvent.click(screen.getByRole('button', { name: /bar/i }));
    
    // Verify bar view is displayed
    expect(screen.getByText(/Bar chart visualization would display here/i)).toBeInTheDocument();
  });
  
  test('opens settings dialog when settings button is clicked', async () => {
    render(
      <NeighborhoodScoreCard 
        neighborhoods={mockNeighborhoods} 
        selectedNeighborhoods={['n1']} 
      />
    );
    
    // Open settings dialog
    fireEvent.click(screen.getByTestId('settings-button'));
    
    // Verify settings dialog content
    await waitFor(() => {
      expect(screen.getByText(/Customize Score Card/i)).toBeInTheDocument();
      expect(screen.getByText(/Metrics & Weights/i)).toBeInTheDocument();
    });
  });
});