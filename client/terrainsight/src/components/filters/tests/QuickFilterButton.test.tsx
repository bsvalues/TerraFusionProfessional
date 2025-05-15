import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuickFilterButton, QuickFilter } from '../QuickFilterButton';

const sampleFilter: QuickFilter = {
  id: 'high-value',
  name: 'High Value',
  description: 'Properties with value over $500,000',
  filter: {
    valueRange: [500000, 10000000],
    propertyTypes: []
  }
};

describe('QuickFilterButton', () => {
  it('renders with correct name', () => {
    render(
      <QuickFilterButton
        filter={sampleFilter}
        onClick={() => {}}
      />
    );
    
    expect(screen.getByRole('button')).toHaveTextContent('High Value');
  });
  
  it('calls onClick with filter object when clicked', () => {
    const handleClick = jest.fn();
    
    render(
      <QuickFilterButton
        filter={sampleFilter}
        onClick={handleClick}
      />
    );
    
    fireEvent.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledWith(sampleFilter.filter);
  });
  
  it('applies active styling when active prop is true', () => {
    render(
      <QuickFilterButton
        filter={sampleFilter}
        onClick={() => {}}
        active={true}
      />
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveClass('font-semibold');
  });
  
  it('applies inactive styling when active prop is false', () => {
    render(
      <QuickFilterButton
        filter={sampleFilter}
        onClick={() => {}}
        active={false}
      />
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(button).toHaveClass('font-normal');
  });
  
  it('respects the disabled prop', () => {
    render(
      <QuickFilterButton
        filter={sampleFilter}
        onClick={() => {}}
        disabled={true}
      />
    );
    
    expect(screen.getByRole('button')).toBeDisabled();
  });
});