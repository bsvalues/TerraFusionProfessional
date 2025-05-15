/**
 * Database Status Admin Page
 * 
 * This page displays the database status panel and provides
 * additional controls for administrators to manage the database.
 */

import React from 'react';
import DatabaseStatusPanel from '../../components/admin/DatabaseStatusPanel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { HomeIcon, DatabaseIcon, ShieldAlertIcon, CodeIcon } from 'lucide-react';

// Custom styles for Lucide icons to match Radix UI icons
const iconStyles = { className: 'h-4 w-4' };

export function DatabaseStatusPage() {
  return (
    <div className="container mx-auto p-4 md:p-6">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">
              <HomeIcon {...iconStyles} className="mr-1" />
              Home
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin">
              <ShieldAlertIcon {...iconStyles} className="mr-1" />
              Admin
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/database">
              <DatabaseIcon {...iconStyles} className="mr-1" />
              Database
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <div className="grid gap-6">
        <DatabaseStatusPanel />
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CodeIcon className="mr-2 h-5 w-5" />
              Supabase Integration Guide
            </CardTitle>
            <CardDescription>
              Instructions for configuring Supabase for production use
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <AlertTitle>Administrator Access Required</AlertTitle>
              <AlertDescription>
                These steps require administrator access to your Supabase project.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">1. Create Required Tables</h3>
                <p className="text-sm text-gray-500 mb-2">
                  If the status panel shows missing tables, copy the SQL script from the "SQL Script" tab
                  and execute it in the Supabase SQL Editor.
                </p>
                <ol className="list-decimal list-inside text-sm space-y-1 ml-2">
                  <li>Log in to your Supabase dashboard</li>
                  <li>Navigate to the SQL Editor</li>
                  <li>Paste the SQL script</li>
                  <li>Click "Run" to execute the script</li>
                  <li>Return to this page and refresh the status</li>
                </ol>
              </div>
              
              <div>
                <h3 className="text-lg font-medium">2. Verify Tables</h3>
                <p className="text-sm text-gray-500 mb-2">
                  After creating the tables, verify they appear in the Supabase Table Editor:
                </p>
                <ul className="list-disc list-inside text-sm ml-2">
                  <li>audit_records - Stores system audit logs</li>
                  <li>property_history_records - Stores property valuation history</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium">3. Set Up Row-Level Security (RLS)</h3>
                <p className="text-sm text-gray-500 mb-2">
                  For production environments, configure Row-Level Security policies:
                </p>
                <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
{`-- Enable RLS on tables
ALTER TABLE audit_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_history_records ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated read access to audit_records"
  ON audit_records FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated read/write access to property_history_records"
  ON property_history_records FOR ALL
  TO authenticated
  USING (true);`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default DatabaseStatusPage;