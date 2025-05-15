import React, { useState, useRef, ChangeEvent } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import { AlertCircle, CheckCircle, FileUp, FileX, Loader2, UploadCloud, Database, FileJson, FileSpreadsheet, Info } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip } from "@/components/ui/tooltip";
import { Badge } from '@/components/ui/badge';

/**
 * Property Bulk Import Component
 * 
 * This component allows users to bulk import property data from JSON format or file upload.
 */
const PropertyBulkImport: React.FC = () => {
  const { toast } = useToast();
  const [jsonData, setJsonData] = useState<string>('');
  const [validationStatus, setValidationStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [validatedData, setValidatedData] = useState<any[]>([]);
  const [importMethod, setImportMethod] = useState<'paste' | 'upload'>('paste');
  const [allowDuplicates, setAllowDuplicates] = useState<boolean>(false);
  const [updateExisting, setUpdateExisting] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Import statistics
  const [importStats, setImportStats] = useState<{
    total: number;
    success: number;
    duplicates: number;
    errors: number;
    updated: number;
  }>({
    total: 0,
    success: 0,
    duplicates: 0,
    errors: 0,
    updated: 0
  });
  
  // Mutation for bulk importing properties
  const importMutation = useMutation({
    mutationFn: async (properties: any[]) => {
      // Start with 0% progress
      setUploadProgress(0);
      
      // Simulate progress during the request
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          // Don't go to 100% until we get a response
          return prev < 90 ? prev + 5 : prev;
        });
      }, 300);
      
      // Make the actual request
      try {
        const response = await apiRequest('/api/properties/bulk-import', 'POST', properties);
        clearInterval(interval);
        setUploadProgress(100);
        return response;
      } catch (error) {
        clearInterval(interval);
        throw error;
      }
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      setImportStats({
        total: validatedData.length,
        success: response.count,
        duplicates: (response.errors?.filter((e: any) => e.error?.includes('Duplicate parcel ID')) || []).length,
        errors: (response.errors || []).length,
        updated: response.updated || 0
      });
      
      toast({
        title: 'Import Successful',
        description: `Successfully imported ${response.count} properties.`,
        variant: 'default'
      });
      
      // Reset progress after a delay to show 100% complete
      setTimeout(() => {
        setUploadProgress(0);
        setUploadStatus('success');
      }, 1000);
    },
    onError: (error: any) => {
      setUploadStatus('error');
      setUploadProgress(0);
      toast({
        title: 'Import Failed',
        description: error.message || 'Failed to import properties. Please try again.',
        variant: 'destructive'
      });
    }
  });
  
  /**
   * Handle file input change
   */
  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadStatus('uploading');
    setUploadProgress(10);
    
    const reader = new FileReader();
    
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 80);
        setUploadProgress(10 + progress);
      }
    };
    
    reader.onload = (event) => {
      setUploadStatus('processing');
      setUploadProgress(90);
      try {
        const fileContent = event.target?.result as string;
        
        if (file.name.endsWith('.json')) {
          setJsonData(fileContent);
          // Auto-validate after loading
          setTimeout(() => {
            validateJsonData(fileContent);
            setUploadStatus('idle');
            setUploadProgress(0);
          }, 500);
        } else {
          throw new Error('Unsupported file format. Please upload a JSON file.');
        }
      } catch (error: any) {
        setUploadStatus('error');
        setUploadProgress(0);
        toast({
          title: 'File Processing Error',
          description: error.message || 'Failed to process the file.',
          variant: 'destructive'
        });
      }
    };
    
    reader.onerror = () => {
      setUploadStatus('error');
      setUploadProgress(0);
      toast({
        title: 'File Read Error',
        description: 'Failed to read the file. Please try again.',
        variant: 'destructive'
      });
    };
    
    reader.readAsText(file);
  };
  
  /**
   * Trigger file input click
   */
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  /**
   * Validate JSON data
   */
  const validateData = () => {
    validateJsonData(jsonData);
  };
  
  /**
   * Validate JSON data from string
   */
  const validateJsonData = (data: string) => {
    setValidationStatus('validating');
    setValidationErrors([]);
    
    try {
      // Parse JSON
      const parsed = JSON.parse(data);
      
      // Ensure it's an array
      if (!Array.isArray(parsed)) {
        setValidationStatus('invalid');
        setValidationErrors([{ message: 'Data must be an array of properties' }]);
        return;
      }
      
      // Check if it's empty
      if (parsed.length === 0) {
        setValidationStatus('invalid');
        setValidationErrors([{ message: 'No properties found in data' }]);
        return;
      }
      
      // Validate required fields for each property
      const errors: any[] = [];
      const valid = parsed.every((property, index) => {
        const localErrors: string[] = [];
        
        if (!property.parcelId) {
          localErrors.push('Missing parcelId');
        }
        
        if (!property.address) {
          localErrors.push('Missing address');
        }
        
        if (property.squareFeet === undefined || isNaN(Number(property.squareFeet))) {
          localErrors.push('Invalid or missing squareFeet (must be a number)');
        }
        
        if (localErrors.length > 0) {
          errors.push({
            index,
            property,
            messages: localErrors
          });
          return false;
        }
        
        return true;
      });
      
      if (!valid) {
        setValidationStatus('invalid');
        setValidationErrors(errors);
        return;
      }
      
      // Data is valid
      setValidationStatus('valid');
      setValidatedData(parsed);
    } catch (error: any) {
      setValidationStatus('invalid');
      setValidationErrors([{ message: `Invalid JSON: ${error.message}` }]);
    }
  };
  
  /**
   * Handle bulk import
   */
  const handleImport = () => {
    if (validatedData.length === 0 || validationStatus !== 'valid') {
      toast({
        title: 'Validation Required',
        description: 'Please validate the data before importing.',
        variant: 'destructive'
      });
      return;
    }
    
    // Add import options to the payload
    const enhancedData = validatedData.map(item => ({
      ...item,
      _importOptions: {
        allowDuplicates,
        updateExisting
      }
    }));
    
    importMutation.mutate(enhancedData);
  };
  
  /**
   * Clear form
   */
  const handleClear = () => {
    setJsonData('');
    setValidationStatus('idle');
    setValidationErrors([]);
    setValidatedData([]);
    setUploadStatus('idle');
    setUploadProgress(0);
    
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  /**
   * Load sample data
   */
  const loadSampleData = () => {
    const sampleData = [
      {
        parcelId: 'P123456',
        address: '123 Main St, Richland, WA',
        squareFeet: 2500,
        owner: 'John Doe',
        value: '450000',
        yearBuilt: 1998,
        landValue: '120000',
        coordinates: [46.2804, -119.2752],
        neighborhood: 'North Richland',
        bedrooms: 3,
        bathrooms: 2.5,
        lotSize: 8500,
        propertyType: 'residential'
      },
      {
        parcelId: 'P789012',
        address: '456 Oak Ave, Kennewick, WA',
        squareFeet: 2100,
        owner: 'Jane Smith',
        value: '375000',
        yearBuilt: 2004,
        landValue: '95000',
        coordinates: [46.2087, -119.1361],
        neighborhood: 'South Kennewick',
        bedrooms: 3,
        bathrooms: 2,
        lotSize: 7200,
        propertyType: 'residential'
      }
    ];
    
    setJsonData(JSON.stringify(sampleData, null, 2));
    setValidationStatus('idle');
    setValidationErrors([]);
    setValidatedData([]);
  };
  
  /**
   * Get property type badge with appropriate color
   */
  const getPropertyTypeBadge = (type: string | null | undefined) => {
    if (!type) return <Badge variant="outline">N/A</Badge>;
    
    const typeMap: Record<string, { color: "default" | "secondary" | "destructive" | "outline" }> = {
      residential: { color: "default" },
      commercial: { color: "secondary" },
      industrial: { color: "destructive" },
      vacant: { color: "outline" },
      farm: { color: "outline" }
    };
    
    const settings = typeMap[type.toLowerCase()] || { color: "outline" };
    
    return <Badge variant={settings.color}>{type}</Badge>;
  };
  
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Bulk Property Import</CardTitle>
        <CardDescription>
          Import multiple properties at once by pasting JSON data or uploading a file.
          Each property must have at minimum: parcelId, address, and squareFeet.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="paste" onValueChange={(value) => setImportMethod(value as 'paste' | 'upload')}>
          <TabsList className="mb-4 grid w-full grid-cols-2">
            <TabsTrigger value="paste" className="flex items-center gap-1.5">
              <FileJson className="h-4 w-4" />
              Paste JSON
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-1.5">
              <UploadCloud className="h-4 w-4" />
              Upload File
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="paste" className="space-y-4">
            <div>
              <Label htmlFor="json-data">Property Data (JSON format)</Label>
              <Textarea
                id="json-data"
                value={jsonData}
                onChange={(e) => setJsonData(e.target.value)}
                placeholder="Paste JSON array of properties here..."
                className="font-mono h-64"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadSampleData}
                type="button"
              >
                Load Sample Data
              </Button>
              
              <Button
                variant="secondary"
                size="sm"
                onClick={validateData}
                disabled={!jsonData.trim() || validationStatus === 'validating'}
                type="button"
              >
                {validationStatus === 'validating' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validating...
                  </>
                ) : (
                  'Validate Data'
                )}
              </Button>
              
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClear}
                type="button"
              >
                Clear
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="upload" className="space-y-4">
            <div 
              className={`border-2 border-dashed rounded-lg p-10 text-center ${
                uploadStatus === 'error' ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-primary/50 hover:bg-gray-50'
              } transition-colors cursor-pointer`}
              onClick={triggerFileInput}
            >
              <input 
                type="file" 
                className="hidden" 
                ref={fileInputRef}
                accept=".json"
                onChange={handleFileInputChange}
              />
              
              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <UploadCloud className="h-6 w-6 text-primary" />
                </div>
                
                <div>
                  <p className="text-lg font-medium">
                    {uploadStatus === 'error' ? 'Upload Failed' : 'Upload Property Data File'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {uploadStatus === 'error' 
                      ? 'Please try again with a valid file' 
                      : 'Drag and drop or click to select a file (.json)'}
                  </p>
                </div>
                
                {uploadStatus === 'uploading' || uploadStatus === 'processing' ? (
                  <div className="space-y-2 max-w-md mx-auto">
                    <p className="text-sm font-medium text-gray-700">
                      {uploadStatus === 'uploading' ? 'Uploading file...' : 'Processing data...'}
                    </p>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                ) : (
                  <Button variant="secondary" size="sm" type="button" onClick={(e) => {
                    e.stopPropagation();
                    triggerFileInput();
                  }}>
                    Select File
                  </Button>
                )}
              </div>
            </div>
            
            {jsonData && (
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  File loaded successfully. Please validate the data.
                </p>
                
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={validateData}
                  disabled={!jsonData.trim() || validationStatus === 'validating'}
                  type="button"
                >
                  {validationStatus === 'validating' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    'Validate Data'
                  )}
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        {/* Import Options */}
        {validationStatus === 'valid' && (
          <div className="mt-6 border rounded-md p-4 bg-gray-50 space-y-4">
            <h3 className="text-sm font-medium flex items-center">
              <Database className="h-4 w-4 mr-2 text-primary" />
              Import Options
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="allow-duplicates" className="text-sm">Allow Duplicates</Label>
                  <Tooltip content={
                    <span className="max-w-xs">
                      When enabled, properties with duplicate parcel IDs will still be imported.
                      By default, duplicates are rejected.
                    </span>
                  }>
                    <Info className="h-4 w-4 text-gray-400" />
                  </Tooltip>
                </div>
                <Switch 
                  id="allow-duplicates" 
                  checked={allowDuplicates}
                  onCheckedChange={setAllowDuplicates}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="update-existing" className="text-sm">Update Existing Properties</Label>
                  <Tooltip content={
                    <span className="max-w-xs">
                      When enabled, existing properties with the same parcel ID will be updated
                      instead of rejected as duplicates.
                    </span>
                  }>
                    <Info className="h-4 w-4 text-gray-400" />
                  </Tooltip>
                </div>
                <Switch 
                  id="update-existing" 
                  checked={updateExisting}
                  onCheckedChange={setUpdateExisting}
                />
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-6 space-y-4">
          {validationStatus === 'valid' && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-green-800 font-medium">
                  Data validated successfully: {validatedData.length} properties ready to import
                </span>
              </div>
            </div>
          )}
          
          {validationStatus === 'invalid' && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-center mb-2">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-red-800 font-medium">
                  Validation failed
                </span>
              </div>
              
              <div className="text-red-700 text-sm max-h-40 overflow-y-auto">
                {validationErrors.map((error, index) => (
                  <div key={index} className="mb-2">
                    {error.message ? (
                      <p>{error.message}</p>
                    ) : (
                      <>
                        <p>Error in property at index {error.index}:</p>
                        <ul className="list-disc list-inside pl-4">
                          {error.messages.map((msg: string, i: number) => (
                            <li key={i}>{msg}</li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {validationStatus === 'valid' && validatedData.length > 0 && (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parcel ID</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Square Feet</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validatedData.slice(0, 5).map((property, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-xs">{property.parcelId}</TableCell>
                      <TableCell>{property.address}</TableCell>
                      <TableCell>{property.squareFeet.toLocaleString()}</TableCell>
                      <TableCell>{getPropertyTypeBadge(property.propertyType)}</TableCell>
                    </TableRow>
                  ))}
                  {validatedData.length > 5 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        ... and {validatedData.length - 5} more properties
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          
          {importMutation.isPending && (
            <div className="space-y-2">
              <div className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Importing properties...</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
          
          {/* Import Statistics */}
          {importMutation.isSuccess && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Import Summary</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-white p-3 rounded-md shadow-sm">
                  <p className="text-xs uppercase text-gray-500">Total</p>
                  <p className="text-2xl font-bold text-gray-800">{importStats.total}</p>
                </div>
                <div className="bg-white p-3 rounded-md shadow-sm">
                  <p className="text-xs uppercase text-gray-500">Imported</p>
                  <p className="text-2xl font-bold text-green-600">{importStats.success}</p>
                </div>
                <div className="bg-white p-3 rounded-md shadow-sm">
                  <p className="text-xs uppercase text-gray-500">Updated</p>
                  <p className="text-2xl font-bold text-blue-600">{importStats.updated}</p>
                </div>
                <div className="bg-white p-3 rounded-md shadow-sm">
                  <p className="text-xs uppercase text-gray-500">Errors</p>
                  <p className="text-2xl font-bold text-red-600">{importStats.errors}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleClear}
          type="button"
        >
          <FileX className="mr-2 h-4 w-4" />
          Clear
        </Button>
        
        <Button
          disabled={validationStatus !== 'valid' || importMutation.isPending}
          onClick={handleImport}
          type="button"
        >
          {importMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <FileUp className="mr-2 h-4 w-4" />
              Import Properties
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PropertyBulkImport;