import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  DataSource, 
  DataSourceType, 
  DatabaseType, 
  ApiType, 
  FileType,
  ConnectionTestResult
} from '../../services/etl/ETLTypes';
import { dataConnector } from '../../services/etl/DataConnector';
import { 
  Database, 
  Server, 
  File, 
  Globe, 
  Plus, 
  Edit, 
  Trash2, 
  RotateCw, 
  CheckCircle2, 
  XCircle, 
  Clock
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface DataSourceManagerProps {
  dataSources: DataSource[];
  onAddDataSource: (dataSource: DataSource) => void;
  onUpdateDataSource: (dataSource: DataSource) => void;
  onDeleteDataSource: (id: number) => void;
}

const DataSourceManager: React.FC<DataSourceManagerProps> = ({
  dataSources,
  onAddDataSource,
  onUpdateDataSource,
  onDeleteDataSource
}) => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingDataSource, setEditingDataSource] = useState<DataSource | null>(null);
  const [deletingDataSourceId, setDeletingDataSourceId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>("database");
  const [testResults, setTestResults] = useState<Record<number, ConnectionTestResult>>({});
  const [isTestingConnection, setIsTestingConnection] = useState<Record<number, boolean>>({});
  
  // Form state
  const [formValues, setFormValues] = useState({
    name: "",
    description: "",
    type: DataSourceType.DATABASE,
    
    // Database fields
    dbType: DatabaseType.POSTGRESQL,
    dbHost: "",
    dbPort: "5432",
    dbUsername: "",
    dbPassword: "",
    dbDatabase: "",
    dbConnectionString: "",
    
    // API fields
    apiUrl: "",
    apiMethod: "GET",
    apiAuthType: "",
    apiHeaders: "",
    
    // File fields
    filePath: "",
    fileType: FileType.CSV,
    fileDelimiter: ",",
    
    // In-memory fields
    inMemoryData: ""
  });
  
  // Reset form when dialog closes
  useEffect(() => {
    if (!isDialogOpen) {
      setEditingDataSource(null);
      resetForm();
    }
  }, [isDialogOpen]);
  
  // Initialize form when editing a data source
  useEffect(() => {
    if (editingDataSource) {
      // Set common fields
      setFormValues({
        ...formValues,
        name: editingDataSource.name,
        description: editingDataSource.description || "",
        type: editingDataSource.type,
        
        // Initialize specific fields based on type
        ...initializeTypeSpecificFields(editingDataSource)
      });
      
      // Set active tab based on data source type
      setActiveTab(getTabFromDataSourceType(editingDataSource.type));
    }
  }, [editingDataSource]);
  
  /**
   * Get tab name from data source type
   */
  const getTabFromDataSourceType = (type: DataSourceType): string => {
    switch (type) {
      case DataSourceType.DATABASE:
        return "database";
      case DataSourceType.API:
        return "api";
      case DataSourceType.FILE:
        return "file";
      case DataSourceType.IN_MEMORY:
        return "in-memory";
      case DataSourceType.CUSTOM:
        return "custom";
      default:
        return "database";
    }
  };
  
  /**
   * Initialize type-specific form fields from a data source
   */
  const initializeTypeSpecificFields = (dataSource: DataSource) => {
    const fields: any = {};
    
    switch (dataSource.type) {
      case DataSourceType.DATABASE:
        const dbConfig = dataSource.connection.database;
        if (dbConfig) {
          fields.dbType = dbConfig.type;
          fields.dbHost = dbConfig.host || "";
          fields.dbPort = dbConfig.port?.toString() || "5432";
          fields.dbUsername = dbConfig.username || "";
          fields.dbPassword = dbConfig.password || "";
          fields.dbDatabase = dbConfig.database || "";
          fields.dbConnectionString = dbConfig.connectionString || "";
        }
        break;
      
      case DataSourceType.API:
        const apiConfig = dataSource.connection.api;
        if (apiConfig) {
          fields.apiUrl = apiConfig.url || "";
          fields.apiMethod = apiConfig.method || "GET";
          fields.apiAuthType = apiConfig.authType || "";
          
          // Convert headers object to string
          if (apiConfig.headers) {
            fields.apiHeaders = Object.entries(apiConfig.headers)
              .map(([key, value]) => `${key}: ${value}`)
              .join("\n");
          }
        }
        break;
      
      case DataSourceType.FILE:
        const fileConfig = dataSource.connection.file;
        if (fileConfig) {
          fields.filePath = fileConfig.path || "";
          fields.fileType = fileConfig.type;
          fields.fileDelimiter = fileConfig.delimiter || ",";
        }
        break;
      
      case DataSourceType.IN_MEMORY:
        const inMemoryConfig = dataSource.connection.inMemory;
        if (inMemoryConfig && inMemoryConfig.data) {
          fields.inMemoryData = JSON.stringify(inMemoryConfig.data, null, 2);
        }
        break;
    }
    
    return fields;
  };
  
  /**
   * Reset form state
   */
  const resetForm = () => {
    setFormValues({
      name: "",
      description: "",
      type: DataSourceType.DATABASE,
      
      // Database fields
      dbType: DatabaseType.POSTGRESQL,
      dbHost: "",
      dbPort: "5432",
      dbUsername: "",
      dbPassword: "",
      dbDatabase: "",
      dbConnectionString: "",
      
      // API fields
      apiUrl: "",
      apiMethod: "GET",
      apiAuthType: "",
      apiHeaders: "",
      
      // File fields
      filePath: "",
      fileType: FileType.CSV,
      fileDelimiter: ",",
      
      // In-memory fields
      inMemoryData: ""
    });
    setActiveTab("database");
  };
  
  /**
   * Handle input change
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };
  
  /**
   * Handle select change
   */
  const handleSelectChange = (name: string, value: string) => {
    setFormValues(prev => ({ ...prev, [name]: value }));
    
    // If changing the data source type, update the active tab
    if (name === "type") {
      const newType = value as DataSourceType;
      setActiveTab(getTabFromDataSourceType(newType));
    }
  };
  
  /**
   * Handle form submission
   */
  const handleSubmit = () => {
    // Validate form
    if (!formValues.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Data source name is required",
        variant: "destructive"
      });
      return;
    }
    
    // Create data source object
    const dataSource: DataSource = {
      id: editingDataSource?.id || Date.now(),
      name: formValues.name.trim(),
      description: formValues.description.trim() || undefined,
      type: formValues.type as DataSourceType,
      connection: buildConnectionConfig(),
      enabled: editingDataSource?.enabled ?? true,
      extraction: editingDataSource?.extraction || {
        query: "",
        fields: [],
        filters: {}
      }
    };
    
    // Save data source
    if (editingDataSource) {
      onUpdateDataSource(dataSource);
      toast({
        title: "Data Source Updated",
        description: `Data source "${dataSource.name}" has been updated successfully.`
      });
    } else {
      onAddDataSource(dataSource);
      toast({
        title: "Data Source Added",
        description: `Data source "${dataSource.name}" has been added successfully.`
      });
    }
    
    // Close dialog
    setIsDialogOpen(false);
  };
  
  /**
   * Build connection configuration object
   */
  const buildConnectionConfig = () => {
    const config: any = {};
    
    switch (formValues.type) {
      case DataSourceType.DATABASE:
        config.database = {
          type: formValues.dbType,
          host: formValues.dbHost,
          port: parseInt(formValues.dbPort, 10),
          username: formValues.dbUsername,
          password: formValues.dbPassword,
          database: formValues.dbDatabase,
          connectionString: formValues.dbConnectionString || undefined
        };
        break;
      
      case DataSourceType.API:
        // Parse headers
        const headers: Record<string, string> = {};
        if (formValues.apiHeaders.trim()) {
          formValues.apiHeaders.split("\n").forEach(line => {
            const [key, value] = line.split(":", 2);
            if (key && value) {
              headers[key.trim()] = value.trim();
            }
          });
        }
        
        config.api = {
          url: formValues.apiUrl,
          method: formValues.apiMethod,
          headers,
          authType: formValues.apiAuthType || undefined,
          authDetails: {} // This would be populated in a more detailed form
        };
        break;
      
      case DataSourceType.FILE:
        config.file = {
          path: formValues.filePath,
          type: formValues.fileType,
          delimiter: formValues.fileDelimiter
        };
        break;
      
      case DataSourceType.IN_MEMORY:
        let data = [];
        try {
          if (formValues.inMemoryData.trim()) {
            data = JSON.parse(formValues.inMemoryData);
          }
        } catch (error) {
          console.error("Error parsing in-memory data:", error);
          toast({
            title: "Invalid JSON",
            description: "The in-memory data is not valid JSON",
            variant: "destructive"
          });
        }
        
        config.inMemory = {
          data
        };
        break;
      
      case DataSourceType.CUSTOM:
        config.custom = {
          config: {}
        };
        break;
    }
    
    return config;
  };
  
  /**
   * Handle tab change
   */
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Update data source type based on tab
    switch (value) {
      case "database":
        handleSelectChange("type", DataSourceType.DATABASE);
        break;
      case "api":
        handleSelectChange("type", DataSourceType.API);
        break;
      case "file":
        handleSelectChange("type", DataSourceType.FILE);
        break;
      case "in-memory":
        handleSelectChange("type", DataSourceType.IN_MEMORY);
        break;
      case "custom":
        handleSelectChange("type", DataSourceType.CUSTOM);
        break;
    }
  };
  
  /**
   * Handle delete button click
   */
  const handleDeleteClick = (id: number) => {
    setDeletingDataSourceId(id);
    setIsDeleteDialogOpen(true);
  };
  
  /**
   * Handle delete confirmation
   */
  const handleDeleteConfirm = () => {
    if (deletingDataSourceId !== null) {
      onDeleteDataSource(deletingDataSourceId);
      toast({
        title: "Data Source Deleted",
        description: "The data source has been deleted successfully."
      });
      setIsDeleteDialogOpen(false);
      setDeletingDataSourceId(null);
    }
  };
  
  /**
   * Format connection details for display
   */
  const formatConnectionDetails = (dataSource: DataSource): string => {
    switch (dataSource.type) {
      case DataSourceType.DATABASE:
        const dbConfig = dataSource.connection.database;
        if (dbConfig) {
          if (dbConfig.connectionString) {
            return dbConfig.connectionString.replace(/:[^:]*@/, ":***@");
          }
          return `${dbConfig.type}://${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`;
        }
        return "No database configuration";
      
      case DataSourceType.API:
        const apiConfig = dataSource.connection.api;
        return apiConfig?.url || "No API URL";
      
      case DataSourceType.FILE:
        const fileConfig = dataSource.connection.file;
        return fileConfig?.path || "No file path";
      
      case DataSourceType.IN_MEMORY:
        const inMemoryConfig = dataSource.connection.inMemory;
        const dataCount = inMemoryConfig?.data?.length || 0;
        return `${dataCount} records in memory`;
      
      case DataSourceType.CUSTOM:
        return "Custom data source";
      
      default:
        return "Unknown type";
    }
  };
  
  /**
   * Test connection to a data source
   */
  const testConnection = async (dataSource: DataSource) => {
    setIsTestingConnection(prev => ({ ...prev, [dataSource.id]: true }));
    
    try {
      const result = await dataConnector.testConnection(dataSource);
      setTestResults(prev => ({ ...prev, [dataSource.id]: result }));
      
      if (result.success) {
        toast({
          title: "Connection Successful",
          description: `Successfully connected to ${dataSource.name}`,
        });
      } else {
        toast({
          title: "Connection Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error testing connection:", error);
      toast({
        title: "Error",
        description: `Failed to test connection: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive"
      });
    } finally {
      setIsTestingConnection(prev => ({ ...prev, [dataSource.id]: false }));
    }
  };
  
  /**
   * Render the dialog content
   */
  const renderDialogContent = () => {
    return (
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingDataSource ? "Edit Data Source" : "Add Data Source"}</DialogTitle>
          <DialogDescription>
            Configure a data source for ETL operations
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={formValues.name}
                onChange={handleInputChange}
                placeholder="Data Source Name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formValues.type}
                onValueChange={(value) => handleSelectChange("type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={DataSourceType.DATABASE}>Database</SelectItem>
                  <SelectItem value={DataSourceType.API}>API</SelectItem>
                  <SelectItem value={DataSourceType.FILE}>File</SelectItem>
                  <SelectItem value={DataSourceType.IN_MEMORY}>In-Memory</SelectItem>
                  <SelectItem value={DataSourceType.CUSTOM}>Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              value={formValues.description}
              onChange={handleInputChange}
              placeholder="Description (optional)"
            />
          </div>
          
          <div className="mt-4">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="database">Database</TabsTrigger>
                <TabsTrigger value="api">API</TabsTrigger>
                <TabsTrigger value="file">File</TabsTrigger>
                <TabsTrigger value="in-memory">In-Memory</TabsTrigger>
                <TabsTrigger value="custom">Custom</TabsTrigger>
              </TabsList>
              
              <TabsContent value="database" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dbType">Database Type</Label>
                  <Select
                    value={formValues.dbType}
                    onValueChange={(value) => handleSelectChange("dbType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select database type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={DatabaseType.POSTGRESQL}>PostgreSQL</SelectItem>
                      <SelectItem value={DatabaseType.MYSQL}>MySQL</SelectItem>
                      <SelectItem value={DatabaseType.MSSQL}>Microsoft SQL Server</SelectItem>
                      <SelectItem value={DatabaseType.ORACLE}>Oracle</SelectItem>
                      <SelectItem value={DatabaseType.SQLITE}>SQLite</SelectItem>
                      <SelectItem value={DatabaseType.MONGODB}>MongoDB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dbConnectionString">Connection String (Optional)</Label>
                  <Input
                    id="dbConnectionString"
                    name="dbConnectionString"
                    value={formValues.dbConnectionString}
                    onChange={handleInputChange}
                    placeholder="postgresql://username:password@host:port/database"
                  />
                  <p className="text-sm text-gray-500">
                    If provided, this will override the individual connection fields below.
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dbHost">Host</Label>
                    <Input
                      id="dbHost"
                      name="dbHost"
                      value={formValues.dbHost}
                      onChange={handleInputChange}
                      placeholder="localhost"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dbPort">Port</Label>
                    <Input
                      id="dbPort"
                      name="dbPort"
                      value={formValues.dbPort}
                      onChange={handleInputChange}
                      placeholder="5432"
                      type="number"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dbUsername">Username</Label>
                    <Input
                      id="dbUsername"
                      name="dbUsername"
                      value={formValues.dbUsername}
                      onChange={handleInputChange}
                      placeholder="username"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dbPassword">Password</Label>
                    <Input
                      id="dbPassword"
                      name="dbPassword"
                      value={formValues.dbPassword}
                      onChange={handleInputChange}
                      placeholder="password"
                      type="password"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dbDatabase">Database Name</Label>
                  <Input
                    id="dbDatabase"
                    name="dbDatabase"
                    value={formValues.dbDatabase}
                    onChange={handleInputChange}
                    placeholder="database"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="api" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="apiUrl">API URL</Label>
                  <Input
                    id="apiUrl"
                    name="apiUrl"
                    value={formValues.apiUrl}
                    onChange={handleInputChange}
                    placeholder="https://api.example.com/data"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="apiMethod">Method</Label>
                  <Select
                    value={formValues.apiMethod}
                    onValueChange={(value) => handleSelectChange("apiMethod", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="apiAuthType">Authentication Type</Label>
                  <Select
                    value={formValues.apiAuthType}
                    onValueChange={(value) => handleSelectChange("apiAuthType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select authentication type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      <SelectItem value="API_KEY">API Key</SelectItem>
                      <SelectItem value="BASIC">Basic Auth</SelectItem>
                      <SelectItem value="BEARER">Bearer Token</SelectItem>
                      <SelectItem value="JWT">JWT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="apiHeaders">Headers (one per line, e.g. "Content-Type: application/json")</Label>
                  <textarea
                    id="apiHeaders"
                    name="apiHeaders"
                    value={formValues.apiHeaders}
                    onChange={handleInputChange}
                    placeholder="Content-Type: application/json"
                    className="w-full h-24 p-2 rounded-md border"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="file" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="filePath">File Path</Label>
                  <Input
                    id="filePath"
                    name="filePath"
                    value={formValues.filePath}
                    onChange={handleInputChange}
                    placeholder="/path/to/data.csv"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fileType">File Type</Label>
                  <Select
                    value={formValues.fileType}
                    onValueChange={(value) => handleSelectChange("fileType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select file type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={FileType.CSV}>CSV</SelectItem>
                      <SelectItem value={FileType.JSON}>JSON</SelectItem>
                      <SelectItem value={FileType.XML}>XML</SelectItem>
                      <SelectItem value={FileType.EXCEL}>Excel</SelectItem>
                      <SelectItem value={FileType.PARQUET}>Parquet</SelectItem>
                      <SelectItem value={FileType.AVRO}>Avro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {formValues.fileType === FileType.CSV && (
                  <div className="space-y-2">
                    <Label htmlFor="fileDelimiter">Delimiter</Label>
                    <Input
                      id="fileDelimiter"
                      name="fileDelimiter"
                      value={formValues.fileDelimiter}
                      onChange={handleInputChange}
                      placeholder=","
                    />
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="in-memory" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="inMemoryData">Data (JSON format)</Label>
                  <textarea
                    id="inMemoryData"
                    name="inMemoryData"
                    value={formValues.inMemoryData}
                    onChange={handleInputChange}
                    placeholder='[{"id": 1, "name": "Example"}]'
                    className="w-full h-64 p-2 rounded-md border font-mono"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="custom" className="mt-4 space-y-4">
                <div className="p-4 rounded-md bg-gray-100">
                  <p className="text-sm text-gray-700">
                    Custom data sources allow for specialized implementations.
                    These are typically configured programmatically.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {editingDataSource ? "Update" : "Add"} Data Source
          </Button>
        </DialogFooter>
      </DialogContent>
    );
  };
  
  /**
   * Get icon for data source type
   */
  const getDataSourceIcon = (type: DataSourceType) => {
    switch (type) {
      case DataSourceType.DATABASE:
        return <Database className="w-4 h-4" />;
      case DataSourceType.API:
        return <Globe className="w-4 h-4" />;
      case DataSourceType.FILE:
        return <File className="w-4 h-4" />;
      case DataSourceType.IN_MEMORY:
        return <Server className="w-4 h-4" />;
      case DataSourceType.CUSTOM:
        return <Server className="w-4 h-4" />;
      default:
        return <Database className="w-4 h-4" />;
    }
  };
  
  /**
   * Get color for connection status
   */
  const getConnectionStatusColor = (status: boolean | undefined) => {
    if (status === undefined) return "bg-gray-500";
    return status ? "bg-green-500" : "bg-red-500";
  };
  
  /**
   * Render connection status
   */
  const renderConnectionStatus = (dataSource: DataSource) => {
    const testResult = testResults[dataSource.id];
    const isTesting = isTestingConnection[dataSource.id];
    
    if (isTesting) {
      return (
        <div className="flex items-center">
          <Clock className="w-4 h-4 text-blue-500 animate-spin mr-1" />
          <span className="text-sm text-blue-500">Testing...</span>
        </div>
      );
    }
    
    if (!testResult) {
      return (
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full bg-gray-500 mr-2"></div>
          <span className="text-sm text-gray-500">Not tested</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center">
        {testResult.success ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-500">Connected</span>
          </>
        ) : (
          <>
            <XCircle className="w-4 h-4 text-red-500 mr-1" />
            <span className="text-sm text-red-500">Failed</span>
          </>
        )}
      </div>
    );
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Data Sources</CardTitle>
          <CardDescription>Manage data sources for ETL operations</CardDescription>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Data Source
        </Button>
      </CardHeader>
      <CardContent>
        {dataSources.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-gray-500">No data sources added yet. Click "Add Data Source" to create one.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Connection Details</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dataSources.map((dataSource) => (
                <TableRow key={dataSource.id}>
                  <TableCell>
                    <div className="font-medium">{dataSource.name}</div>
                    {dataSource.description && (
                      <div className="text-sm text-gray-500">{dataSource.description}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className="flex items-center space-x-1">
                      {getDataSourceIcon(dataSource.type)}
                      <span>{dataSource.type}</span>
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-sm truncate">
                    {formatConnectionDetails(dataSource)}
                  </TableCell>
                  <TableCell>
                    {renderConnectionStatus(dataSource)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testConnection(dataSource)}
                        disabled={isTestingConnection[dataSource.id]}
                      >
                        <RotateCw className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingDataSource(dataSource);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(dataSource.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      
      {isDialogOpen && renderDialogContent()}
      
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Data Source</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this data source? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default DataSourceManager;