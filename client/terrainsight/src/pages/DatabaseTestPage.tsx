/**
 * DatabaseTestPage.tsx
 * 
 * A page for testing database connections
 */

import React from 'react';
import { DatabaseImportForm } from '../components/etl/DatabaseImportForm';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

const DatabaseTestPage: React.FC = () => {
  const handleImportComplete = (properties: any[]) => {
    toast({
      title: 'Import Complete',
      description: `Successfully imported ${properties.length} properties.`,
    });
    
    console.log('Imported properties:', properties);
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Database Connection Test</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Database Import Test</CardTitle>
          <CardDescription>
            Test importing property data from external databases.
            This page demonstrates the functionality to connect to SQL Server and ODBC data sources.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DatabaseImportForm onImportComplete={handleImportComplete} />
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseTestPage;