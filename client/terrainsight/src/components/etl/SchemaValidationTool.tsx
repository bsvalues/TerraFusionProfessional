import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { BarChart2, ShieldCheck, FileText, RefreshCw, Upload, Check, AlertCircle, Database, Info, Copy, ArrowRight, Settings, Trash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { schemaValidationService, SchemaName, SchemaValidationResult } from '../../services/etl/SchemaValidationService';
import { Tooltip } from '@/components/ui/custom-tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';

/**
 * Schema Validation Tool
 * 
 * A UI for validating data against defined schemas from the database
 */
export function SchemaValidationTool() {
  const { toast } = useToast();
  
  // State for input data
  const [inputData, setInputData] = useState<string>('');
  const [parsedData, setParsedData] = useState<any[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  
  // State for schema validation
  const [selectedSchema, setSelectedSchema] = useState<SchemaName>(SchemaName.PROPERTY);
  const [validationOptions, setValidationOptions] = useState({
    stripUnknown: false,
    coerce: true,
    stopOnFirstError: false,
  });
  
  // Validation results
  const [validationResult, setValidationResult] = useState<SchemaValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('input');
  
  // Schema metadata
  const [fieldMetadata, setFieldMetadata] = useState<Record<string, { type: string; required: boolean; description?: string }>>({});
  
  // Update field metadata when selected schema changes
  useEffect(() => {
    try {
      const metadata = schemaValidationService.getFieldMetadata(selectedSchema);
      setFieldMetadata(metadata);
    } catch (error) {
      console.error('Error loading schema metadata:', error);
      toast({
        title: 'Error loading schema metadata',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    }
  }, [selectedSchema, toast]);
  
  // Parse input data
  const parseData = () => {
    try {
      setParseError(null);
      
      // Trim the input and check if it's empty
      if (!inputData.trim()) {
        setParsedData([]);
        return;
      }
      
      // Check if input is an array or object
      const trimmedInput = inputData.trim();
      const firstChar = trimmedInput.charAt(0);
      const lastChar = trimmedInput.charAt(trimmedInput.length - 1);
      
      let data;
      if ((firstChar === '[' && lastChar === ']') || (firstChar === '{' && lastChar === '}')) {
        // JSON format
        data = JSON.parse(trimmedInput);
        
        // If it's a single object, wrap it in an array
        if (!Array.isArray(data) && typeof data === 'object' && data !== null) {
          data = [data];
        }
      } else {
        // Try to parse as CSV or other formats in the future
        throw new Error('Input must be valid JSON array or object');
      }
      
      // Ensure data is an array
      if (!Array.isArray(data)) {
        throw new Error('Parsed data must be an array of objects');
      }
      
      // Ensure each item is an object
      if (data.some(item => typeof item !== 'object' || item === null)) {
        throw new Error('Each item in the array must be an object');
      }
      
      setParsedData(data);
      
      // Switch to validation tab if we have successful parse
      setActiveTab('validation');
      
      return data;
    } catch (error) {
      console.error('Error parsing data:', error);
      setParseError(error instanceof Error ? error.message : 'Failed to parse the input data');
      setParsedData(null);
      return null;
    }
  };
  
  // Handle validation
  const handleValidate = async () => {
    try {
      setIsValidating(true);
      
      // Parse data first if not already parsed
      const dataToValidate = parsedData || parseData();
      
      if (!dataToValidate) {
        // Parse failed
        return;
      }
      
      // Validate against schema
      const result = schemaValidationService.validate(dataToValidate, {
        schemaName: selectedSchema,
        stopOnFirstError: validationOptions.stopOnFirstError,
        options: {
          stripUnknown: validationOptions.stripUnknown,
          coerce: validationOptions.coerce,
        },
      });
      
      setValidationResult(result);
      
      // Show toast notification
      if (result.valid) {
        toast({
          title: 'Validation successful',
          description: `All ${result.totalRecords} records are valid`,
          variant: 'default',
        });
      } else {
        toast({
          title: 'Validation failed',
          description: `Found ${result.errors.length} errors in ${result.invalidRecords} of ${result.totalRecords} records`,
          variant: 'destructive',
        });
      }
      
      // Switch to results tab
      setActiveTab('results');
    } catch (error) {
      console.error('Validation error:', error);
      toast({
        title: 'Validation error',
        description: error instanceof Error ? error.message : 'An unknown error occurred during validation',
        variant: 'destructive',
      });
    } finally {
      setIsValidating(false);
    }
  };
  
  // Handle clear
  const handleClear = () => {
    setInputData('');
    setParsedData(null);
    setParseError(null);
    setValidationResult(null);
    setActiveTab('input');
  };
  
  // Render schema field documentation
  const renderSchemaFields = () => {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Field</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="w-20">Required</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(fieldMetadata).map(([field, info]) => (
              <TableRow key={field}>
                <TableCell className="font-medium">{field}</TableCell>
                <TableCell>
                  <Badge variant="outline">{info.type}</Badge>
                </TableCell>
                <TableCell>
                  {info.required ? (
                    <Check size={16} className="text-green-500" />
                  ) : (
                    <div className="text-gray-400 text-xs">Optional</div>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {info.description || '-'}
                </TableCell>
              </TableRow>
            ))}
            {Object.keys(fieldMetadata).length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                  No schema fields available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };
  
  // Render validation results
  const renderValidationResults = () => {
    if (!validationResult) {
      return (
        <div className="text-center p-6 text-muted-foreground">
          No validation results available. Validate data to see results.
        </div>
      );
    }
    
    // Calculate validation score
    const score = validationResult.valid ? 100 : Math.min(
      100,
      Math.max(
        0,
        Math.round(
          ((validationResult.validRecords / validationResult.totalRecords) * 100) || 0
        )
      )
    );
    
    return (
      <div className="space-y-6">
        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Validated Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {validationResult.validRecords} / {validationResult.totalRecords}
              </div>
              <p className="text-xs text-muted-foreground">
                {validationResult.validRecords === validationResult.totalRecords 
                  ? 'All records are valid' 
                  : `${validationResult.invalidRecords} records have issues`}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Data Quality</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Score</span>
                  <span className="font-medium">{score}%</span>
                </div>
                <Progress value={score} className="h-2" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Validation Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {validationResult.errors.length}
              </div>
              <p className="text-xs text-muted-foreground">
                {validationResult.errors.length === 0 
                  ? 'No validation errors found' 
                  : `Across ${validationResult.invalidRecords} invalid records`}
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Detailed Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Completeness</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Score</span>
                  <span className="font-medium">{Math.round(validationResult.stats.completeness.score * 100)}%</span>
                </div>
                <Progress value={validationResult.stats.completeness.score * 100} className="h-2" />
              </div>
              {Object.keys(validationResult.stats.completeness.missingFields).length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground">Top missing fields:</p>
                  <ul className="text-xs mt-1 space-y-1">
                    {Object.entries(validationResult.stats.completeness.missingFields)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 3)
                      .map(([field, count]) => (
                        <li key={field} className="flex justify-between">
                          <span className="font-medium">{field}</span>
                          <span>{count} records</span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Score</span>
                  <span className="font-medium">{Math.round(validationResult.stats.accuracy.score * 100)}%</span>
                </div>
                <Progress value={validationResult.stats.accuracy.score * 100} className="h-2" />
              </div>
              {Object.keys(validationResult.stats.accuracy.invalidValues).length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground">Top invalid fields:</p>
                  <ul className="text-xs mt-1 space-y-1">
                    {Object.entries(validationResult.stats.accuracy.invalidValues)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 3)
                      .map(([field, count]) => (
                        <li key={field} className="flex justify-between">
                          <span className="font-medium">{field}</span>
                          <span>{count} records</span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Consistency</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Score</span>
                  <span className="font-medium">{Math.round(validationResult.stats.consistency.score * 100)}%</span>
                </div>
                <Progress value={validationResult.stats.consistency.score * 100} className="h-2" />
              </div>
              {Object.keys(validationResult.stats.consistency.inconsistentValues).length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground">Top inconsistent fields:</p>
                  <ul className="text-xs mt-1 space-y-1">
                    {Object.entries(validationResult.stats.consistency.inconsistentValues)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 3)
                      .map(([field, count]) => (
                        <li key={field} className="flex justify-between">
                          <span className="font-medium">{field}</span>
                          <span>{count} records</span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Error List */}
        {validationResult.errors.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-2">Validation Errors</h3>
            <ScrollArea className="h-[300px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Record #</TableHead>
                    <TableHead>Field</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validationResult.errors.map((error, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{error.recordIndex + 1}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{error.field}</Badge>
                      </TableCell>
                      <TableCell className="text-red-500 text-sm">{error.message}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        )}
        
        {/* Field Validation Summary */}
        <div>
          <h3 className="text-lg font-medium mb-2">Field Validation Summary</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Field</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Issues</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(validationResult.fieldValidation).map(([field, validation]) => (
                <TableRow key={field}>
                  <TableCell className="font-medium">{field}</TableCell>
                  <TableCell>
                    {validation.valid ? (
                      <Badge className="bg-green-100 text-green-800">Valid</Badge>
                    ) : (
                      <Badge variant="destructive">Invalid</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {validation.errors.length > 0 ? (
                      <Collapsible>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="p-0 h-6">
                            <Info size={14} className="mr-1" /> 
                            {validation.errors.length} issues
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <ul className="text-sm text-red-500 mt-2 space-y-1 pl-4">
                            {validation.errors.map((error, idx) => (
                              <li key={idx} className="list-disc">{error}</li>
                            ))}
                          </ul>
                        </CollapsibleContent>
                      </Collapsible>
                    ) : (
                      <span className="text-sm text-muted-foreground">No issues</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };
  
  // Render data preview
  const renderDataPreview = () => {
    if (!parsedData || parsedData.length === 0) {
      return (
        <div className="text-center p-6 text-muted-foreground">
          No data available to preview.
        </div>
      );
    }
    
    // Get all field names across all records
    const allFields = new Set<string>();
    parsedData.forEach(item => {
      Object.keys(item).forEach(key => allFields.add(key));
    });
    
    // Sort fields
    const sortedFields = Array.from(allFields).sort();
    
    return (
      <div>
        <div className="flex justify-between mb-2">
          <h3 className="text-lg font-medium">Data Preview</h3>
          <Badge variant="outline">
            {parsedData.length} {parsedData.length === 1 ? 'record' : 'records'}
          </Badge>
        </div>
        
        <ScrollArea className="h-[300px] rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                {sortedFields.map(field => (
                  <TableHead key={field}>{field}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {parsedData.slice(0, 100).map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  {sortedFields.map(field => (
                    <TableCell key={field}>
                      {renderCellValue(item[field])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {parsedData.length > 100 && (
            <div className="text-center p-2 text-muted-foreground text-sm">
              Showing 100 of {parsedData.length} records
            </div>
          )}
        </ScrollArea>
      </div>
    );
  };
  
  // Helper to render cell values
  const renderCellValue = (value: any): React.ReactNode => {
    if (value === undefined || value === null) {
      return <span className="text-gray-400 text-xs">null</span>;
    }
    
    if (typeof value === 'object') {
      return <span className="text-blue-500 text-xs">{JSON.stringify(value)}</span>;
    }
    
    if (typeof value === 'boolean') {
      return value ? 
        <Badge variant="outline" className="bg-green-50">{String(value)}</Badge> : 
        <Badge variant="outline" className="bg-red-50">{String(value)}</Badge>;
    }
    
    return String(value);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Schema Validation Tool
        </CardTitle>
        <CardDescription>
          Validate data against predefined schemas for data quality assurance
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Schema Selection */}
        <div className="space-y-2">
          <Label htmlFor="schema-select">Select Schema</Label>
          <Select
            value={selectedSchema}
            onValueChange={(value) => setSelectedSchema(value as SchemaName)}
          >
            <SelectTrigger id="schema-select">
              <SelectValue placeholder="Select a schema" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(SchemaName).map((schema) => (
                <SelectItem key={schema} value={schema}>{schema}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Validation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="input">Input Data</TabsTrigger>
            <TabsTrigger value="validation">Validation Settings</TabsTrigger>
            <TabsTrigger value="results" disabled={!validationResult}>Results</TabsTrigger>
          </TabsList>
          
          {/* Input Tab */}
          <TabsContent value="input" className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="data-input" className="text-base">JSON Input</Label>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={parseData}
                    disabled={!inputData.trim()}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    Parse
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    disabled={!inputData.trim()}
                  >
                    <Trash className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                </div>
              </div>
              
              <Textarea
                id="data-input"
                placeholder={`Paste your JSON data here...\n\nExample: [{\n  "parcelId": "ABC123",\n  "address": "123 Main St",\n  "squareFeet": 1500\n}]`}
                className="font-mono h-[200px]"
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
              />
              
              {parseError && (
                <div className="text-red-500 text-sm flex items-start mt-1">
                  <AlertCircle className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}
            </div>
            
            {parsedData && parsedData.length > 0 && renderDataPreview()}
          </TabsContent>
          
          {/* Validation Settings Tab */}
          <TabsContent value="validation" className="space-y-6">
            <div className="space-y-4">
              {/* Settings */}
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Validation Options</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="strip-unknown" className="text-sm">Strip Unknown Fields</Label>
                      <p className="text-xs text-muted-foreground">
                        Remove fields not defined in the schema during validation
                      </p>
                    </div>
                    <Switch
                      id="strip-unknown"
                      checked={validationOptions.stripUnknown}
                      onCheckedChange={(checked) =>
                        setValidationOptions({ ...validationOptions, stripUnknown: checked })
                      }
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="coerce-values" className="text-sm">Coerce Values</Label>
                      <p className="text-xs text-muted-foreground">
                        Attempt to convert values to the expected type (e.g., string to number)
                      </p>
                    </div>
                    <Switch
                      id="coerce-values"
                      checked={validationOptions.coerce}
                      onCheckedChange={(checked) =>
                        setValidationOptions({ ...validationOptions, coerce: checked })
                      }
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="stop-first-error" className="text-sm">Stop on First Error</Label>
                      <p className="text-xs text-muted-foreground">
                        Stop validation when the first error is encountered
                      </p>
                    </div>
                    <Switch
                      id="stop-first-error"
                      checked={validationOptions.stopOnFirstError}
                      onCheckedChange={(checked) =>
                        setValidationOptions({ ...validationOptions, stopOnFirstError: checked })
                      }
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Schema Documentation */}
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Schema Definition</h3>
                <p className="text-sm text-muted-foreground">
                  The following fields are defined in the selected schema:
                </p>
                
                {renderSchemaFields()}
              </div>
            </div>
          </TabsContent>
          
          {/* Results Tab */}
          <TabsContent value="results">
            {renderValidationResults()}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleClear}
        >
          Clear
        </Button>
        
        <Button
          onClick={handleValidate}
          disabled={isValidating || !parsedData || parsedData.length === 0}
        >
          {isValidating ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Validating...
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4 mr-2" />
              Validate
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}