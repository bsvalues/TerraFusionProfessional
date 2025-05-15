import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip } from '@/components/ui/custom-tooltip';
import { useToast } from '@/hooks/use-toast';
import { dataConnector } from '../../services/etl/DataConnector';
import { DataSource } from '../../services/etl/ETLTypes';

/**
 * ETL Data Source Manager Component
 * 
 * A component that provides a UI for testing and managing data source connections
 */
export function ETLDataSourceManager({ dataSourceId }: { dataSourceId: string }) {
  const [dataSource, setDataSource] = useState<DataSource | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    success?: boolean;
    message?: string;
    details?: any;
    timestamp?: Date;
  }>({});
  const [connectionLogs, setConnectionLogs] = useState<any[]>([]);
  
  const { toast } = useToast();
  
  // Load the data source and its connection logs
  useEffect(() => {
    if (!dataSourceId) return;
    
    const source = dataConnector.getDataSource(dataSourceId);
    setDataSource(source);
    
    if (source) {
      const logs = dataConnector.getConnectionLogs(dataSourceId);
      setConnectionLogs(logs);
    }
  }, [dataSourceId]);
  
  // Test the connection
  const handleTestConnection = async () => {
    if (!dataSource) return;
    
    setIsLoading(true);
    
    try {
      const result = await dataConnector.testConnection(dataSourceId);
      setConnectionStatus({
        success: result.success,
        message: result.message,
        details: result.details,
        timestamp: new Date()
      });
      
      toast({
        title: result.success ? 'Connection successful' : 'Connection failed',
        description: result.message,
        variant: result.success ? 'default' : 'destructive'
      });
      
      // Refresh logs
      const logs = dataConnector.getConnectionLogs(dataSourceId);
      setConnectionLogs(logs);
    } catch (error) {
      setConnectionStatus({
        success: false,
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        timestamp: new Date()
      });
      
      toast({
        title: 'Connection error',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Connect to the data source (establish persistent connection)
  const handleConnect = async () => {
    if (!dataSource) return;
    
    setIsLoading(true);
    
    try {
      const success = await dataConnector.connectToDataSource(dataSourceId);
      
      // Refresh data source to get updated connection status
      const updatedSource = dataConnector.getDataSource(dataSourceId);
      setDataSource(updatedSource);
      
      setConnectionStatus({
        success,
        message: success 
          ? `Successfully connected to ${dataSource.name}`
          : `Failed to connect to ${dataSource.name}`,
        timestamp: new Date()
      });
      
      toast({
        title: success ? 'Connection established' : 'Connection failed',
        description: success 
          ? `Successfully connected to ${dataSource.name}`
          : `Failed to connect to ${dataSource.name}`,
        variant: success ? 'default' : 'destructive'
      });
      
      // Refresh logs
      const logs = dataConnector.getConnectionLogs(dataSourceId);
      setConnectionLogs(logs);
    } catch (error) {
      setConnectionStatus({
        success: false,
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        timestamp: new Date()
      });
      
      toast({
        title: 'Connection error',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Disconnect from the data source
  const handleDisconnect = () => {
    if (!dataSource) return;
    
    const success = dataConnector.closeConnection(dataSourceId);
    
    // Refresh data source to get updated connection status
    const updatedSource = dataConnector.getDataSource(dataSourceId);
    setDataSource(updatedSource);
    
    toast({
      title: success ? 'Disconnected' : 'Disconnect failed',
      description: success 
        ? `Successfully disconnected from ${dataSource.name}`
        : `Failed to disconnect from ${dataSource.name}`,
      variant: success ? 'default' : 'destructive'
    });
  };
  
  if (!dataSource) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center text-muted-foreground">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <span>Data source not found</span>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Connection Manager
          <Badge variant={dataSource.isConnected ? "default" : "secondary"}>
            {dataSource.isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </CardTitle>
        <CardDescription>
          Manage connection to {dataSource.name} ({dataSource.type})
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Connection Details */}
        <div>
          <h3 className="text-sm font-semibold mb-2">Connection Details:</h3>
          <div className="bg-muted p-3 rounded-md text-xs font-mono overflow-auto">
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(dataSource.connectionDetails, null, 2)}
            </pre>
          </div>
        </div>
        
        {/* Connection Status */}
        {connectionStatus.timestamp && (
          <div className="border rounded-md p-3">
            <div className="flex items-center mb-2">
              {connectionStatus.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500 mr-2" />
              )}
              <span className="font-semibold">
                {connectionStatus.success ? 'Connection Successful' : 'Connection Failed'}
              </span>
              <span className="ml-auto text-xs text-muted-foreground">
                {connectionStatus.timestamp.toLocaleTimeString()}
              </span>
            </div>
            <p className="text-sm">{connectionStatus.message}</p>
            
            {connectionStatus.details?.connectionLatencyMs && (
              <div className="mt-2 text-xs text-muted-foreground">
                <span className="font-semibold">Latency:</span> {connectionStatus.details.connectionLatencyMs}ms
              </div>
            )}
            
            {connectionStatus.details?.validationErrors?.length > 0 && (
              <div className="mt-2">
                <span className="text-xs font-semibold">Warnings:</span>
                <ul className="mt-1 text-xs text-muted-foreground">
                  {connectionStatus.details.validationErrors.map((error: any, index: number) => (
                    <li key={index} className="flex items-start">
                      <AlertTriangle className="h-3 w-3 mr-1 mt-0.5 text-amber-500" />
                      <span>
                        <strong>{error.field}:</strong> {error.message}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        
        {/* Connection History/Logs */}
        {connectionLogs.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Connection Logs:</h3>
            <div className="border rounded-md overflow-hidden">
              <div className="max-h-40 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-2 text-left">Time</th>
                      <th className="p-2 text-left">Event</th>
                      <th className="p-2 text-left">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {connectionLogs.slice().reverse().map((log, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2 text-muted-foreground">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="p-2">
                          <Tooltip
                            content={log.code}
                            placement="top"
                          >
                            <Badge variant="outline" className="font-mono">
                              {log.code}
                            </Badge>
                          </Tooltip>
                        </td>
                        <td className="p-2">{log.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div>
          {dataSource.lastConnected && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              Last connected: {new Date(dataSource.lastConnected).toLocaleString()}
            </div>
          )}
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleTestConnection}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Test Connection
          </Button>
          
          {dataSource.isConnected ? (
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={handleDisconnect}
              disabled={isLoading}
            >
              Disconnect
            </Button>
          ) : (
            <Button 
              size="sm" 
              onClick={handleConnect}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Connect
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}