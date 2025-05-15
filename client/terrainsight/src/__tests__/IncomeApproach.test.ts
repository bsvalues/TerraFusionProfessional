import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { queryClient } from '../lib/queryClient';

// Define mock data for tests
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

const mockHotelMotelDetail = {
  incomeYear: '2024',
  supNum: 1,
  incomeId: 101,
  valueType: 'A',
  roomRevenue: '10950000',
  roomRevenuePct: '100.00',
  netOperatingIncome: '7117500',
  capRate: '9.50',
  incomeValue: '15000000'
};

const mockLeaseUp = {
  incomeLeaseUpId: 1,
  incomeYear: '2024',
  supNum: 1,
  incomeId: 101,
  frequency: 'A',
  leaseType: 'M',
  rentSqft: '25.00',
  rentTotal: '125000'
};

// Set up mock server
const server = setupServer(
  // Hotel/Motel endpoints
  rest.get('/api/income-hotel-motel/:incomeYear/:supNum/:incomeId', (req, res, ctx) => {
    const { incomeYear, supNum, incomeId } = req.params;
    if (incomeYear === '2024' && supNum === '1' && incomeId === '101') {
      return res(ctx.json(mockHotelMotel));
    }
    return res(ctx.status(404), ctx.json({ error: 'Income hotel/motel not found' }));
  }),
  
  rest.post('/api/income-hotel-motel', (req, res, ctx) => {
    // Assume all valid data for post request
    return res(ctx.status(201), ctx.json(mockHotelMotel));
  }),
  
  // Hotel/Motel Detail endpoints
  rest.get('/api/income-hotel-motel-details/:incomeYear/:supNum/:incomeId', (req, res, ctx) => {
    const { incomeYear, supNum, incomeId } = req.params;
    if (incomeYear === '2024' && supNum === '1' && incomeId === '101') {
      return res(ctx.json([mockHotelMotelDetail]));
    }
    return res(ctx.json([]));
  }),
  
  rest.post('/api/income-hotel-motel-detail', (req, res, ctx) => {
    return res(ctx.status(201), ctx.json(mockHotelMotelDetail));
  }),
  
  // Lease Up endpoints
  rest.get('/api/income-lease-ups/:incomeYear/:supNum/:incomeId', (req, res, ctx) => {
    const { incomeYear, supNum, incomeId } = req.params;
    if (incomeYear === '2024' && supNum === '1' && incomeId === '101') {
      return res(ctx.json([mockLeaseUp]));
    }
    return res(ctx.json([]));
  }),
  
  rest.post('/api/income-lease-up', (req, res, ctx) => {
    return res(ctx.status(201), ctx.json(mockLeaseUp));
  }),
  
  rest.delete('/api/income-lease-up/:id', (req, res, ctx) => {
    const { id } = req.params;
    if (id === '1') {
      return res(ctx.json({ success: true }));
    }
    return res(ctx.status(404), ctx.json({ error: 'Income lease up not found' }));
  })
);

// Enable API mocking before tests
beforeAll(() => server.listen());

// Reset any request handlers that we may add during the tests
afterEach(() => {
  server.resetHandlers();
  queryClient.clear();
});

// Clean up after the tests are finished
afterAll(() => server.close());

// Test suites
describe('Income Hotel/Motel API', () => {
  test('fetches hotel/motel data successfully', async () => {
    const response = await fetch('/api/income-hotel-motel/2024/1/101');
    expect(response.ok).toBe(true);
    
    const data = await response.json();
    expect(data).toEqual(mockHotelMotel);
  });
  
  test('creates hotel/motel data successfully', async () => {
    const response = await fetch('/api/income-hotel-motel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockHotelMotel)
    });
    
    expect(response.status).toBe(201);
    
    const data = await response.json();
    expect(data).toEqual(mockHotelMotel);
  });
  
  test('returns 404 for non-existent hotel/motel', async () => {
    const response = await fetch('/api/income-hotel-motel/2024/1/999');
    expect(response.ok).toBe(false);
    expect(response.status).toBe(404);
  });
});

describe('Income Hotel/Motel Detail API', () => {
  test('fetches hotel/motel details successfully', async () => {
    const response = await fetch('/api/income-hotel-motel-details/2024/1/101');
    expect(response.ok).toBe(true);
    
    const data = await response.json();
    expect(data).toEqual([mockHotelMotelDetail]);
  });
  
  test('creates hotel/motel detail successfully', async () => {
    const response = await fetch('/api/income-hotel-motel-detail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockHotelMotelDetail)
    });
    
    expect(response.status).toBe(201);
    
    const data = await response.json();
    expect(data).toEqual(mockHotelMotelDetail);
  });
  
  test('returns empty array for non-existent hotel/motel details', async () => {
    const response = await fetch('/api/income-hotel-motel-details/2024/1/999');
    expect(response.ok).toBe(true);
    
    const data = await response.json();
    expect(data).toEqual([]);
  });
});

describe('Income Lease Up API', () => {
  test('fetches lease ups successfully', async () => {
    const response = await fetch('/api/income-lease-ups/2024/1/101');
    expect(response.ok).toBe(true);
    
    const data = await response.json();
    expect(data).toEqual([mockLeaseUp]);
  });
  
  test('creates lease up successfully', async () => {
    const response = await fetch('/api/income-lease-up', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockLeaseUp)
    });
    
    expect(response.status).toBe(201);
    
    const data = await response.json();
    expect(data).toEqual(mockLeaseUp);
  });
  
  test('deletes lease up successfully', async () => {
    const response = await fetch('/api/income-lease-up/1', {
      method: 'DELETE'
    });
    
    expect(response.ok).toBe(true);
    
    const data = await response.json();
    expect(data).toEqual({ success: true });
  });
  
  test('returns empty array for non-existent lease ups', async () => {
    const response = await fetch('/api/income-lease-ups/2024/1/999');
    expect(response.ok).toBe(true);
    
    const data = await response.json();
    expect(data).toEqual([]);
  });
});