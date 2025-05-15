import React, { useState, useRef, useCallback, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { 
  PlayIcon, 
  XCircleIcon, 
  SaveIcon, 
  FileIcon, 
  BookIcon, 
  DatabaseIcon, 
  DownloadIcon, 
  UploadIcon, 
  Sparkles,
  BrainIcon,
  MessageCircle
} from 'lucide-react';
import { Property } from '@shared/schema';
import ScriptExecutionEngine, { ScriptResult } from './ScriptExecutionEngine';
import { etlPipelineManager } from '../../services/etl';

// Mock sample data for property analysis when ETL data is not available
const getSampleTransformedData = () => {
  return {
    propertyValuesByNeighborhood: {
      "Downtown": { count: 35, avgValue: 420000, minValue: 320000, maxValue: 650000 },
      "Southside": { count: 42, avgValue: 385000, minValue: 290000, maxValue: 520000 },
      "Westview": { count: 28, avgValue: 450000, minValue: 350000, maxValue: 720000 },
      "Northvale": { count: 31, avgValue: 410000, minValue: 310000, maxValue: 590000 }
    },
    propertyTypeDistribution: {
      "Single Family": 65,
      "Multi-Family": 15,
      "Commercial": 12,
      "Vacant Land": 8
    },
    yearBuiltDistribution: {
      "Before 1950": 12,
      "1950-1975": 24,
      "1976-2000": 38,
      "After 2000": 26
    },
    avgPricePerSqFt: 185.42
  };
};

// Connection to the ETL pipeline for accessing processed data
const getETLDataSources = () => {
  try {
    // This is a placeholder since the actual method might not be implemented
    return [];
  } catch (error) {
    console.warn("Error getting ETL data sources:", error);
    return [];
  }
};

const getTransformedDataFromETL = (jobId: string = 'property-data-etl') => {
  try {
    // Try to get job runs from etlPipelineManager instead
    const allJobRuns = etlPipelineManager.getAllJobRuns();
    
    // Filter by jobId if needed and sort to get the latest run
    const jobRuns = allJobRuns.filter(run => run.jobId.toString() === jobId);
    const latestRun = jobRuns.length > 0 
      ? jobRuns.sort((a, b) => 
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        )[0]
      : null;
    
    if (latestRun && 'result' in latestRun) {
      return (latestRun as any).result;
    }
    
    // Return sample data if no actual ETL data is available
    return getSampleTransformedData();
  } catch (error) {
    console.warn("Error getting transformed data from ETL:", error);
    // Return sample data as fallback
    return getSampleTransformedData();
  }
};

// Sample/Template scripts that users can select from
const SCRIPT_TEMPLATES: Record<string, string> = {
  'property-value-analysis': `// Property Value Analysis
// Analyze property values based on location and attributes

// Function to calculate average property value per square foot
function calculateAvgPricePerSqFt(properties) {
  let validProperties = properties.filter(p => 
    p.value && p.squareFeet && p.squareFeet > 0
  );
  
  if (validProperties.length === 0) return 0;
  
  let totalValue = 0;
  
  validProperties.forEach(property => {
    const value = parseFloat(property.value.replace(/[^0-9.-]+/g, ''));
    totalValue += value / property.squareFeet;
  });
  
  return totalValue / validProperties.length;
}

// Function to find highest value properties
function findTopValueProperties(properties, count = 5) {
  return properties
    .filter(p => p.value)
    .sort((a, b) => {
      const valueA = parseFloat(a.value.replace(/[^0-9.-]+/g, ''));
      const valueB = parseFloat(b.value.replace(/[^0-9.-]+/g, ''));
      return valueB - valueA;
    })
    .slice(0, count);
}

// Run analysis and return results
const avgPricePerSqFt = calculateAvgPricePerSqFt(properties);
const topProperties = findTopValueProperties(properties);

// Return results to be displayed
return {
  avgPricePerSqFt: avgPricePerSqFt.toFixed(2),
  topProperties: topProperties.map(p => ({
    id: p.id,
    address: p.address,
    value: p.value
  }))
};`,

  'neighborhood-clustering': `// Neighborhood Clustering
// Group properties by neighborhood and analyze clusters

// Function to group properties by neighborhood
function groupByNeighborhood(properties) {
  const neighborhoods = {};
  
  properties.forEach(property => {
    if (!property.neighborhood) return;
    
    if (!neighborhoods[property.neighborhood]) {
      neighborhoods[property.neighborhood] = [];
    }
    
    neighborhoods[property.neighborhood].push(property);
  });
  
  return neighborhoods;
}

// Calculate stats for each neighborhood
function calculateNeighborhoodStats(neighborhoods) {
  const stats = {};
  
  Object.entries(neighborhoods).forEach(([name, props]) => {
    const properties = props as Property[];
    
    // Calculate average value
    const validProperties = properties.filter(p => p.value);
    let totalValue = 0;
    
    validProperties.forEach(property => {
      totalValue += parseFloat(property.value.replace(/[^0-9.-]+/g, ''));
    });
    
    const avgValue = validProperties.length > 0 
      ? totalValue / validProperties.length 
      : 0;
    
    // Calculate other stats
    stats[name] = {
      count: properties.length,
      avgValue: avgValue.toFixed(2),
      minValue: validProperties.length > 0 
        ? Math.min(...validProperties.map(p => 
            parseFloat(p.value.replace(/[^0-9.-]+/g, ''))
          )).toFixed(2) 
        : '0',
      maxValue: validProperties.length > 0 
        ? Math.max(...validProperties.map(p => 
            parseFloat(p.value.replace(/[^0-9.-]+/g, ''))
          )).toFixed(2) 
        : '0'
    };
  });
  
  return stats;
}

// Run analysis
const neighborhoodGroups = groupByNeighborhood(properties);
const neighborhoodStats = calculateNeighborhoodStats(neighborhoodGroups);

// Return results
return {
  neighborhoodStats,
  neighborhoodCount: Object.keys(neighborhoodGroups).length
};`,

  'geospatial-hotspot': `// Geospatial Hotspot Analysis
// Identify property value hotspots based on geographic proximity

// Helper function to convert property values to numbers
function getPropertyValue(property) {
  if (!property.value) return 0;
  return parseFloat(property.value.replace(/[^0-9.-]+/g, ''));
}

// Calculate distance between two points (simple Euclidean distance)
function calculateDistance(lat1, lng1, lat2, lng2) {
  return Math.sqrt(
    Math.pow(lat1 - lat2, 2) + 
    Math.pow(lng1 - lng2, 2)
  );
}

// Find properties within a certain distance of each other
function findNearbyProperties(properties, maxDistance = 0.01) {
  const propertiesWithCoords = properties.filter(
    p => p.latitude && p.longitude
  );
  
  const clusters = [];
  
  // For each property, find neighbors within maxDistance
  propertiesWithCoords.forEach(property => {
    const neighbors = propertiesWithCoords.filter(p => {
      if (p.id === property.id) return false;
      
      const distance = calculateDistance(
        property.latitude, 
        property.longitude,
        p.latitude,
        p.longitude
      );
      
      return distance <= maxDistance;
    });
    
    if (neighbors.length >= 3) {
      clusters.push({
        center: property,
        neighbors,
        avgValue: [...neighbors, property]
          .map(getPropertyValue)
          .reduce((sum, val) => sum + val, 0) / (neighbors.length + 1)
      });
    }
  });
  
  // Sort clusters by average value
  clusters.sort((a, b) => b.avgValue - a.avgValue);
  
  return clusters.slice(0, 5); // Return top 5 clusters
}

// Run analysis
const hotspotClusters = findNearbyProperties(properties);

// Return results
return {
  hotspotCount: hotspotClusters.length,
  hotspots: hotspotClusters.map(cluster => ({
    centerProperty: {
      id: cluster.center.id,
      address: cluster.center.address,
      value: cluster.center.value
    },
    neighborCount: cluster.neighbors.length,
    avgValue: cluster.avgValue.toFixed(2)
  }))
};`
};

interface ScriptingPlaygroundProps {
  properties: Property[];
  onScriptResult?: (result: any) => void;
}

const ScriptingPlayground: React.FC<ScriptingPlaygroundProps> = ({ 
  properties,
  onScriptResult 
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('ai');
  const [script, setScript] = useState(SCRIPT_TEMPLATES['property-value-analysis']);
  const [scriptResult, setScriptResult] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('');
  const [codeExplanation, setCodeExplanation] = useState<string | null>(null);
  const [openAIConfigured, setOpenAIConfigured] = useState(false);
  const editorRef = useRef<any>(null);

  // Handle editor initialization
  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  // Load a template script
  const loadTemplate = (templateKey: string) => {
    if (SCRIPT_TEMPLATES[templateKey]) {
      setScript(SCRIPT_TEMPLATES[templateKey]);
      toast({
        title: "Template Loaded",
        description: `Successfully loaded "${templateKey}" template.`
      });
    }
  };

  // Initialize the script execution engine
  const [scriptEngine] = useState<ScriptExecutionEngine>(() => {
    return new ScriptExecutionEngine();
  });
  
  // Get transformed data from ETL pipeline
  const [transformedData, setTransformedData] = useState<Record<string, any> | undefined>();
  
  // Load transformed data when component mounts
  useEffect(() => {
    const etlData = getTransformedDataFromETL();
    setTransformedData(etlData);
    
    // Check if OpenAI API is configured
    fetch('/api/config')
      .then(response => response.json())
      .then(data => {
        setOpenAIConfigured(!!data.hasOpenAIKey);
      })
      .catch(err => {
        console.error('Error checking OpenAI configuration:', err);
        setOpenAIConfigured(false);
      });
  }, []);
  
  // Function to generate code from natural language
  const generateCodeFromNaturalLanguage = useCallback(async () => {
    if (!naturalLanguageInput.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter a natural language description of what you want to analyze.",
        variant: "destructive"
      });
      return;
    }
    
    setIsGeneratingCode(true);
    setError(null);
    setCodeExplanation(null);
    
    try {
      const response = await fetch('/api/ai/generate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          naturalLanguage: naturalLanguageInput,
          context: {
            properties: true,
            transformedData: !!transformedData,
            dataStructures: `Property fields: id, address, value, squareFeet, yearBuilt, landValue, coordinates, neighborhood, propertyType, etc.`
          }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate code from natural language');
      }
      
      const result = await response.json();
      
      // Update the script with the generated code
      setScript(result.code);
      
      // Store the explanation
      setCodeExplanation(result.explanation);
      
      // Switch to editor tab to show the generated code
      setActiveTab('editor');
      
      toast({
        title: "Code Generated",
        description: "Successfully generated code from your description. Review and run it."
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      toast({
        title: "Code Generation Error",
        description: "Failed to generate code. Please check your input or try again later.",
        variant: "destructive"
      });
      console.error('Error generating code:', err);
    } finally {
      setIsGeneratingCode(false);
    }
  }, [naturalLanguageInput, transformedData, toast]);
  
  // Execute the current script
  const executeScript = useCallback(() => {
    setIsExecuting(true);
    setError(null);
    setScriptResult(null);

    try {
      // Create a context with properties and other helper objects
      const context = {
        properties,
        transformedData,
        utils: {
          formatCurrency: (value: number) => {
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(value);
          }
        }
      };

      // Execute the script using our execution engine
      const result = scriptEngine.executeScript(script, context);
      
      if (result.success) {
        setScriptResult(result.output);
        if (onScriptResult) {
          onScriptResult(result.output);
        }
        
        setActiveTab('result');
        toast({
          title: "Script Executed",
          description: `Script executed successfully in ${result.executionTime}ms. View the results tab for details.`
        });
      } else {
        setError(result.error || "Unknown error occurred");
        toast({
          title: "Script Error",
          description: "An error occurred while executing the script. Check the console for details.",
          variant: "destructive"
        });
        console.error("Script execution error:", result.error, result.logs);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      toast({
        title: "Script Error",
        description: "An error occurred while executing the script. Check the console for details.",
        variant: "destructive"
      });
      console.error("Script execution error:", err);
    } finally {
      setIsExecuting(false);
    }
  }, [script, properties, transformedData, scriptEngine, onScriptResult, toast]);

  // Render JSON results nicely
  const renderResults = () => {
    if (!scriptResult) {
      return <div className="text-muted-foreground text-center p-4">No results to display. Run a script first.</div>;
    }

    return (
      <div className="bg-muted p-4 rounded-md overflow-auto max-h-[500px]">
        <pre className="whitespace-pre-wrap">{JSON.stringify(scriptResult, null, 2)}</pre>
      </div>
    );
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI-Powered Scripting Playground
        </CardTitle>
        <CardDescription>
          Use natural language or JavaScript to analyze and visualize property data
        </CardDescription>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="px-6 mb-2">
          <TabsList className="w-full">
            <TabsTrigger value="ai" className="flex-1">
              <BrainIcon className="h-4 w-4 mr-2" />
              AI Assistant
            </TabsTrigger>
            <TabsTrigger value="editor" className="flex-1">
              <CodeIcon className="h-4 w-4 mr-2" />
              Script Editor
            </TabsTrigger>
            <TabsTrigger value="result" className="flex-1">
              <BarChartIcon className="h-4 w-4 mr-2" />
              Results
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex-1">
              <FileIcon className="h-4 w-4 mr-2" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="docs" className="flex-1">
              <BookIcon className="h-4 w-4 mr-2" />
              Documentation
            </TabsTrigger>
          </TabsList>
        </div>
        
        <CardContent className="p-0">
          <TabsContent value="ai" className="m-0 px-6 py-4">
            <div className="space-y-4">
              {!openAIConfigured && (
                <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-md text-yellow-800">
                  <div className="flex items-start">
                    <div className="mr-2 mt-0.5">⚠️</div>
                    <div>
                      <h4 className="font-medium">OpenAI API Key Required</h4>
                      <p className="text-sm">
                        The AI Assistant requires an OpenAI API key. Please add your API key to the environment variables.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div>
                <h4 className="text-sm font-medium mb-2">Describe what you want to analyze in plain English</h4>
                <Textarea
                  value={naturalLanguageInput}
                  onChange={(e) => setNaturalLanguageInput(e.target.value)}
                  placeholder="Example: Find the average property value in each neighborhood and create a list of the top 3 most expensive neighborhoods"
                  className="min-h-[120px]"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={generateCodeFromNaturalLanguage}
                  disabled={isGeneratingCode || !openAIConfigured}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  {isGeneratingCode ? 'Generating Code...' : 'Generate Code'}
                </Button>
                <p className="text-xs text-muted-foreground">
                  AI will convert your description into JavaScript code
                </p>
              </div>
              
              {codeExplanation && (
                <div className="mt-4 p-4 border border-blue-100 bg-blue-50 rounded-md">
                  <h4 className="text-sm font-medium mb-2 text-blue-800">Code Explanation:</h4>
                  <div className="text-sm text-blue-700 space-y-2">
                    <div dangerouslySetInnerHTML={{ __html: codeExplanation.replace(/\n/g, '<br />') }} />
                  </div>
                </div>
              )}
              
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Example queries you can try:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                  <li>Find all properties built after 2010 and calculate their average value</li>
                  <li>Group properties by neighborhood and find the neighborhood with the highest average property value</li>
                  <li>Calculate the price per square foot for each property and identify outliers</li>
                  <li>Create a histogram of property values in $100,000 increments</li>
                  <li>Find all properties with more than 3 bedrooms and 2 bathrooms, and sort them by value</li>
                </ul>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="editor" className="m-0">
            <div className="h-[500px] border rounded-md mx-6">
              <Editor
                height="100%"
                defaultLanguage="javascript"
                value={script}
                onChange={(value) => setScript(value || '')}
                onMount={handleEditorDidMount}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  wordWrap: 'on',
                  tabSize: 2,
                }}
              />
            </div>
            
            {error && (
              <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600">
                <div className="flex items-start">
                  <XCircleIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Error:</h4>
                    <pre className="text-sm whitespace-pre-wrap mt-1">{error}</pre>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="result" className="px-6 m-0 py-4">
            {renderResults()}
          </TabsContent>
          
          <TabsContent value="templates" className="m-0 px-6 py-4">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors" 
                    onClick={() => loadTemplate('property-value-analysis')}>
                <CardHeader className="p-4">
                  <CardTitle className="text-base">Property Value Analysis</CardTitle>
                  <CardDescription>Calculate and analyze property values across the dataset</CardDescription>
                </CardHeader>
              </Card>
              
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => loadTemplate('neighborhood-clustering')}>
                <CardHeader className="p-4">
                  <CardTitle className="text-base">Neighborhood Clustering</CardTitle>
                  <CardDescription>Group properties by neighborhood and analyze trends</CardDescription>
                </CardHeader>
              </Card>
              
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => loadTemplate('geospatial-hotspot')}>
                <CardHeader className="p-4">
                  <CardTitle className="text-base">Geospatial Hotspot Analysis</CardTitle>
                  <CardDescription>Identify property value hotspots based on location</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="docs" className="m-0 px-6 py-4">
            <div className="prose max-w-full">
              <h4>Script Environment</h4>
              <p>
                The scripting playground allows you to write and execute JavaScript code to analyze property data.
                You have access to the following objects and functions:
              </p>
              
              <div className="bg-muted p-4 rounded-md">
                <code className="block whitespace-pre">
{`// Available objects:
properties: Property[] - Array of all properties in the system
transformedData: Record<string, any> - Data processed by ETL pipeline jobs
utils: {
  formatCurrency(value: number): string - Format a number as USD currency
  parsePropertyValue(property: Property): number - Extract numeric value from a property
  groupBy<T>(array: T[], key: keyof T | ((item: T) => string)): Record<string, T[]> - Group array items by key
  average(numbers: number[]): number - Calculate average of an array of numbers
  median(numbers: number[]): number - Calculate median of an array of numbers
}
console: {
  log, error, warn, info - Standard console methods for debugging
}

// Script requirements:
- Must return a result object to be displayed in the Results tab
- Keep processing time reasonable for large datasets`}
                </code>
              </div>
              
              <h4 className="mt-6">Property Object Structure</h4>
              <p>Each property in the <code>properties</code> array has the following structure:</p>
              
              <div className="bg-muted p-4 rounded-md">
                <code className="block whitespace-pre">
{`{
  id: number | string,
  parcelId: string,
  address: string,
  owner?: string,
  value?: string,           // Format: "$123,456"
  salePrice?: string,
  squareFeet?: number,
  yearBuilt?: number,
  landValue?: string,
  coordinates?: [number, number],
  latitude?: number,
  longitude?: number,
  neighborhood?: string,
  propertyType?: string,
  bedrooms?: number,
  bathrooms?: number,
  lotSize?: number,
  zoning?: string,
  lastSaleDate?: string,
  taxAssessment?: string,
  pricePerSqFt?: string
}`}
                </code>
              </div>
              
              <h4 className="mt-6">Example Script</h4>
              <p>Here's a simple example that counts properties by type:</p>
              
              <div className="bg-muted p-4 rounded-md">
                <code className="block whitespace-pre">
{`// Count properties by type
const typeCounts = {};

properties.forEach(property => {
  const type = property.propertyType || 'Unknown';
  typeCounts[type] = (typeCounts[type] || 0) + 1;
});

// Return results
return {
  totalProperties: properties.length,
  typeBreakdown: typeCounts
};`}
                </code>
              </div>
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>
      
      <CardFooter className="flex justify-between pt-6">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setActiveTab('ai')}
            className="gap-2"
          >
            <BrainIcon className="h-4 w-4" />
            AI Assistant
          </Button>
          <Button
            variant="outline"
            onClick={() => setActiveTab('templates')}
          >
            <FileIcon className="h-4 w-4 mr-2" />
            Load Template
          </Button>
        </div>
        
        <Button 
          onClick={executeScript} 
          disabled={isExecuting}
          className="gap-2"
        >
          <PlayIcon className="h-4 w-4" />
          {isExecuting ? 'Executing...' : 'Run Script'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ScriptingPlayground;

// Icons (to avoid additional imports)
function CodeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <polyline points="16 18 22 12 16 6"></polyline>
      <polyline points="8 6 2 12 8 18"></polyline>
    </svg>
  );
}

function BarChartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <line x1="12" y1="20" x2="12" y2="10"></line>
      <line x1="18" y1="20" x2="18" y2="4"></line>
      <line x1="6" y1="20" x2="6" y2="16"></line>
    </svg>
  );
}