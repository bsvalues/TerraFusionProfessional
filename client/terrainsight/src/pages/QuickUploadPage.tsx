import React, { useState, useRef, useCallback } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, FileUp, FileCode, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const QuickUploadPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('file');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [jsonText, setJsonText] = useState('');
  const [csvText, setCsvText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Reset upload state
    setUploadSuccess(false);
    setErrorMessage(null);
    
    // Process the file
    processFile(file);
  };
  
  const processFile = (file: File) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      
      if (file.name.endsWith('.json')) {
        try {
          // Parse JSON to validate format
          JSON.parse(content);
          setJsonText(content);
          setActiveTab('json');
        } catch (e) {
          setErrorMessage('Invalid JSON file format');
        }
      } else if (file.name.endsWith('.csv')) {
        setCsvText(content);
        setActiveTab('csv');
      } else {
        setErrorMessage('Unsupported file type. Please upload JSON or CSV.');
      }
    };
    
    reader.onerror = () => {
      setErrorMessage('Error reading file');
    };
    
    reader.readAsText(file);
  };
  
  const uploadData = async (format: 'json' | 'csv', data: string) => {
    setIsUploading(true);
    setProgress(0);
    setErrorMessage(null);
    
    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 5, 95));
    }, 300);
    
    try {
      // Prepare request body based on format
      let body: any = {};
      if (format === 'json') {
        try {
          // For JSON, we need to parse the data and send it as an array
          const parsedData = JSON.parse(data);
          body = {
            data: Array.isArray(parsedData) ? parsedData : [parsedData],
            source: 'manual-upload',
            fileType: 'json'
          };
        } catch (e) {
          throw new Error('Invalid JSON format');
        }
      } else {
        // For CSV, we'll send it as text and let the server parse it
        // Simple CSV to JSON conversion
        const lines = data.trim().split('\\n');
        const headers = lines[0].split(',').map(header => header.trim());
        const jsonData = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(value => value.trim());
          const row: any = {};
          
          for (let j = 0; j < headers.length; j++) {
            row[headers[j]] = values[j];
          }
          
          jsonData.push(row);
        }
        
        body = {
          data: jsonData,
          source: 'manual-upload',
          fileType: 'csv'
        };
      }
      
      // Send request to import endpoint
      const response = await fetch('/api/etl/import/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        throw new Error('Failed to import data');
      }
      
      const result = await response.json();
      setResult(result);
      setUploadSuccess(true);
      
      toast({
        title: 'Import Successful',
        description: `Imported ${result.successCount || 0} properties`,
      });
    } catch (error: any) {
      setErrorMessage(error.message || 'An error occurred during import');
      
      toast({
        variant: 'destructive',
        title: 'Import Failed',
        description: error.message,
      });
    } finally {
      clearInterval(progressInterval);
      setProgress(uploadSuccess ? 100 : 0);
      setIsUploading(false);
    }
  };
  
  const handleJsonUpload = useCallback(() => {
    if (!jsonText.trim()) {
      setErrorMessage('Please enter JSON data');
      return;
    }
    
    uploadData('json', jsonText);
  }, [jsonText]);
  
  const handleCsvUpload = useCallback(() => {
    if (!csvText.trim()) {
      setErrorMessage('Please enter CSV data');
      return;
    }
    
    uploadData('csv', csvText);
  }, [csvText]);
  
  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };
  
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <PageHeader
        heading="Quick Property Data Upload"
        description="Upload your property data directly to the database"
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 grid grid-cols-3 w-full md:w-auto">
          <TabsTrigger value="file">Upload File</TabsTrigger>
          <TabsTrigger value="json">JSON</TabsTrigger>
          <TabsTrigger value="csv">CSV</TabsTrigger>
        </TabsList>
        
        <TabsContent value="file">
          <Card>
            <CardHeader>
              <CardTitle>Upload Property Data File</CardTitle>
              <CardDescription>
                Select a CSV or JSON file containing your property data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={triggerFileUpload}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".csv,.json"
                  onChange={handleFileChange}
                />
                <FileUp className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">Click to select or drag and drop</p>
                <p className="text-xs text-gray-500 mt-1">CSV or JSON files only</p>
              </div>
              
              {errorMessage && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="json">
          <Card>
            <CardHeader>
              <CardTitle>JSON Data</CardTitle>
              <CardDescription>
                Paste your property data in JSON format
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea 
                placeholder='[{"parcelId": "ABC123", "address": "123 Main St", "squareFeet": 2000, ...}]'
                className="font-mono h-64 resize-none"
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
              />
              
              {errorMessage && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}
              
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Uploading...</span>
                    <span className="text-sm font-medium">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
              
              {uploadSuccess && (
                <Alert variant="default" className="bg-green-50 border-green-100">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>
                    Successfully imported {result?.successCount || 0} properties.
                    {result?.errorCount > 0 && ` There were ${result.errorCount} errors.`}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                onClick={handleJsonUpload} 
                disabled={isUploading || !jsonText.trim()}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload JSON
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="csv">
          <Card>
            <CardHeader>
              <CardTitle>CSV Data</CardTitle>
              <CardDescription>
                Paste your property data in CSV format
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea 
                placeholder="parcelId,address,squareFeet,value\nABC123,123 Main St,2000,$450000"
                className="font-mono h-64 resize-none"
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
              />
              
              {errorMessage && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}
              
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Uploading...</span>
                    <span className="text-sm font-medium">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
              
              {uploadSuccess && (
                <Alert variant="default" className="bg-green-50 border-green-100">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>
                    Successfully imported {result?.successCount || 0} properties.
                    {result?.errorCount > 0 && ` There were ${result.errorCount} errors.`}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                onClick={handleCsvUpload} 
                disabled={isUploading || !csvText.trim()}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload CSV
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QuickUploadPage;