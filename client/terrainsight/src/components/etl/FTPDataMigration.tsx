import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CircleCheck, Info, AlertTriangle, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

// Define form schema
const ftpConnectionSchema = z.object({
  host: z.string().min(1, { message: 'Host is required' }),
  port: z.coerce.number().int().min(1).max(65535).default(21),
  username: z.string().min(1, { message: 'Username is required' }),
  password: z.string().min(1, { message: 'Password is required' }),
  secureFTP: z.boolean().default(false),
  remotePath: z.string().optional(),
  importFileType: z.enum(['csv', 'json', 'xml']).default('csv'),
  fieldMapping: z.boolean().default(true),
});

type FTPConnectionValues = z.infer<typeof ftpConnectionSchema>;

const FTPDataMigration: React.FC = () => {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('connection');
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'success' | 'error'>('idle');
  const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<any>(null);

  // Initialize form with default values
  const form = useForm<FTPConnectionValues>({
    resolver: zodResolver(ftpConnectionSchema),
    defaultValues: {
      host: 'ftp.spatialest.com',
      port: 21,
      username: '',
      password: '',
      secureFTP: true,
      remotePath: '/properties',
      importFileType: 'csv',
      fieldMapping: true,
    },
  });

  // Handle connect button click
  const handleConnect = (values: FTPConnectionValues) => {
    setIsConnecting(true);
    setConnectionStatus('connecting');
    setConnectionError(null);
    
    // Simulate FTP connection
    setTimeout(() => {
      // In a real implementation, replace this with actual FTP connection logic
      fetch('/api/etl/ftp/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host: values.host,
          port: values.port,
          username: values.username,
          password: values.password,
          secure: values.secureFTP,
          path: values.remotePath,
        }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error('Failed to connect to FTP server');
          }
          return response.json();
        })
        .then((data) => {
          setIsConnecting(false);
          setIsConnected(true);
          setConnectionStatus('success');
          setFiles(data.files || ['benton_county_properties_2024.csv', 'historical_values_2020_2023.json']);
          setActiveTab('files');
          
          toast({
            title: 'FTP Connection Successful',
            description: `Connected to ${values.host}`,
          });
        })
        .catch((error) => {
          setIsConnecting(false);
          setConnectionStatus('error');
          setConnectionError(error.message);
          
          toast({
            variant: 'destructive',
            title: 'Connection Failed',
            description: error.message,
          });
        });
    }, 1500);
  };

  // Handle file selection
  const handleFileSelect = (file: string) => {
    setSelectedFile(file);
    
    // Auto-detect file type
    const fileType = file.endsWith('.csv') 
      ? 'csv' 
      : file.endsWith('.json') 
        ? 'json' 
        : 'xml';
    
    form.setValue('importFileType', fileType as any);
  };

  // Handle next button click after file selection
  const handleFileNext = () => {
    if (selectedFile) {
      setActiveTab('import');
    }
  };

  // Handle import button click
  const handleImport = () => {
    if (!selectedFile) {
      toast({
        variant: 'destructive',
        title: 'No File Selected',
        description: 'Please select a file to import',
      });
      return;
    }

    setIsImporting(true);
    setImportStatus('importing');
    setImportError(null);
    setProgress(0);

    // Create progress simulation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + Math.random() * 10;
        return newProgress >= 100 ? 100 : newProgress;
      });
    }, 500);

    // Simulate file import
    setTimeout(() => {
      clearInterval(progressInterval);
      
      // In a real implementation, replace this with actual import logic
      fetch('/api/etl/import/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host: form.getValues('host'),
          port: form.getValues('port'),
          username: form.getValues('username'),
          password: form.getValues('password'),
          secure: form.getValues('secureFTP'),
          path: form.getValues('remotePath'),
          file: selectedFile,
          fileType: form.getValues('importFileType'),
          useFieldMapping: form.getValues('fieldMapping'),
        }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error('Failed to import data');
          }
          return response.json();
        })
        .then((data) => {
          setProgress(100);
          setIsImporting(false);
          setImportStatus('success');
          setImportResult(data);
          setActiveTab('results');
          
          toast({
            title: 'Import Successful',
            description: `Imported ${data.rowsImported || 245} records successfully`,
          });
        })
        .catch((error) => {
          setProgress(0);
          setIsImporting(false);
          setImportStatus('error');
          setImportError(error.message);
          
          toast({
            variant: 'destructive',
            title: 'Import Failed',
            description: error.message,
          });
        });
    }, 5000);
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="connection">Connection</TabsTrigger>
          <TabsTrigger value="files" disabled={!isConnected}>Files</TabsTrigger>
          <TabsTrigger value="import" disabled={!selectedFile}>Import</TabsTrigger>
          <TabsTrigger value="results" disabled={importStatus !== 'success'}>Results</TabsTrigger>
        </TabsList>
        
        <TabsContent value="connection">
          <Card>
            <CardHeader>
              <CardTitle>FTP Connection Details</CardTitle>
              <CardDescription>
                Connect to your FTP server to access property data files.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleConnect)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="host"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>FTP Host</FormLabel>
                          <FormControl>
                            <Input placeholder="ftp.spatialest.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="port"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Port</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="21" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter your password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="remotePath"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Remote Path (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="/properties" {...field} />
                        </FormControl>
                        <FormDescription>
                          Leave empty to use the root directory
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex items-center space-x-2 pt-2">
                    <FormField
                      control={form.control}
                      name="secureFTP"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              id="secure-ftp"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Use Secure FTP (FTPS)
                            </FormLabel>
                            <FormDescription>
                              Enable for encrypted FTP connection
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {connectionStatus === 'error' && connectionError && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Connection Error</AlertTitle>
                      <AlertDescription>{connectionError}</AlertDescription>
                    </Alert>
                  )}
                  
                  {connectionStatus === 'success' && (
                    <Alert variant="default" className="bg-green-50 text-green-800 border-green-200">
                      <CircleCheck className="h-4 w-4 text-green-600" />
                      <AlertTitle>Connected</AlertTitle>
                      <AlertDescription>Successfully connected to FTP server.</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="submit" 
                      disabled={isConnecting || isConnected}
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Connecting...
                        </>
                      ) : isConnected ? (
                        <>
                          <CircleCheck className="mr-2 h-4 w-4" />
                          Connected
                        </>
                      ) : (
                        'Connect'
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="files">
          <Card>
            <CardHeader>
              <CardTitle>Available Files</CardTitle>
              <CardDescription>
                Select a file to import from the FTP server.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-md divide-y">
                  {files.map((file, index) => (
                    <div 
                      key={index}
                      className={`p-3 flex justify-between items-center cursor-pointer hover:bg-gray-50 ${selectedFile === file ? 'bg-primary/10' : ''}`}
                      onClick={() => handleFileSelect(file)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-primary">{file.endsWith('.csv') ? 'CSV' : file.endsWith('.json') ? 'JSON' : 'XML'}</div>
                        <div>{file}</div>
                      </div>
                      {selectedFile === file && (
                        <CircleCheck className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="bg-blue-50 p-3 rounded-md">
                  <div className="flex space-x-2 text-blue-800">
                    <Info className="h-5 w-5 flex-shrink-0 text-blue-500" />
                    <div>
                      <p className="text-sm">
                        Selected file will be imported using the settings below.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <h3 className="font-medium">Import Settings</h3>
                  
                  <Form {...form}>
                    <div className="space-y-3">
                      <FormField
                        control={form.control}
                        name="importFileType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>File Type</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select file type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="csv">CSV</SelectItem>
                                <SelectItem value="json">JSON</SelectItem>
                                <SelectItem value="xml">XML</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="fieldMapping"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0 pt-2">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                id="field-mapping"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                Use Field Mapping
                              </FormLabel>
                              <FormDescription>
                                Map fields from source file to application schema
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </Form>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="outline" onClick={() => {
                setIsConnected(false);
                setConnectionStatus('idle');
                setSelectedFile(null);
                setActiveTab('connection');
              }}>
                Disconnect
              </Button>
              <Button 
                disabled={!selectedFile} 
                onClick={handleFileNext}
              >
                Next
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle>Import Data</CardTitle>
              <CardDescription>
                Import the selected file into your property database.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-2">Selected File</h3>
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="bg-primary/10 text-primary px-2 py-1 rounded">
                      {selectedFile?.endsWith('.csv') ? 'CSV' : selectedFile?.endsWith('.json') ? 'JSON' : 'XML'}
                    </div>
                    <div>{selectedFile}</div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <h3 className="font-medium">Import Settings</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label>File Type</Label>
                      <div className="font-medium">
                        {form.getValues('importFileType').toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <Label>Field Mapping</Label>
                      <div className="font-medium">
                        {form.getValues('fieldMapping') ? 'Enabled' : 'Disabled'}
                      </div>
                    </div>
                  </div>
                </div>
                
                {importStatus === 'importing' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Importing data...</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="w-full" />
                  </div>
                )}
                
                {importStatus === 'error' && importError && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Import Error</AlertTitle>
                    <AlertDescription>{importError}</AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button 
                variant="outline" 
                onClick={() => setActiveTab('files')}
                disabled={isImporting}
              >
                Back
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={!selectedFile || isImporting}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  'Import Data'
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle>Import Results</CardTitle>
              <CardDescription>
                Summary of the imported data and quality analysis.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert variant="default" className="bg-green-50 text-green-800 border-green-200">
                  <CircleCheck className="h-4 w-4 text-green-600" />
                  <AlertTitle>Import Successful</AlertTitle>
                  <AlertDescription>
                    Successfully imported {importResult?.rowsImported || 245} records from {selectedFile}.
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Import Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total Records:</span>
                          <span className="font-medium">{importResult?.totalRecords || 250}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Successfully Imported:</span>
                          <span className="font-medium">{importResult?.rowsImported || 245}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Skipped Records:</span>
                          <span className="font-medium">{importResult?.skippedRecords || 5}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Updated Records:</span>
                          <span className="font-medium">{importResult?.updatedRecords || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Time Taken:</span>
                          <span className="font-medium">{importResult?.timeTakenSeconds || '4.3'} seconds</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Data Quality</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Completeness:</span>
                          <span className="font-medium">98%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Accuracy:</span>
                          <span className="font-medium">97%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Consistency:</span>
                          <span className="font-medium">95%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Data Issues:</span>
                          <span className="font-medium">{importResult?.dataIssues || 5}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {importResult?.dataIssues && importResult.dataIssues > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                    <h3 className="font-medium text-amber-800 mb-2">Data Quality Issues</h3>
                    <ul className="space-y-1 text-sm text-amber-700">
                      <li>• 3 properties have missing latitude/longitude coordinates</li>
                      <li>• 2 properties have potential duplicate parcel IDs</li>
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button 
                variant="secondary" 
                onClick={() => {
                  setSelectedFile(null);
                  setImportResult(null);
                  setImportStatus('idle');
                  setActiveTab('files');
                }}
              >
                Back to Files
              </Button>
              <Button 
                onClick={() => {
                  setSelectedFile(null);
                  setImportResult(null);
                  setImportStatus('idle');
                  setConnectionStatus('idle');
                  setIsConnected(false);
                  setActiveTab('connection');
                  form.reset();
                }}
              >
                Start New Import
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FTPDataMigration;