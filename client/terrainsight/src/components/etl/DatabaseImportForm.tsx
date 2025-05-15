/**
 * DatabaseImportForm.tsx
 * 
 * Form component for importing data from external databases
 * Supports SQL Server and ODBC connections
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Loader2, AlertCircle, Check, Info, Database, RefreshCw, Plus, Minus, FileText, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

import { SQLServerAdapter } from '../../services/etl/SQLServerAdapter';
import { ODBCAdapter } from '../../services/etl/ODBCAdapter';
import { 
  DatabaseAdapter,
  SQLServerConnectionConfig,
  ODBCConnectionConfig, 
  DataSourceType 
} from '../../services/etl/ETLTypes';
import fieldMappingService from '../../services/etl/FieldMappingService';

// Define interfaces for component props and state
interface DatabaseImportFormProps {
  onImportComplete?: (properties: Partial<Property>[]) => void;
}

interface FieldMapping {
  sourceField: string;
  targetField: string;
  transformation?: string | ((value: any) => any);
  required: boolean;
  defaultValue?: any;
}

interface Property {
  id: string;
  parcelNumber: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
  landValue: number;
  improvementValue: number;
  totalValue: number;
  yearBuilt?: number;
  squareFeet?: number;
  lotSize?: number;
  bedrooms?: number;
  bathrooms?: number;
  latitude?: number;
  longitude?: number;
  lastSaleDate?: Date;
  lastSalePrice?: number;
  ownerName?: string;
  taxYear?: number;
  taxAmount?: number;
  [key: string]: any;
}

// Main component
export const DatabaseImportForm: React.FC<DatabaseImportFormProps> = ({ onImportComplete }) => {
  // Connection state
  const [connectionType, setConnectionType] = useState<'sqlServer' | 'odbc'>('sqlServer');
  const [sqlConfig, setSqlConfig] = useState<SQLServerConnectionConfig>({
    server: '',
    database: '',
    username: '',
    password: '',
    port: 1433,
    encrypt: true,
    trustServerCertificate: false
  });
  
  const [odbcConfig, setOdbcConfig] = useState<ODBCConnectionConfig>({
    connectionString: '',
    username: '',
    password: ''
  });
  
  // Connection and data states
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [adapter, setAdapter] = useState<DatabaseAdapter | null>(null);
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableColumns, setTableColumns] = useState<any[]>([]);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [tableData, setTableData] = useState<any[]>([]);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  
  // Field mapping state
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [selectedSourceField, setSelectedSourceField] = useState<string>('');
  const [selectedTargetField, setSelectedTargetField] = useState<string>('');
  const [selectedTransformation, setSelectedTransformation] = useState<string>('none');
  const [defaultValue, setDefaultValue] = useState<string>('');
  const [isRequired, setIsRequired] = useState(false);
  
  // Import options
  const [importLimit, setImportLimit] = useState<number>(1000);
  const [importAll, setImportAll] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  
  // Target field options presets for properties
  const targetFieldOptions = [
    { value: 'parcelNumber', label: 'Parcel Number' },
    { value: 'address', label: 'Address' },
    { value: 'city', label: 'City' },
    { value: 'state', label: 'State' },
    { value: 'zipCode', label: 'ZIP Code' },
    { value: 'propertyType', label: 'Property Type' },
    { value: 'landValue', label: 'Land Value' },
    { value: 'improvementValue', label: 'Improvement Value' },
    { value: 'totalValue', label: 'Total Value' },
    { value: 'yearBuilt', label: 'Year Built' },
    { value: 'squareFeet', label: 'Square Feet' },
    { value: 'lotSize', label: 'Lot Size' },
    { value: 'bedrooms', label: 'Bedrooms' },
    { value: 'bathrooms', label: 'Bathrooms' },
    { value: 'latitude', label: 'Latitude' },
    { value: 'longitude', label: 'Longitude' },
    { value: 'lastSaleDate', label: 'Last Sale Date' },
    { value: 'lastSalePrice', label: 'Last Sale Price' },
    { value: 'ownerName', label: 'Owner Name' },
    { value: 'taxYear', label: 'Tax Year' },
    { value: 'taxAmount', label: 'Tax Amount' }
  ];
  
  // Transformation options
  const transformationOptions = [
    { value: 'none', label: 'None' },
    { value: 'parseFloat', label: 'Convert to Number' },
    { value: 'toString', label: 'Convert to Text' },
    { value: 'formatDate', label: 'Format as Date' },
    { value: 'parseDate', label: 'Parse Date' },
    { value: 'booleanToString', label: 'Boolean to Text' },
    { value: 'stringToBoolean', label: 'Text to Boolean' },
    { value: 'customFunction', label: 'Custom Function' }
  ];

  // Connect to database
  const handleConnect = async () => {
    setIsConnecting(true);
    
    try {
      // Create appropriate adapter based on connection type
      let newAdapter: DatabaseAdapter;
      
      if (connectionType === 'sqlServer') {
        newAdapter = new SQLServerAdapter(sqlConfig);
      } else {
        newAdapter = new ODBCAdapter(odbcConfig);
      }
      
      // Test connection
      await newAdapter.connect();
      
      // Get list of tables
      const tableList = await newAdapter.getTableList();
      
      setAdapter(newAdapter);
      setTables(tableList);
      setIsConnected(true);
      toast({
        title: "Connection successful",
        description: `Connected to database with ${tableList.length} tables available.`,
        variant: "default",
      });
    } catch (error: any) {
      toast({
        title: "Connection failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };
  
  // Disconnect from database
  const handleDisconnect = () => {
    if (adapter) {
      adapter.disconnect();
    }
    
    setAdapter(null);
    setIsConnected(false);
    setTables([]);
    setSelectedTable('');
    setTableColumns([]);
    setTableData([]);
    setMappings([]);
    
    toast({
      title: "Disconnected",
      description: "Database connection closed.",
      variant: "default",
    });
  };
  
  // Handle table selection
  const handleTableSelect = async (table: string) => {
    setSelectedTable(table);
    setTableData([]);
    setIsPreviewVisible(false);
    
    if (!adapter || !table) return;
    
    try {
      // Get table schema
      const schema = await adapter.getTableSchema(table);
      setTableColumns(schema);
      
      // Generate field mappings based on column names
      const targetColumns = targetFieldOptions.map(option => ({
        name: option.value,
        type: getDataTypeForField(option.value),
        nullable: !isRequiredField(option.value)
      }));
      
      const sourceColumns = fieldMappingService.extractColumnsFromMetadata(schema);
      const suggestedMappings = fieldMappingService.suggestMappings(sourceColumns, targetColumns);
      
      setMappings(suggestedMappings);
      
      toast({
        title: "Table selected",
        description: `Schema loaded with ${schema.length} columns.`,
        variant: "default",
      });
    } catch (error: any) {
      toast({
        title: "Failed to load table schema",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  
  // Update SQL Server config
  const updateSqlConfig = (field: keyof SQLServerConnectionConfig, value: any) => {
    setSqlConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Update ODBC config
  const updateOdbcConfig = (field: keyof ODBCConnectionConfig, value: string) => {
    setOdbcConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Get data preview
  const handlePreviewData = async () => {
    if (!adapter || !selectedTable) return;
    
    setIsFetchingData(true);
    
    try {
      // Execute query to get sample data
      const query = `SELECT TOP 10 * FROM ${selectedTable}`;
      const data = await adapter.query(query);
      
      setTableData(data);
      setIsPreviewVisible(true);
      
      toast({
        title: "Data preview loaded",
        description: `Showing ${data.length} sample records.`,
        variant: "default",
      });
    } catch (error: any) {
      toast({
        title: "Failed to load data preview",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsFetchingData(false);
    }
  };
  
  // Add/update field mapping
  const handleAddMapping = () => {
    if (!selectedSourceField || !selectedTargetField) {
      toast({
        title: "Validation error",
        description: "Both source and target fields are required.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if mapping already exists for the target field
    const existingIndex = mappings.findIndex(m => m.targetField === selectedTargetField);
    
    const newMapping: FieldMapping = {
      sourceField: selectedSourceField,
      targetField: selectedTargetField,
      required: isRequired,
      transformation: selectedTransformation === 'none' ? undefined : selectedTransformation,
      defaultValue: defaultValue || undefined
    };
    
    // Update or add the mapping
    if (existingIndex >= 0) {
      const updatedMappings = [...mappings];
      updatedMappings[existingIndex] = newMapping;
      setMappings(updatedMappings);
    } else {
      setMappings([...mappings, newMapping]);
    }
    
    // Reset form
    setSelectedSourceField('');
    setSelectedTargetField('');
    setSelectedTransformation('none');
    setDefaultValue('');
    setIsRequired(false);
    
    toast({
      title: "Mapping updated",
      description: `Field mapping from "${selectedSourceField}" to "${selectedTargetField}" added.`,
      variant: "default",
    });
  };
  
  // Remove field mapping
  const handleRemoveMapping = (targetField: string) => {
    setMappings(mappings.filter(m => m.targetField !== targetField));
    
    toast({
      title: "Mapping removed",
      description: `Field mapping for "${targetField}" removed.`,
      variant: "default",
    });
  };
  
  // Import data
  const handleImport = async () => {
    if (!adapter || !selectedTable || mappings.length === 0) {
      toast({
        title: "Cannot import",
        description: "Please configure database connection, select a table, and define field mappings.",
        variant: "destructive",
      });
      return;
    }
    
    setIsImporting(true);
    setImportSuccess(false);
    
    try {
      // Build query to fetch data
      const limit = importAll ? 100000 : importLimit;
      const query = `SELECT TOP ${limit} * FROM ${selectedTable}`;
      
      // Fetch data
      const data = await adapter.query(query);
      
      // Apply field mappings to transform data
      const transformedData = fieldMappingService.applyMappings(data, mappings);
      
      // Validate each record
      const validRecords = transformedData.filter((record) => {
        const errors = fieldMappingService.validateRecord(record, mappings);
        return errors.length === 0;
      });
      
      setImportedCount(validRecords.length);
      setImportSuccess(true);
      
      // Invoke callback with imported data
      if (onImportComplete) {
        onImportComplete(validRecords);
      }
      
      toast({
        title: "Import successful",
        description: `Imported ${validRecords.length} records successfully.`,
        variant: "default",
      });
    } catch (error: any) {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };
  
  // Helper function to get data type for a property field
  const getDataTypeForField = (field: string): string => {
    const numericFields = [
      'landValue', 'improvementValue', 'totalValue', 'yearBuilt', 
      'squareFeet', 'lotSize', 'bedrooms', 'bathrooms', 
      'latitude', 'longitude', 'lastSalePrice', 'taxYear', 'taxAmount'
    ];
    
    const dateFields = ['lastSaleDate'];
    
    if (numericFields.includes(field)) {
      return 'numeric';
    } else if (dateFields.includes(field)) {
      return 'date';
    } else {
      return 'varchar';
    }
  };
  
  // Helper function to determine if a field is required
  const isRequiredField = (field: string): boolean => {
    const requiredFields = [
      'parcelNumber', 'address', 'propertyType'
    ];
    
    return requiredFields.includes(field);
  };
  
  // Effect to auto-select transformation when fields are selected
  useEffect(() => {
    if (selectedSourceField && selectedTargetField) {
      // Find source and target column info
      const sourceColumn = tableColumns.find(c => 
        c.column_name === selectedSourceField || 
        c.COLUMN_NAME === selectedSourceField || 
        c.name === selectedSourceField
      );
      
      const targetInfo = {
        name: selectedTargetField,
        type: getDataTypeForField(selectedTargetField),
        nullable: !isRequiredField(selectedTargetField)
      };
      
      // Auto-suggest transformation if source column is found
      if (sourceColumn) {
        const transformation = fieldMappingService.suggestTransformation(
          fieldMappingService.extractColumnsFromMetadata([sourceColumn])[0], 
          targetInfo
        );
        
        setSelectedTransformation(transformation || 'none');
        setIsRequired(isRequiredField(selectedTargetField));
      }
    }
  }, [selectedSourceField, selectedTargetField, tableColumns]);
  
  // Helper to get item label from value
  const getLabelForValue = (options: {value: string, label: string}[], value: string): string => {
    const option = options.find(opt => opt.value === value);
    return option ? option.label : value;
  };
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Database Connection</CardTitle>
          <CardDescription>
            Connect to an external database to import property data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="sqlServer" onValueChange={(v) => setConnectionType(v as 'sqlServer' | 'odbc')}>
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="sqlServer">
                SQL Server
              </TabsTrigger>
              <TabsTrigger value="odbc">
                ODBC
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="sqlServer" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="server">Server</Label>
                  <Input 
                    id="server"
                    placeholder="localhost or server address"
                    value={sqlConfig.server}
                    onChange={(e) => updateSqlConfig('server', e.target.value)}
                    disabled={isConnected}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="port">Port</Label>
                  <Input 
                    id="port"
                    type="number"
                    placeholder="1433"
                    value={sqlConfig.port}
                    onChange={(e) => updateSqlConfig('port', parseInt(e.target.value))}
                    disabled={isConnected}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="database">Database</Label>
                <Input 
                  id="database"
                  placeholder="Database name"
                  value={sqlConfig.database}
                  onChange={(e) => updateSqlConfig('database', e.target.value)}
                  disabled={isConnected}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input 
                    id="username"
                    placeholder="Username"
                    value={sqlConfig.username}
                    onChange={(e) => updateSqlConfig('username', e.target.value)}
                    disabled={isConnected}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password"
                    type="password"
                    placeholder="Password"
                    value={sqlConfig.password}
                    onChange={(e) => updateSqlConfig('password', e.target.value)}
                    disabled={isConnected}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-8 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="encrypt"
                    checked={sqlConfig.encrypt}
                    onCheckedChange={(checked) => updateSqlConfig('encrypt', !!checked)}
                    disabled={isConnected}
                  />
                  <Label htmlFor="encrypt">Encrypt</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="trustServerCertificate"
                    checked={sqlConfig.trustServerCertificate}
                    onCheckedChange={(checked) => updateSqlConfig('trustServerCertificate', !!checked)}
                    disabled={isConnected}
                  />
                  <Label htmlFor="trustServerCertificate">Trust Server Certificate</Label>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="odbc" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="connectionString">Connection String</Label>
                <Input 
                  id="connectionString"
                  placeholder="DSN=MyDataSource;UID=username;PWD=password"
                  value={odbcConfig.connectionString}
                  onChange={(e) => updateOdbcConfig('connectionString', e.target.value)}
                  disabled={isConnected}
                />
                <p className="text-sm text-muted-foreground">
                  You can use a DSN or a full connection string
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="odbcUsername">Username (Optional)</Label>
                  <Input 
                    id="odbcUsername"
                    placeholder="Username"
                    value={odbcConfig.username}
                    onChange={(e) => updateOdbcConfig('username', e.target.value)}
                    disabled={isConnected}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="odbcPassword">Password (Optional)</Label>
                  <Input 
                    id="odbcPassword"
                    type="password"
                    placeholder="Password"
                    value={odbcConfig.password}
                    onChange={(e) => updateOdbcConfig('password', e.target.value)}
                    disabled={isConnected}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          {!isConnected ? (
            <Button onClick={handleConnect} disabled={isConnecting}>
              {isConnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Connect
            </Button>
          ) : (
            <Button onClick={handleDisconnect} variant="outline">
              Disconnect
            </Button>
          )}
          
          {isConnected && (
            <div className="flex items-center text-green-600">
              <Check className="mr-2 h-4 w-4" />
              <span>Connected</span>
            </div>
          )}
        </CardFooter>
      </Card>
      
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle>Table Selection</CardTitle>
            <CardDescription>
              Select a database table to import data from
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedTable}
              onValueChange={handleTableSelect}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a table" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {tables.map(table => (
                    <SelectItem key={table} value={table}>
                      {table}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            
            {selectedTable && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium">Columns ({tableColumns.length})</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviewData}
                    disabled={isFetchingData}
                  >
                    {isFetchingData ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="mr-2 h-4 w-4" />
                    )}
                    Preview Data
                  </Button>
                </div>
                
                <div className="bg-muted p-2 rounded-md h-32 overflow-y-auto">
                  <div className="grid grid-cols-3 gap-2">
                    {tableColumns.map((column, index) => {
                      const columnName = column.column_name || column.COLUMN_NAME || column.name;
                      const dataType = column.data_type || column.DATA_TYPE || column.type;
                      
                      return (
                        <div key={index} className="text-xs rounded bg-background p-2">
                          <div className="font-medium">{columnName}</div>
                          <div className="text-muted-foreground">{dataType}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {isPreviewVisible && tableData.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium mb-2">Data Preview</h3>
                    <div className="border rounded-md overflow-x-auto">
                      <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted">
                          <tr>
                            {Object.keys(tableData[0]).map((key) => (
                              <th key={key} className="px-3 py-2 text-left text-xs font-medium">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {tableData.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              {Object.keys(tableData[0]).map((key) => (
                                <td key={`${rowIndex}-${key}`} className="px-3 py-2 text-xs">
                                  {row[key]?.toString().substring(0, 30) || ''}
                                  {row[key]?.toString().length > 30 ? '...' : ''}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {selectedTable && (
        <Card>
          <CardHeader>
            <CardTitle>Field Mapping</CardTitle>
            <CardDescription>
              Map database fields to property fields
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-md">
                <div className="flex items-center space-x-2 mb-4">
                  <Info className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">
                    Fields with matching or similar names have been automatically mapped. 
                    You can adjust these mappings or create new ones below.
                  </span>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sourceField">Source Field</Label>
                      <Select value={selectedSourceField} onValueChange={setSelectedSourceField}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select database field" />
                        </SelectTrigger>
                        <SelectContent>
                          {tableColumns.map((column) => {
                            const name = column.column_name || column.COLUMN_NAME || column.name;
                            return (
                              <SelectItem key={name} value={name}>
                                {name}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="targetField">Target Field</Label>
                      <Select value={selectedTargetField} onValueChange={setSelectedTargetField}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select property field" />
                        </SelectTrigger>
                        <SelectContent>
                          {targetFieldOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="transformation">Transformation</Label>
                      <Select value={selectedTransformation} onValueChange={setSelectedTransformation}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select transformation" />
                        </SelectTrigger>
                        <SelectContent>
                          {transformationOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex items-end space-x-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="defaultValue">Default Value (if missing)</Label>
                        <div className="flex items-center space-x-2">
                          <Switch 
                            id="required"
                            checked={isRequired}
                            onCheckedChange={setIsRequired}
                          />
                          <Label htmlFor="required" className="text-sm">Required field</Label>
                        </div>
                      </div>
                      <Input 
                        id="defaultValue"
                        placeholder="Default value for empty fields"
                        value={defaultValue}
                        onChange={(e) => setDefaultValue(e.target.value)}
                      />
                    </div>
                    
                    <Button onClick={handleAddMapping}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Mapping
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Current Mappings</h3>
                
                {mappings.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-4 border border-dashed rounded-md text-center">
                    No field mappings defined yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {mappings.map((mapping, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between p-2 bg-background rounded-md border"
                      >
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{index + 1}</Badge>
                          <span className="font-medium">{mapping.sourceField}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="font-medium">{getLabelForValue(targetFieldOptions, mapping.targetField)}</span>
                          
                          {mapping.transformation && (
                            <Badge variant="secondary" className="ml-2">
                              {getLabelForValue(transformationOptions, mapping.transformation as string)}
                            </Badge>
                          )}
                          
                          {mapping.required && (
                            <Badge variant="destructive" className="ml-2">
                              Required
                            </Badge>
                          )}
                          
                          {mapping.defaultValue !== undefined && (
                            <Badge variant="outline" className="ml-2">
                              Default: {mapping.defaultValue}
                            </Badge>
                          )}
                        </div>
                        
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleRemoveMapping(mapping.targetField)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {selectedTable && mappings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Import</CardTitle>
            <CardDescription>
              Import data from the selected table using the defined mappings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="importLimit">Import Limit</Label>
                  <Input 
                    id="importLimit"
                    type="number"
                    min={1}
                    max={100000}
                    value={importLimit}
                    onChange={(e) => setImportLimit(parseInt(e.target.value))}
                    disabled={importAll}
                  />
                </div>
                <div className="flex items-end space-x-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="importAll"
                      checked={importAll}
                      onCheckedChange={(checked) => setImportAll(!!checked)}
                    />
                    <Label htmlFor="importAll">Import all records</Label>
                  </div>
                </div>
              </div>
              
              <div className="bg-muted p-2 rounded-md">
                <div className="flex items-center space-x-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">
                    Data will be imported based on the field mappings defined above.
                    Only records that pass validation will be imported.
                  </span>
                </div>
              </div>
              
              {importSuccess && (
                <div className="bg-green-50 text-green-700 p-3 rounded-md border border-green-200">
                  <div className="flex items-center space-x-2">
                    <Check className="h-4 w-4" />
                    <span>Successfully imported {importedCount} records.</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleImport} 
              disabled={isImporting || mappings.length === 0}
              className="w-full"
            >
              {isImporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {isImporting ? 'Importing...' : 'Import Data'}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default DatabaseImportForm;