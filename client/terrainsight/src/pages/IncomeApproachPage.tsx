/**
 * IncomeApproachPage.tsx
 * 
 * Page for income approach to property valuation
 * Integrates the IncomeApproachDashboard component
 */

import React from 'react';
import { IncomeApproachDashboard } from '../components/income/IncomeApproachDashboard';

export const IncomeApproachPage: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <IncomeApproachDashboard />
    </div>
  );
};

export default IncomeApproachPage;