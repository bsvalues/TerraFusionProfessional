import React from 'react';
import { SchemaValidationTool } from '@/components/etl/SchemaValidationTool';
import { Separator } from '@/components/ui/separator';
import { SchemaName } from '@/services/etl/SchemaValidationService';
import { BCPageLayout } from '@/components/ui/bc-page-layout';

/**
 * Schema Validation Page
 * 
 * This page provides a UI for validating data against predefined schemas
 * as part of the ETL validation pipeline.
 */
export function SchemaValidationPage() {
  return (
    <BCPageLayout
      heading="Schema Validation"
      description="Validate data against predefined schemas from the database"
      backgroundImage="/assets/Header-Vineyard-BC.png"
      logo={true}
    >
      <div className="space-y-6">
        <div className="bc-card">
          <div className="bc-card-content">
            <SchemaValidationTool />
          </div>
        </div>
        
        <Separator className="my-6" />
        
        <div className="space-y-4">
          <h2 className="bc-heading-2">About Schema Validation</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bc-card">
              <div className="bc-card-header">
                <h3 className="font-medium">What is Schema Validation?</h3>
              </div>
              <div className="bc-card-content">
                <p className="text-sm bc-text">
                  Schema validation ensures that data conforms to a predefined structure before it enters your system.
                  It helps identify data quality issues early in the ETL pipeline, preventing downstream errors and improving
                  data consistency.
                </p>
              </div>
            </div>
            
            <div className="bc-card">
              <div className="bc-card-header">
                <h3 className="font-medium">Available Schemas</h3>
              </div>
              <div className="bc-card-content">
                <p className="text-sm bc-text mb-2">
                  The following schemas are available for validation:
                </p>
                <ul className="text-sm list-disc list-inside space-y-1">
                  {Object.values(SchemaName).map((schema) => (
                    <li key={schema} className="bc-text-sm">{schema}</li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="bc-card">
              <div className="bc-card-header">
                <h3 className="font-medium">Benefits</h3>
              </div>
              <div className="bc-card-content">
                <ul className="text-sm list-disc list-inside space-y-1">
                  <li className="bc-text-sm">Prevent invalid data from entering your system</li>
                  <li className="bc-text-sm">Identify data quality issues early in the ETL process</li>
                  <li className="bc-text-sm">Ensure data consistency across your application</li>
                  <li className="bc-text-sm">Improve data reliability and reduce downstream errors</li>
                  <li className="bc-text-sm">Validate external data before importing</li>
                </ul>
              </div>
            </div>
            
            <div className="bc-card">
              <div className="bc-card-header">
                <h3 className="font-medium">How to Use</h3>
              </div>
              <div className="bc-card-content">
                <ol className="text-sm list-decimal list-inside space-y-1">
                  <li className="bc-text-sm">Select the schema that matches your data structure</li>
                  <li className="bc-text-sm">Paste your JSON data into the input field</li>
                  <li className="bc-text-sm">Configure validation options as needed</li>
                  <li className="bc-text-sm">Click "Validate" to check your data</li>
                  <li className="bc-text-sm">Review the validation results and address any issues</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BCPageLayout>
  );
}