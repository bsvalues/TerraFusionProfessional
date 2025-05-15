/**
 * Database Status Panel
 * 
 * This component displays the status of both local PostgreSQL and Supabase
 * database connections and provides tools for troubleshooting and setup.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  DatabaseIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  AlertTriangleIcon, 
  RefreshCcwIcon, 
  CodeIcon,
  ClipboardIcon 
} from 'lucide-react';

interface DatabaseStatus {
  isConnected: boolean;
  tables: {
    property_history_records: boolean;
    audit_records: boolean;
  };
  error: string | null;
  sqlScript: string | null;
}

const DatabaseStatusPanel: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [localStatus, setLocalStatus] = useState<DatabaseStatus | null>(null);
  const [supabaseStatus, setSupabaseStatus] = useState<DatabaseStatus | null>(null);
  const { toast } = useToast();

  const fetchDatabaseStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/database/status');
      if (!response.ok) {
        throw new Error('Failed to fetch database status');
      }
      
      const data = await response.json();
      setLocalStatus(data.local);
      setSupabaseStatus(data.supabase);
    } catch (error) {
      console.error('Error fetching database status:', error);
      toast({
        title: 'Error',
        description: 'Failed to load database status',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabaseStatus();
    // Refresh status every 60 seconds
    const interval = setInterval(fetchDatabaseStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: 'SQL script copied to clipboard',
    });
  };

  const renderStatusBadge = (isConnected: boolean) => {
    if (isConnected) {
      return <Badge variant="success" className="ml-2">Connected</Badge>;
    }
    return <Badge variant="error" className="ml-2">Disconnected</Badge>;
  };

  const renderTableStatus = (tableExists: boolean) => {
    if (tableExists) {
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    }
    return <XCircleIcon className="h-5 w-5 text-red-500" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <DatabaseIcon className="mr-2 h-5 w-5" />
          Database Status
        </CardTitle>
        <CardDescription>
          Monitor and manage local PostgreSQL and Supabase database connections
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <Tabs defaultValue="status">
            <TabsList className="mb-4">
              <TabsTrigger value="status">Status</TabsTrigger>
              <TabsTrigger value="tables">Tables</TabsTrigger>
              <TabsTrigger value="sql">SQL Script</TabsTrigger>
            </TabsList>
            
            <TabsContent value="status">
              <div className="space-y-4">
                <div className="rounded-md border p-4">
                  <h3 className="text-lg font-medium flex items-center">
                    Local PostgreSQL {localStatus && renderStatusBadge(localStatus.isConnected)}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">
                    Development database running in the local environment
                  </p>
                  
                  {localStatus?.error && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertTriangleIcon className="h-4 w-4" />
                      <AlertTitle>Connection Error</AlertTitle>
                      <AlertDescription>{localStatus.error}</AlertDescription>
                    </Alert>
                  )}
                </div>
                
                <div className="rounded-md border p-4">
                  <h3 className="text-lg font-medium flex items-center">
                    Supabase {supabaseStatus && renderStatusBadge(supabaseStatus.isConnected)}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">
                    Production database hosted on Supabase
                  </p>
                  
                  {!supabaseStatus?.isConnected && (
                    <Alert className="mt-2">
                      <AlertTriangleIcon className="h-4 w-4" />
                      <AlertTitle>Supabase Setup Required</AlertTitle>
                      <AlertDescription>
                        {supabaseStatus?.error || 
                          "Supabase connection requires manual table creation. View the SQL Script tab for instructions."}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="tables">
              <div className="space-y-4">
                <div className="rounded-md border overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Table Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Local PostgreSQL
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Supabase
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          property_history_records
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {localStatus && renderTableStatus(localStatus.tables.property_history_records)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {supabaseStatus && renderTableStatus(supabaseStatus.tables.property_history_records)}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          audit_records
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {localStatus && renderTableStatus(localStatus.tables.audit_records)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {supabaseStatus && renderTableStatus(supabaseStatus.tables.audit_records)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="sql">
              <div className="space-y-4">
                {supabaseStatus?.sqlScript ? (
                  <>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-md font-medium flex items-center">
                        <CodeIcon className="mr-2 h-4 w-4" />
                        SQL Script for Supabase
                      </h3>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => copyToClipboard(supabaseStatus.sqlScript || '')}
                      >
                        <ClipboardIcon className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                    </div>
                    <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-xs">
                      {supabaseStatus.sqlScript}
                    </pre>
                    <Alert>
                      <AlertTitle>Manual Setup Required</AlertTitle>
                      <AlertDescription>
                        Due to Supabase security configurations, tables must be created manually using the SQL Editor in the Supabase dashboard.
                      </AlertDescription>
                    </Alert>
                  </>
                ) : (
                  <Alert>
                    <AlertTitle>No SQL Script Available</AlertTitle>
                    <AlertDescription>
                      All required tables are present or connection to database has failed.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="outline" onClick={fetchDatabaseStatus} disabled={loading}>
          <RefreshCcwIcon className="h-4 w-4 mr-2" />
          Refresh Status
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DatabaseStatusPanel;