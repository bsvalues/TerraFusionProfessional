import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import ETLDashboard from '../components/ETLDashboard';
import { initializeETL } from '../services/etl';
import { Button } from '@/components/ui/button';
import { ShieldCheck, ArrowRight } from 'lucide-react';

/**
 * ETL Management page
 */
const ETLManagement: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Set page title and initialize ETL system
  useEffect(() => {
    document.title = "ETL Management - GeospatialAnalyzerBS";
    
    // Initialize ETL system if needed
    initializeETL();
    
    // Mark loading as complete
    setIsLoading(false);
  }, []);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">ETL Management</h1>
          <div className="flex space-x-4">
            <Link href="/schema-validation">
              <Button variant="outline" className="flex items-center">
                <ShieldCheck className="h-4 w-4 mr-2 text-primary" />
                Schema Validation
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
        <p className="text-gray-600">
          Manage ETL jobs, data sources, and transformations for property data processing.
        </p>
      </div>
      
      {/* ETL Dashboard */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <p>Initializing ETL system...</p>
        </div>
      ) : (
        <ETLDashboard />
      )}
    </div>
  );
};

export default ETLManagement;