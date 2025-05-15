import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import IncomeTestPage from '../pages/income-test';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

// Mock data
const mockHotelMotel = {
  incomeYear: '2024',
  supNum: 1,
  incomeId: 101,
  sizeInSqft: '25000',
  averageDailyRoomRate: '150.00',
  numberOfRooms: '200',
  numberOfRoomNights: '73000',
  incomeValueReconciled: '15000000',
  incomeValuePerRoom: '75000',
  assessmentValuePerRoom: '70000',
  incomeValuePerSqft: '600',
  assessmentValuePerSqft: '580'
};

const mockHotelMotelDetails = [
  {
    incomeYear: '2024',
    supNum: 1,
    incomeId: 101,
    valueType: 'A',
    roomRevenue: '10950000',
    roomRevenuePct: '100.00',
    netOperatingIncome: '7117500',
    capRate: '9.50',
    incomeValue: '15000000'
  }
];

const mockLeaseUps = [
  {
    incomeLeaseUpId: 1,
    incomeYear: '2024',
    supNum: 1,
    incomeId: 101,
    frequency: 'A',
    leaseType: 'M',
    rentSqft: '25.00',
    rentTotal: '125000'
  }
];

// Set up mock server
const server = setupServer(
  // Hotel/Motel endpoints
  rest.get('/api/income-hotel-motel/:incomeYear/:supNum/:incomeId', (req, res, ctx) => {
    return res(ctx.json(mockHotelMotel));
  }),
  
  rest.post('/api/income-hotel-motel', (req, res, ctx) => {
    return res(ctx.status(201), ctx.json(mockHotelMotel));
  }),
  
  // Hotel/Motel Detail endpoints
  rest.get('/api/income-hotel-motel-details/:incomeYear/:supNum/:incomeId', (req, res, ctx) => {
    return res(ctx.json(mockHotelMotelDetails));
  }),
  
  rest.post('/api/income-hotel-motel-detail', (req, res, ctx) => {
    return res(ctx.status(201), ctx.json(mockHotelMotelDetails[0]));
  }),
  
  // Lease Up endpoints
  rest.get('/api/income-lease-ups/:incomeYear/:supNum/:incomeId', (req, res, ctx) => {
    return res(ctx.json(mockLeaseUps));
  }),
  
  rest.post('/api/income-lease-up', (req, res, ctx) => {
    return res(ctx.status(201), ctx.json(mockLeaseUps[0]));
  }),
  
  rest.delete('/api/income-lease-up/:id', (req, res, ctx) => {
    return res(ctx.json({ success: true }));
  })
);

// Enable API mocking before tests
beforeAll(() => server.listen());

// Reset any request handlers that we may add during the tests
afterEach(() => server.resetHandlers());

// Clean up after the tests are finished
afterAll(() => server.close());

describe('Income Test Page', () => {
  test('renders the income test page with tabs', () => {
    render(<IncomeTestPage />);
    
    // Check if page title is rendered
    expect(screen.getByText('Income Approach Grouping - Test Page')).toBeInTheDocument();
    
    // Check if tabs are rendered
    expect(screen.getByRole('tab', { name: /hotel\/motel/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /hotel\/motel detail/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /lease up/i })).toBeInTheDocument();
    
    // Check if input fields are rendered
    expect(screen.getByLabelText(/income year/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/supplement number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/income id/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/value type/i)).toBeInTheDocument();
  });
  
  test('creates and retrieves hotel/motel data', async () => {
    render(<IncomeTestPage />);
    
    // Click create button
    fireEvent.click(screen.getByRole('button', { name: /create hotel\/motel/i }));
    
    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText(/hotel\/motel data created successfully/i)).toBeInTheDocument();
    });
    
    // Now test retrieval
    fireEvent.click(screen.getByRole('button', { name: /get hotel\/motel/i }));
    
    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText(/hotel\/motel data fetched successfully/i)).toBeInTheDocument();
    });
    
    // Verify data is displayed
    expect(screen.getByText(new RegExp(mockHotelMotel.sizeInSqft, 'i'))).toBeInTheDocument();
  });
  
  test('switches between tabs', async () => {
    render(<IncomeTestPage />);
    
    // Initially Hotel/Motel tab should be active
    expect(screen.getByRole('button', { name: /create hotel\/motel/i })).toBeInTheDocument();
    
    // Click the Hotel/Motel Detail tab
    fireEvent.click(screen.getByRole('tab', { name: /hotel\/motel detail/i }));
    
    // Hotel/Motel Detail tab content should be visible
    expect(screen.getByRole('button', { name: /create detail/i })).toBeInTheDocument();
    
    // Click the Lease Up tab
    fireEvent.click(screen.getByRole('tab', { name: /lease up/i }));
    
    // Lease Up tab content should be visible
    expect(screen.getByRole('button', { name: /create lease up/i })).toBeInTheDocument();
  });
  
  test('handles API errors gracefully', async () => {
    // Override the default handler for this test to simulate an error
    server.use(
      rest.post('/api/income-hotel-motel', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Server error' }));
      })
    );
    
    render(<IncomeTestPage />);
    
    // Click create button
    fireEvent.click(screen.getByRole('button', { name: /create hotel\/motel/i }));
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/error: server error/i)).toBeInTheDocument();
    });
  });
});