import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, FileText, Upload, Check, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { parseCSV, convertCSVToProperties, importProperties, defaultPropertyFieldMapping } from '@/services/importService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InsertProperty } from '@shared/schema';

interface CSVImportDialogProps {
  trigger?: React.ReactNode;
  onImportComplete?: (result: { imported: number }) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function CSVImportDialog({ trigger, onImportComplete, isOpen, onClose }: CSVImportDialogProps) {
  const [open, setOpen] = useState(isOpen || false);
  const [file, setFile] = useState<File | null>(null);
  
  // Handle prop-driven open state
  React.useEffect(() => {
    if (isOpen !== undefined) {
      setOpen(isOpen);
    }
  }, [isOpen]);
  const [csvContent, setCsvContent] = useState<string>('');
  const [hasHeaderRow, setHasHeaderRow] = useState(true);
  const [parsedData, setParsedData] = useState<Record<string, string>[]>([]);
  const [properties, setProperties] = useState<Partial<InsertProperty>[]>([]);
  const [importResult, setImportResult] = useState<{ success: boolean; imported: number; errors: any[] } | null>(null);
  const [importing, setImporting] = useState(false);
  const [importStep, setImportStep] = useState<'upload' | 'preview' | 'mapping' | 'confirm' | 'complete'>('upload');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetDialog = () => {
    setFile(null);
    setCsvContent('');
    setParsedData([]);
    setProperties([]);
    setImportResult(null);
    setImporting(false);
    setImportStep('upload');
    setProgress(0);
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setError(null);

      // Read the file content
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          setCsvContent(content);
          const parsed = parseCSV(content, hasHeaderRow);
          setParsedData(parsed);
          setImportStep('preview');
        } catch (err: any) {
          setError(`Error parsing CSV file: ${err.message}`);
        }
      };
      reader.onerror = () => {
        setError('Error reading file');
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleProcessData = () => {
    try {
      // Convert CSV data to property objects using default field mapping
      const propertyData = convertCSVToProperties(parsedData, defaultPropertyFieldMapping);
      setProperties(propertyData);
      setImportStep('confirm');
    } catch (err: any) {
      setError(`Error processing data: ${err.message}`);
    }
  };

  const handleImport = async () => {
    if (properties.length === 0) {
      setError('No properties to import');
      return;
    }

    setImporting(true);
    setProgress(10);
    setError(null);

    try {
      setProgress(30);
      const result = await importProperties(properties);
      setProgress(100);
      setImportResult(result);
      setImportStep('complete');
      
      if (onImportComplete) {
        onImportComplete({ imported: result.imported });
      }
    } catch (err: any) {
      setError(`Import failed: ${err.message}`);
      setProgress(0);
    } finally {
      setImporting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen && onClose) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || <Button className="flex items-center gap-2"><FileText className="w-4 h-4" /> Import Properties</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Properties from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file containing property data to import into the system.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-center mb-4">
          <Tabs value={importStep} className="w-full">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="upload" disabled={importStep !== 'upload'}>Upload</TabsTrigger>
              <TabsTrigger value="preview" disabled={importStep !== 'preview'}>Preview</TabsTrigger>
              <TabsTrigger value="confirm" disabled={importStep !== 'confirm'}>Confirm</TabsTrigger>
              <TabsTrigger value="complete" disabled={importStep !== 'complete'}>Complete</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="space-y-4">
              <div className="flex items-center gap-2">
                <Input 
                  ref={fileInputRef} 
                  type="file" 
                  accept=".csv" 
                  onChange={handleFileChange} 
                  className="hidden"
                />
                <Button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="w-full h-24 border-dashed border-2"
                  variant="outline"
                >
                  <div className="flex flex-col items-center justify-center w-full">
                    <Upload className="w-6 h-6 mb-2" />
                    <span>Click to select a CSV file</span>
                    <span className="text-xs text-muted-foreground mt-1">
                      {file ? file.name : 'No file selected'}
                    </span>
                  </div>
                </Button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input 
                  type="checkbox" 
                  id="hasHeaderRow" 
                  checked={hasHeaderRow} 
                  onChange={(e) => setHasHeaderRow(e.target.checked)}
                />
                <label htmlFor="hasHeaderRow">CSV file has header row</label>
              </div>
            </TabsContent>
            
            <TabsContent value="preview" className="space-y-4">
              {parsedData.length > 0 ? (
                <>
                  <div className="border rounded-md overflow-hidden">
                    <div className="overflow-x-auto max-h-[300px]">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            {Object.keys(parsedData[0]).map((header, i) => (
                              <th key={i} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {parsedData.slice(0, 5).map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              {Object.values(row).map((cell, cellIndex) => (
                                <td key={cellIndex} className="px-3 py-2 text-sm text-gray-500">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {parsedData.length > 5 && (
                      <div className="py-1 px-3 bg-gray-50 text-xs text-gray-500">
                        Showing 5 of {parsedData.length} rows
                      </div>
                    )}
                  </div>
                  <Button onClick={handleProcessData}>Continue</Button>
                </>
              ) : (
                <div className="text-center p-4 text-gray-500">
                  No data available. Please upload a valid CSV file.
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="confirm" className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-md">
                  <h4 className="font-medium mb-2">Ready to import {properties.length} properties</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• {properties.filter(p => p.parcelId).length} properties with parcel IDs</li>
                    <li>• {properties.filter(p => p.coordinates).length} properties with coordinates</li>
                    <li>• {properties.filter(p => p.squareFeet).length} properties with square footage</li>
                  </ul>
                </div>
                
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Confirmation</AlertTitle>
                  <AlertDescription>
                    This will import {properties.length} properties into the system. This action cannot be undone easily.
                  </AlertDescription>
                </Alert>
                
                <Button 
                  onClick={handleImport} 
                  disabled={importing || properties.length === 0}
                  className="w-full"
                >
                  {importing ? 'Importing...' : `Import ${properties.length} Properties`}
                </Button>
                
                {importing && <Progress value={progress} className="w-full" />}
              </div>
            </TabsContent>
            
            <TabsContent value="complete" className="space-y-4">
              {importResult && (
                <div className="space-y-4">
                  <div className={`p-6 rounded-md flex items-center ${importResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className={`rounded-full p-2 mr-4 ${importResult.success ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {importResult.success ? <Check className="h-6 w-6" /> : <X className="h-6 w-6" />}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">
                        {importResult.success ? 'Import Successful' : 'Import Completed with Errors'}
                      </h3>
                      <p className="text-sm mt-1">
                        {importResult.imported} of {properties.length} properties were imported successfully.
                      </p>
                      {importResult.errors.length > 0 && (
                        <p className="text-sm text-red-600 mt-1">
                          {importResult.errors.length} errors occurred during import.
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {importResult.errors.length > 0 && (
                    <div className="border rounded-md overflow-hidden">
                      <div className="p-3 bg-red-50 font-medium">Import Errors</div>
                      <div className="max-h-[200px] overflow-y-auto">
                        <ul className="divide-y">
                          {importResult.errors.slice(0, 5).map((error, index) => (
                            <li key={index} className="p-3 text-sm">
                              <strong>Error:</strong> {error.message}
                              {error.property && (
                                <div className="mt-1 text-xs text-gray-500">
                                  <pre className="whitespace-pre-wrap">{JSON.stringify(error.property, null, 2)}</pre>
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                      {importResult.errors.length > 5 && (
                        <div className="p-2 bg-gray-50 text-xs text-gray-500">
                          Showing 5 of {importResult.errors.length} errors
                        </div>
                      )}
                    </div>
                  )}
                  
                  <Button 
                    onClick={() => {
                      handleOpenChange(false);
                      resetDialog();
                    }}
                    className="w-full"
                  >
                    Close
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <DialogFooter className="flex justify-between">
          {importStep !== 'upload' && importStep !== 'complete' && (
            <Button
              variant="outline"
              onClick={() => {
                if (importStep === 'preview') setImportStep('upload');
                if (importStep === 'confirm') setImportStep('preview');
              }}
            >
              Back
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => {
              handleOpenChange(false);
              resetDialog();
            }}
          >
            {importStep === 'complete' ? 'Done' : 'Cancel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}