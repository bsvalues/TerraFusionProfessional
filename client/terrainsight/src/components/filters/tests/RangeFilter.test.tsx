import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { RangeFilter } from '../RangeFilter';
import { formatCurrency } from '@/lib/utils';

// Mock debounce to execute immediately in tests
jest.mock('@/lib/utils', () => ({
  debounce: (fn: Function) => fn,
  formatCurrency: jest.fn((val) => `$${val.toLocaleString()}`),
}));

describe('RangeFilter', () => {
  it('renders with correct label and range values', () => {
    render(
      <RangeFilter
        label="Price Range"
        min={100000}
        max={1000000}
        value={[200000, 800000]}
        onChange={() => {}}
        formatValue={formatCurrency}
      />
    );
    
    expect(screen.getByText('Price Range')).toBeInTheDocument();
  });
  
  it('displays formatted min and max values', () => {
    render(
      <RangeFilter
        label="Price Range"
        min={100000}
        max={1000000}
        value={[200000, 800000]}
        onChange={() => {}}
        formatValue={formatCurrency}
      />
    );
    
    expect(screen.getByLabelText('Minimum Price Range')).toHaveValue('$200,000');
    expect(screen.getByLabelText('Maximum Price Range')).toHaveValue('$800,000');
  });
  
  it('calls onChange when slider is moved', () => {
    const handleChange = jest.fn();
    
    render(
      <RangeFilter
        label="Price Range"
        min={100000}
        max={1000000}
        value={[200000, 800000]}
        onChange={handleChange}
        formatValue={formatCurrency}
      />
    );
    
    const slider = screen.getByLabelText('Price Range range slider');
    
    // Mock a slider change
    fireEvent.change(slider, { target: { value: [300000, 700000] } });
    
    expect(handleChange).toHaveBeenCalledWith([300000, 700000]);
  });
  
  it('updates min input when user types a new value', () => {
    const handleChange = jest.fn();
    
    render(
      <RangeFilter
        label="Price Range"
        min={100000}
        max={1000000}
        value={[200000, 800000]}
        onChange={handleChange}
        formatValue={formatCurrency}
      />
    );
    
    const minInput = screen.getByLabelText('Minimum Price Range');
    
    // Clear and type a new value
    fireEvent.change(minInput, { target: { value: '$300,000' } });
    
    expect(handleChange).toHaveBeenCalledWith([300000, 800000]);
  });
  
  it('updates max input when user types a new value', () => {
    const handleChange = jest.fn();
    
    render(
      <RangeFilter
        label="Price Range"
        min={100000}
        max={1000000}
        value={[200000, 800000]}
        onChange={handleChange}
        formatValue={formatCurrency}
      />
    );
    
    const maxInput = screen.getByLabelText('Maximum Price Range');
    
    // Clear and type a new value
    fireEvent.change(maxInput, { target: { value: '$700,000' } });
    
    expect(handleChange).toHaveBeenCalledWith([200000, 700000]);
  });
  
  it('clamps input values to the allowed range', () => {
    const handleChange = jest.fn();
    
    render(
      <RangeFilter
        label="Price Range"
        min={100000}
        max={1000000}
        value={[200000, 800000]}
        onChange={handleChange}
        formatValue={formatCurrency}
      />
    );
    
    const minInput = screen.getByLabelText('Minimum Price Range');
    const maxInput = screen.getByLabelText('Maximum Price Range');
    
    // Try to set min below allowed range
    fireEvent.change(minInput, { target: { value: '$50,000' } });
    fireEvent.blur(minInput);
    
    // Try to set max above allowed range
    fireEvent.change(maxInput, { target: { value: '$1,500,000' } });
    fireEvent.blur(maxInput);
    
    expect(handleChange).toHaveBeenCalledWith([100000, 800000]);
    expect(handleChange).toHaveBeenCalledWith([200000, 1000000]);
  });
  
  it('respects the disabled prop', () => {
    render(
      <RangeFilter
        label="Price Range"
        min={100000}
        max={1000000}
        value={[200000, 800000]}
        onChange={() => {}}
        disabled={true}
      />
    );
    
    expect(screen.getByLabelText('Price Range range slider')).toBeDisabled();
    expect(screen.getByLabelText('Minimum Price Range')).toBeDisabled();
    expect(screen.getByLabelText('Maximum Price Range')).toBeDisabled();
  });
});