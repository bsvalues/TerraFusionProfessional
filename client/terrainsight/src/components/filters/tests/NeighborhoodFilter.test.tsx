import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NeighborhoodFilter } from '../NeighborhoodFilter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the API request
jest.mock('@/lib/queryClient', () => ({
  apiRequest: jest.fn().mockResolvedValue([
    { id: 'downtown', name: 'Downtown', count: 34 },
    { id: 'east_side', name: 'East Side', count: 28 },
    { id: 'west_hills', name: 'West Hills', count: 42 }
  ]),
  queryClient: new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  }),
}));

// Testing wrapper with query client
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('NeighborhoodFilter', () => {
  it('displays a message when no neighborhoods are selected', () => {
    render(
      <NeighborhoodFilter
        selectedNeighborhoods={[]}
        onChange={() => {}}
      />,
      { wrapper: createWrapper() }
    );
    
    expect(screen.getByText('No neighborhoods selected')).toBeInTheDocument();
  });
  
  it('displays selected neighborhoods as badges', () => {
    render(
      <NeighborhoodFilter
        selectedNeighborhoods={['downtown', 'east_side']}
        onChange={() => {}}
      />,
      { wrapper: createWrapper() }
    );
    
    expect(screen.getByText('Downtown')).toBeInTheDocument();
    expect(screen.getByText('East Side')).toBeInTheDocument();
  });
  
  it('allows removing a neighborhood by clicking the X button', () => {
    const handleChange = jest.fn();
    
    render(
      <NeighborhoodFilter
        selectedNeighborhoods={['downtown', 'east_side']}
        onChange={handleChange}
      />,
      { wrapper: createWrapper() }
    );
    
    fireEvent.click(screen.getByLabelText('Remove Downtown'));
    
    expect(handleChange).toHaveBeenCalledWith(['east_side']);
  });
  
  it('respects the disabled prop', () => {
    render(
      <NeighborhoodFilter
        selectedNeighborhoods={['downtown']}
        onChange={() => {}}
        disabled={true}
      />,
      { wrapper: createWrapper() }
    );
    
    expect(screen.getByLabelText('Remove Downtown')).toBeDisabled();
    expect(screen.getByLabelText('Select a neighborhood')).toBeDisabled();
  });
  
  it('shows loading state when fetching neighborhoods', async () => {
    // Override the API mock to simulate loading
    jest.mock('@/lib/queryClient', () => ({
      apiRequest: () => new Promise(() => {}), // Never resolves to simulate loading
      queryClient: new QueryClient(),
    }));
    
    render(
      <NeighborhoodFilter
        selectedNeighborhoods={[]}
        onChange={() => {}}
      />,
      { wrapper: createWrapper() }
    );
    
    // Open the dropdown to trigger the API call
    fireEvent.click(screen.getByLabelText('Select a neighborhood'));
    
    // Check for loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});