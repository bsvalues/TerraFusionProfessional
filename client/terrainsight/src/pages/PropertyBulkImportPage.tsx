import React from 'react';
import PropertyBulkImport from '../components/etl/PropertyBulkImport';

/**
 * Property Bulk Import Page
 * 
 * This page provides an interface for bulk importing property data.
 */
const PropertyBulkImportPage: React.FC = () => {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col space-y-2 mb-6">
        <h1 className="text-3xl font-bold">Property Data Import</h1>
        <p className="text-gray-500">Bulk import property data to the system</p>
      </div>
      
      <PropertyBulkImport />
    </div>
  );
};

export default PropertyBulkImportPage;