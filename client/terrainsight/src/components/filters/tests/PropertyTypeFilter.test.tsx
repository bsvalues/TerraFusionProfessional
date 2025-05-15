import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PropertyTypeFilter } from '../PropertyTypeFilter';

describe('PropertyTypeFilter', () => {
  it('renders all property types', () => {
    render(
      <PropertyTypeFilter
        selectedTypes={[]}
        onChange={() => {}}
      />
    );
    
    expect(screen.getByText('Residential')).toBeInTheDocument();
    expect(screen.getByText('Commercial')).toBeInTheDocument();
    expect(screen.getByText('Industrial')).toBeInTheDocument();
    expect(screen.getByText('Agricultural')).toBeInTheDocument();
  });
  
  it('displays checked state for selected types', () => {
    render(
      <PropertyTypeFilter
        selectedTypes={['residential', 'commercial']}
        onChange={() => {}}
      />
    );
    
    // Check that the correct checkboxes are checked
    expect(screen.getByLabelText('Residential property type')).toBeChecked();
    expect(screen.getByLabelText('Commercial property type')).toBeChecked();
    expect(screen.getByLabelText('Industrial property type')).not.toBeChecked();
    expect(screen.getByLabelText('Agricultural property type')).not.toBeChecked();
  });
  
  it('calls onChange with added type when checkbox is checked', () => {
    const handleChange = jest.fn();
    
    render(
      <PropertyTypeFilter
        selectedTypes={['residential']}
        onChange={handleChange}
      />
    );
    
    // Check an unchecked checkbox
    fireEvent.click(screen.getByLabelText('Commercial property type'));
    
    // Should call with both residential and commercial
    expect(handleChange).toHaveBeenCalledWith(['residential', 'commercial']);
  });
  
  it('calls onChange with removed type when checkbox is unchecked', () => {
    const handleChange = jest.fn();
    
    render(
      <PropertyTypeFilter
        selectedTypes={['residential', 'commercial']}
        onChange={handleChange}
      />
    );
    
    // Uncheck a checked checkbox
    fireEvent.click(screen.getByLabelText('Residential property type'));
    
    // Should call with just commercial
    expect(handleChange).toHaveBeenCalledWith(['commercial']);
  });
  
  it('respects the disabled prop', () => {
    render(
      <PropertyTypeFilter
        selectedTypes={[]}
        onChange={() => {}}
        disabled={true}
      />
    );
    
    // All checkboxes should be disabled
    expect(screen.getByLabelText('Residential property type')).toBeDisabled();
    expect(screen.getByLabelText('Commercial property type')).toBeDisabled();
    expect(screen.getByLabelText('Industrial property type')).toBeDisabled();
    expect(screen.getByLabelText('Agricultural property type')).toBeDisabled();
  });
});