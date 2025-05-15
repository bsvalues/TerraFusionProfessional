import React, { useState, useEffect } from 'react';
import { KPIDashboard } from './kpi/KPIDashboard';
import { Property } from '@shared/schema';

interface KPIDashboardPanelProps {
  className?: string;
  taxYear?: string;
}

/**
 * Panel component for the KPI Dashboard to be included in the main Dashboard
 */
export const KPIDashboardPanel: React.FC<KPIDashboardPanelProps> = ({ 
  className = '', 
  taxYear = '2024'
}) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch properties when panel is loaded
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/properties');
        const data = await response.json();
        setProperties(data);
      } catch (error) {
        console.error('Error fetching properties:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProperties();
  }, []);
  
  return (
    <div className={`${className} p-6 h-full overflow-visible`}>
      <h2 className="text-2xl font-semibold mb-6">Key Performance Indicators</h2>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-primary">Loading KPI data...</div>
        </div>
      ) : (
        <KPIDashboard properties={properties} taxYear={taxYear} />
      )}
    </div>
  );
};