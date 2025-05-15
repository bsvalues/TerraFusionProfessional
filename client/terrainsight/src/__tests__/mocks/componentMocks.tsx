import React from 'react';

// Mock for the Header component
export const Header: React.FC<{ taxYear: string; onTaxYearChange: (year: string) => void }> = ({ taxYear, onTaxYearChange }) => {
  return <div data-testid="mock-header">Header Component Mock</div>;
};

// Mock for the Welcome component
export const Welcome: React.FC = () => {
  return <div data-testid="mock-welcome">Welcome Component Mock</div>;
};