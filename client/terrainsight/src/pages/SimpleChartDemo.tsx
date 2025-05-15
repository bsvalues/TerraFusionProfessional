import React from 'react';
import SimpleBarChart from '../components/charts/SimpleBarChart';

const SimpleChartDemo: React.FC = () => {
  // Sample data
  const data = [150000, 175000, 185000, 200000, 225000];
  const labels = ['2021', '2022', '2023', '2024', '2025'];

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Property Value History (Simple Chart)</h1>
      <div className="max-w-2xl mx-auto">
        <SimpleBarChart 
          title="Historical Property Value" 
          data={data} 
          labels={labels} 
        />
      </div>
    </div>
  );
};

export default SimpleChartDemo;