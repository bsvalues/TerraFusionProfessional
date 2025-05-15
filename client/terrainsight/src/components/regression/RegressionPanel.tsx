import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ScatterChart,
  Scatter,
  LineChart,
  Line,
  ReferenceLine,
  Cell
} from 'recharts';
import { 
  Calculator, 
  Home, 
  Layers, 
  FileText, 
  Database, 
  Calculator as CalculatorIcon, 
  Settings, 
  RefreshCw, 
  Filter,
  Download,
  ChevronDown,
  ChevronRight,
  Search,
  Plus,
  Trash2,
  Save,
  Code,
  BarChart2,
  LineChart as LineChartIcon,
  ScatterChart as ScatterChartIcon,
  Maximize2,
  Cpu,
  Eye,
  EyeOff,
  HelpCircle,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Types
interface RegressionModel {
  id: number;
  name: string;
  r2: number;
  variables: number;
  cov: number;
  samples: number;
  lastRun: string;
  type?: string;
}

interface ModelVariable {
  name: string;
  coefficient: number;
  tValue: number;
  pValue: number;
  correlation: number;
  included: boolean;
}

interface PredictionResult {
  id: number;
  actualValue: number;
  predictedValue: number;
  absoluteError: number;
  percentError: number;
  parcelId: string;
  address: string;
}

interface ModelDiagnostics {
  residualHistogram: { bin: string; count: number }[];
  scatterPlot: { actual: number; predicted: number }[];
  metrics: {
    r2: number;
    adjustedR2: number;
    standardError: number;
    observations: number;
    fStatistic: number;
    pValue: number;
    akaike: number;
    cov: number;
    prd: number;
  };
}

const RegressionPanel: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState('models');
  const [models, setModels] = useState<RegressionModel[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const [variables, setVariables] = useState<ModelVariable[]>([]);
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [diagnostics, setDiagnostics] = useState<ModelDiagnostics | null>(null);
  const [filterThreshold, setFilterThreshold] = useState('0.05');
  const [showSignificantOnly, setShowSignificantOnly] = useState(true);
  const [chartType, setChartType] = useState<'scatter' | 'residual' | 'variable'>('scatter');
  const [loading, setLoading] = useState({
    models: false,
    variables: false,
    predictions: false,
    diagnostics: false
  });

  // Fetch models
  useEffect(() => {
    setLoading(prev => ({ ...prev, models: true }));
    
    apiRequest({
      url: '/api/regression/models',
      method: 'GET'
    }).then(data => data as unknown as RegressionModel[])
      .then(data => {
        setModels(data);
        if (data.length > 0 && !selectedModelId) {
          setSelectedModelId(data[0].id);
        }
      })
      .catch(err => {
        console.error('Error fetching regression models:', err);
      })
      .finally(() => {
        setLoading(prev => ({ ...prev, models: false }));
      });
  }, []);

  // Fetch model variables when a model is selected
  useEffect(() => {
    if (!selectedModelId) return;
    
    setLoading(prev => ({ ...prev, variables: true }));
    
    apiRequest({
      url: `/api/regression/models/${selectedModelId}/variables`,
      method: 'GET'
    }).then(data => data as unknown as ModelVariable[])
      .then(data => {
        setVariables(data);
      })
      .catch(err => {
        console.error('Error fetching model variables:', err);
      })
      .finally(() => {
        setLoading(prev => ({ ...prev, variables: false }));
      });
  }, [selectedModelId]);

  // Fetch model predictions
  const fetchPredictions = () => {
    if (!selectedModelId) return;
    
    setLoading(prev => ({ ...prev, predictions: true }));
    
    apiRequest({
      url: `/api/regression/models/${selectedModelId}/predictions`,
      method: 'GET'
    }).then(data => data as unknown as PredictionResult[])
      .then(data => {
        setPredictions(data);
      })
      .catch(err => {
        console.error('Error fetching model predictions:', err);
      })
      .finally(() => {
        setLoading(prev => ({ ...prev, predictions: false }));
      });
  };

  // Fetch model diagnostics
  const fetchDiagnostics = () => {
    if (!selectedModelId) return;
    
    setLoading(prev => ({ ...prev, diagnostics: true }));
    
    apiRequest({
      url: `/api/regression/models/${selectedModelId}/diagnostics`,
      method: 'GET'
    }).then(data => data as unknown as ModelDiagnostics)
      .then(data => {
        setDiagnostics(data);
      })
      .catch(err => {
        console.error('Error fetching model diagnostics:', err);
      })
      .finally(() => {
        setLoading(prev => ({ ...prev, diagnostics: false }));
      });
  };

  // Fetch predictions and diagnostics when a model is selected
  useEffect(() => {
    if (selectedModelId) {
      fetchPredictions();
      fetchDiagnostics();
    }
  }, [selectedModelId]);

  // Get the selected model
  const selectedModel = models.find(m => m.id === selectedModelId);

  // Filter variables based on significance threshold
  const filteredVariables = showSignificantOnly
    ? variables.filter(v => v.pValue < parseFloat(filterThreshold))
    : variables;

  // Calculate statistics
  const variableStats = {
    significant: variables.filter(v => v.pValue < parseFloat(filterThreshold)).length,
    included: variables.filter(v => v.included).length,
    positive: variables.filter(v => v.coefficient > 0).length,
    negative: variables.filter(v => v.coefficient < 0).length
  };

  // The 10 highest absolute errors
  const highestErrors = [...predictions]
    .sort((a, b) => b.percentError - a.percentError)
    .slice(0, 10);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Panel Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center">
          <Calculator className="h-5 w-5 mr-2" />
          <h2 className="text-lg font-semibold">Regression Analysis</h2>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            New Model
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Model List */}
        <div className="w-64 border-r overflow-y-auto bg-muted/20">
          <div className="p-3 border-b">
            <Input 
              placeholder="Search models..." 
              className="h-8" 
            />
          </div>
          <div className="p-1">
            {models.map(model => (
              <div 
                key={model.id}
                className={`p-2 rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground ${
                  model.id === selectedModelId ? 'bg-accent text-accent-foreground' : ''
                }`}
                onClick={() => setSelectedModelId(model.id)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{model.name}</span>
                  <Badge variant={model.r2 > 0.8 ? 'default' : model.r2 > 0.6 ? 'secondary' : 'outline'}>
                    R² {model.r2.toFixed(2)}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-1 flex justify-between">
                  <span>{model.type?.replace('_', ' ')}</span>
                  <span>{model.variables} variables</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          {selectedModel ? (
            <Tabs 
              defaultValue="overview" 
              className="flex flex-col h-full" 
              value={activeTab} 
              onValueChange={setActiveTab}
            >
              <div className="border-b p-2 bg-muted/10">
                <TabsList className="grid grid-cols-4 h-9">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="variables">Variables</TabsTrigger>
                  <TabsTrigger value="predictions">Predictions</TabsTrigger>
                  <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
                </TabsList>
              </div>
              
              {/* Overview Tab */}
              <TabsContent value="overview" className="flex-1 p-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>{selectedModel.name}</CardTitle>
                      <CardDescription>
                        {selectedModel.type === 'multiple_regression' ? 'Multiple Regression Model' : 
                         selectedModel.type === 'time_series' ? 'Time Series Analysis' : 
                         selectedModel.type === 'geospatial' ? 'Geospatial Analysis' : 
                         'Regression Model'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-6">
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-1">
                          R-Squared
                        </div>
                        <div className="text-2xl font-bold">
                          {selectedModel.r2.toFixed(3)}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {selectedModel.r2 > 0.8 ? (
                            <span className="text-green-600 flex items-center">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Excellent fit
                            </span>
                          ) : selectedModel.r2 > 0.6 ? (
                            <span className="text-yellow-600 flex items-center">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Acceptable fit
                            </span>
                          ) : (
                            <span className="text-red-600 flex items-center">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Poor fit
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-1">
                          COV
                        </div>
                        <div className="text-2xl font-bold">
                          {selectedModel.cov.toFixed(1)}%
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {selectedModel.cov < 10 ? (
                            <span className="text-green-600 flex items-center">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Low dispersion
                            </span>
                          ) : selectedModel.cov < 15 ? (
                            <span className="text-yellow-600 flex items-center">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Moderate dispersion
                            </span>
                          ) : (
                            <span className="text-red-600 flex items-center">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              High dispersion
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-1">
                          Sample Size
                        </div>
                        <div className="text-2xl font-bold">
                          {selectedModel.samples}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {selectedModel.samples > 200 ? (
                            <span className="text-green-600 flex items-center">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Large sample
                            </span>
                          ) : selectedModel.samples > 100 ? (
                            <span className="text-yellow-600 flex items-center">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Adequate sample
                            </span>
                          ) : (
                            <span className="text-red-600 flex items-center">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Small sample
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-1">
                          Variables
                        </div>
                        <div className="text-2xl font-bold">
                          {selectedModel.variables}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {variableStats.significant} significant ({filterThreshold})
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-1">
                          Last Run
                        </div>
                        <div className="text-2xl font-bold">
                          {selectedModel.lastRun}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          Model is current
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-1">
                          Model Type
                        </div>
                        <div className="text-lg font-bold">
                          {selectedModel.type?.replace('_', ' ')}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          Linear regression
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                      <Button variant="outline" size="sm">
                        <Code className="h-4 w-4 mr-1" />
                        View Formula
                      </Button>
                      <Button variant="default" size="sm">
                        <Cpu className="h-4 w-4 mr-1" />
                        Run Model
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card className="h-fit">
                    <CardHeader>
                      <CardTitle>Key Coefficients</CardTitle>
                      <CardDescription>
                        Top significant variables
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-64">
                        {variables
                          .filter(v => v.pValue < parseFloat(filterThreshold))
                          .sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient))
                          .slice(0, 7)
                          .map((variable, index) => (
                            <div key={index} className="mb-3">
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-sm">
                                  {variable.name}
                                </span>
                                <span className={`font-bold ${
                                  variable.coefficient > 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {variable.coefficient > 0 ? '+' : ''}
                                  {variable.coefficient.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                <span>t: {variable.tValue.toFixed(2)}</span>
                                <span>p: {variable.pValue.toFixed(5)}</span>
                                <span>r: {variable.correlation.toFixed(2)}</span>
                              </div>
                            </div>
                          ))}
                      </ScrollArea>
                    </CardContent>
                    <CardFooter className="text-xs text-muted-foreground">
                      Showing top {Math.min(7, variables.filter(v => v.pValue < parseFloat(filterThreshold)).length)} 
                      of {variables.filter(v => v.pValue < parseFloat(filterThreshold)).length} significant variables
                    </CardFooter>
                  </Card>
                </div>
                
                {/* Prediction accuracy chart */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Prediction Accuracy</CardTitle>
                    <CardDescription>
                      Comparison of actual vs. predicted values
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    {diagnostics ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart
                          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            type="number" 
                            dataKey="actual" 
                            name="Actual" 
                            label={{ 
                              value: 'Actual Value ($)', 
                              position: 'insideBottom', 
                              offset: -10 
                            }}
                            tickFormatter={(value) => formatCurrency(value as number, undefined, undefined, 0)}
                          />
                          <YAxis 
                            type="number" 
                            dataKey="predicted" 
                            name="Predicted" 
                            label={{ 
                              value: 'Predicted Value ($)', 
                              angle: -90, 
                              position: 'insideLeft',
                              offset: -5
                            }}
                            tickFormatter={(value) => formatCurrency(value as number, undefined, undefined, 0)}
                          />
                          <Tooltip 
                            formatter={(value) => formatCurrency(value as number)}
                            labelFormatter={(label) => `Actual: ${formatCurrency(label as number)}`}
                          />
                          <ReferenceLine 
                            x={0} 
                            y={0} 
                            stroke="red" 
                            strokeDasharray="3 3" 
                            label={{ value: "Perfect Fit", position: 'insideTopRight' }}
                          />
                          <Scatter 
                            name="Property" 
                            data={diagnostics.scatterPlot} 
                            fill="#8884d8" 
                          />
                        </ScatterChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">Loading diagnostics data...</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Variables Tab */}
              <TabsContent value="variables" className="flex-1 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="show-significant">Show Significant Only</Label>
                    <Switch 
                      id="show-significant" 
                      checked={showSignificantOnly}
                      onCheckedChange={setShowSignificantOnly}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="p-value">P-Value Threshold:</Label>
                    <Select value={filterThreshold} onValueChange={setFilterThreshold}>
                      <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="0.05" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0.01">0.01</SelectItem>
                        <SelectItem value="0.05">0.05</SelectItem>
                        <SelectItem value="0.1">0.10</SelectItem>
                        <SelectItem value="0.2">0.20</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Model Variables</CardTitle>
                    <CardDescription>
                      {variables.length} variables ({variableStats.significant} significant, {variableStats.included} included in model)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Variable</TableHead>
                            <TableHead className="text-right">Coefficient</TableHead>
                            <TableHead className="text-right">t-Value</TableHead>
                            <TableHead className="text-right">p-Value</TableHead>
                            <TableHead className="text-right">Correlation</TableHead>
                            <TableHead className="text-center">Included</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredVariables.map((variable, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{variable.name}</TableCell>
                              <TableCell className={`text-right ${
                                variable.coefficient > 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {variable.coefficient > 0 ? '+' : ''}
                                {variable.coefficient.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right">{variable.tValue.toFixed(2)}</TableCell>
                              <TableCell className={`text-right ${
                                variable.pValue < 0.01 ? 'text-green-600 font-bold' : 
                                variable.pValue < 0.05 ? 'text-green-600' : 
                                variable.pValue < 0.1 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {variable.pValue.toFixed(5)}
                              </TableCell>
                              <TableCell className={`text-right ${
                                Math.abs(variable.correlation) > 0.7 ? 'text-green-600 font-bold' : 
                                Math.abs(variable.correlation) > 0.5 ? 'text-green-600' : 
                                Math.abs(variable.correlation) > 0.3 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {variable.correlation.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-center">
                                <Checkbox 
                                  checked={variable.included} 
                                  aria-label={`${variable.name} included`}
                                  disabled
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Chart visualization of variables */}
                <Card className="mt-6">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Variable Visualization</CardTitle>
                        <CardDescription>
                          Graphical representation of variable impacts
                        </CardDescription>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant={chartType === 'variable' ? 'default' : 'outline'} 
                          size="sm"
                          onClick={() => setChartType('variable')}
                        >
                          <BarChart2 className="h-4 w-4 mr-1" />
                          Coefficients
                        </Button>
                        <Button 
                          variant={chartType === 'scatter' ? 'default' : 'outline'} 
                          size="sm"
                          onClick={() => setChartType('scatter')}
                        >
                          <ScatterChartIcon className="h-4 w-4 mr-1" />
                          Correlation
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="h-80">
                    {chartType === 'variable' ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={filteredVariables
                            .sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient))
                            .slice(0, 10)
                            .map(v => ({ 
                              name: v.name, 
                              coefficient: v.coefficient,
                              absCoefficient: Math.abs(v.coefficient)
                            }))}
                          layout="vertical"
                          margin={{ top: 20, right: 30, left: 150, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis 
                            type="category" 
                            dataKey="name" 
                            width={140}
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip 
                            formatter={(value) => [value, "Coefficient"]}
                          />
                          <Legend />
                          <Bar 
                            dataKey="coefficient" 
                            fill="#8884d8" 
                            name="Coefficient"
                          >
                            {filteredVariables
                              .sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient))
                              .slice(0, 10)
                              .map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.coefficient > 0 ? '#4caf50' : '#f44336'} />
                              ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart
                          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            type="number" 
                            dataKey="correlation" 
                            name="Correlation" 
                            domain={[-1, 1]}
                            ticks={[-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1]}
                            label={{ 
                              value: 'Correlation', 
                              position: 'insideBottom', 
                              offset: -10 
                            }}
                          />
                          <YAxis 
                            type="number" 
                            dataKey="pValue" 
                            name="p-Value" 
                            domain={[0, 0.2]}
                            label={{ 
                              value: 'p-Value', 
                              angle: -90, 
                              position: 'insideLeft',
                              offset: -5
                            }}
                          />
                          <Tooltip 
                            formatter={(value: any, name: any) => [
                              name === 'pValue' ? Number(value).toFixed(5) : Number(value).toFixed(2), 
                              name === 'pValue' ? 'p-Value' : 'Correlation'
                            ]}
                            labelFormatter={(label) => {
                              const variable = filteredVariables.find(v => v.correlation === label || v.pValue === label);
                              return variable ? variable.name : '';
                            }}
                          />
                          <ReferenceLine y={0.05} stroke="red" strokeDasharray="3 3" />
                          <Scatter 
                            name="Variables" 
                            data={filteredVariables.map(v => ({ 
                              ...v, 
                              size: Math.abs(v.coefficient) * 10 + 30 
                            }))} 
                            fill="#8884d8" 
                          >
                            {filteredVariables.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.pValue < 0.05 ? 
                                  (entry.correlation > 0 ? '#4caf50' : '#f44336') : 
                                  '#9e9e9e'} 
                              />
                            ))}
                          </Scatter>
                        </ScatterChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Predictions Tab */}
              <TabsContent value="predictions" className="flex-1 p-4">
                {/* Prediction accuracy stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Mean Absolute Error
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {predictions.length > 0 
                          ? formatCurrency(
                              predictions.reduce((sum, item) => sum + item.absoluteError, 0) / predictions.length
                            )
                          : '$0'}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Average prediction error
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Mean Percent Error
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {predictions.length > 0 
                          ? (predictions.reduce((sum, item) => sum + item.percentError, 0) / predictions.length).toFixed(1) + '%'
                          : '0%'}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Average percentage error
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Predictions Within 10%
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {predictions.length > 0 
                          ? Math.round(predictions.filter(p => p.percentError <= 10).length / predictions.length * 100) + '%'
                          : '0%'}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Percentage of predictions within 10% error
                      </p>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Properties with highest errors */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Highest Error Properties</CardTitle>
                    <CardDescription>
                      Properties with the largest prediction errors
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Parcel ID</TableHead>
                            <TableHead>Address</TableHead>
                            <TableHead className="text-right">Actual Value</TableHead>
                            <TableHead className="text-right">Predicted Value</TableHead>
                            <TableHead className="text-right">Error ($)</TableHead>
                            <TableHead className="text-right">Error (%)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {highestErrors.map((prediction) => (
                            <TableRow key={prediction.id}>
                              <TableCell className="font-medium">{prediction.parcelId}</TableCell>
                              <TableCell>{prediction.address}</TableCell>
                              <TableCell className="text-right">{formatCurrency(prediction.actualValue)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(prediction.predictedValue)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(prediction.absoluteError)}</TableCell>
                              <TableCell className={`text-right ${
                                prediction.percentError > 15 ? 'text-red-600 font-bold' : 
                                prediction.percentError > 10 ? 'text-red-600' : 
                                prediction.percentError > 5 ? 'text-yellow-600' : 'text-green-600'
                              }`}>
                                {prediction.percentError.toFixed(1)}%
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
                
                {/* All predicted properties */}
                <Card>
                  <CardHeader>
                    <CardTitle>All Predictions</CardTitle>
                    <CardDescription>
                      Comparing actual vs. predicted values for all properties
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Parcel ID</TableHead>
                            <TableHead>Address</TableHead>
                            <TableHead className="text-right">Actual Value</TableHead>
                            <TableHead className="text-right">Predicted Value</TableHead>
                            <TableHead className="text-right">Error (%)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <ScrollArea className="h-[400px]">
                          <TableBody>
                            {predictions.map((prediction) => (
                              <TableRow key={prediction.id}>
                                <TableCell className="font-medium">{prediction.parcelId}</TableCell>
                                <TableCell>{prediction.address}</TableCell>
                                <TableCell className="text-right">{formatCurrency(prediction.actualValue)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(prediction.predictedValue)}</TableCell>
                                <TableCell className={`text-right ${
                                  prediction.percentError > 15 ? 'text-red-600 font-bold' : 
                                  prediction.percentError > 10 ? 'text-red-600' : 
                                  prediction.percentError > 5 ? 'text-yellow-600' : 'text-green-600'
                                }`}>
                                  {prediction.percentError.toFixed(1)}%
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </ScrollArea>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Diagnostics Tab */}
              <TabsContent value="diagnostics" className="flex-1 p-4">
                {diagnostics ? (
                  <>
                    {/* Key metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            R-Squared
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {diagnostics.metrics.r2.toFixed(3)}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Adjusted R²: {diagnostics.metrics.adjustedR2.toFixed(3)}
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            Standard Error
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {formatCurrency(diagnostics.metrics.standardError)}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            COV: {diagnostics.metrics.cov.toFixed(1)}%
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            F-Statistic
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {diagnostics.metrics.fStatistic.toFixed(2)}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            p-value: {diagnostics.metrics.pValue.toExponential(3)}
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            PRD
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {diagnostics.metrics.prd.toFixed(3)}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {diagnostics.metrics.prd < 0.98 ? 'Progressive' : 
                              diagnostics.metrics.prd > 1.03 ? 'Regressive' : 'Neutral'}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                    
                    {/* Residual histogram */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Residual Distribution</CardTitle>
                          <CardDescription>
                            Distribution of prediction errors
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={diagnostics.residualHistogram}
                              margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="bin" 
                                angle={-45} 
                                textAnchor="end" 
                                height={60}
                                interval={0}
                                tick={{ fontSize: 10 }}
                              />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="count" fill="#8884d8" name="Count" />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle>Actual vs. Predicted</CardTitle>
                          <CardDescription>
                            Scatter plot of actual vs. predicted values
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart
                              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                type="number" 
                                dataKey="actual" 
                                name="Actual" 
                                tickFormatter={(value) => formatCurrency(value as number, undefined, undefined, 0)}
                              />
                              <YAxis 
                                type="number" 
                                dataKey="predicted" 
                                name="Predicted" 
                                tickFormatter={(value) => formatCurrency(value as number, undefined, undefined, 0)}
                              />
                              <Tooltip 
                                formatter={(value) => formatCurrency(value as number)}
                                labelFormatter={(label) => `Actual: ${formatCurrency(label as number)}`}
                              />
                              <ReferenceLine 
                                y={0} 
                                stroke="red" 
                                strokeDasharray="3 3" 
                              />
                              <ReferenceLine 
                                x={0} 
                                y={0} 
                                stroke="red" 
                                strokeDasharray="3 3" 
                              />
                              <ReferenceLine 
                                y="actual" 
                                stroke="blue" 
                                strokeDasharray="3 3" 
                                label="Perfect Fit" 
                              />
                              <Scatter 
                                name="Property" 
                                data={diagnostics.scatterPlot} 
                                fill="#8884d8" 
                              />
                            </ScatterChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </div>
                    
                    {/* Advanced diagnostics */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Advanced Diagnostics</CardTitle>
                        <CardDescription>
                          Detailed statistical measures for model evaluation
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="font-medium mb-2">Overall Model Fitness</h3>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">R-Squared:</span>
                                <span className="font-medium">{diagnostics.metrics.r2.toFixed(3)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Adjusted R-Squared:</span>
                                <span className="font-medium">{diagnostics.metrics.adjustedR2.toFixed(3)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">F-Statistic:</span>
                                <span className="font-medium">{diagnostics.metrics.fStatistic.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">p-value:</span>
                                <span className="font-medium">{diagnostics.metrics.pValue.toExponential(3)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Akaike Information Criterion:</span>
                                <span className="font-medium">{diagnostics.metrics.akaike.toFixed(2)}</span>
                              </div>
                            </div>
                            
                            <Separator className="my-4" />
                            
                            <h3 className="font-medium mb-2">Regression Diagnostics</h3>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Standard Error:</span>
                                <span className="font-medium">{formatCurrency(diagnostics.metrics.standardError)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Observations:</span>
                                <span className="font-medium">{diagnostics.metrics.observations}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="font-medium mb-2">IAAO Statistics</h3>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Coefficient of Dispersion (COD):</span>
                                <span className="font-medium">{diagnostics.metrics.cov.toFixed(1)}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Price-Related Differential (PRD):</span>
                                <span className="font-medium">{diagnostics.metrics.prd.toFixed(3)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">PRD Classification:</span>
                                <span className={`font-medium ${
                                  diagnostics.metrics.prd < 0.98 ? 'text-red-600' : 
                                  diagnostics.metrics.prd > 1.03 ? 'text-red-600' : 'text-green-600'
                                }`}>
                                  {diagnostics.metrics.prd < 0.98 ? 'Progressive' : 
                                  diagnostics.metrics.prd > 1.03 ? 'Regressive' : 'Neutral'}
                                </span>
                              </div>
                            </div>
                            
                            <Separator className="my-4" />
                            
                            <h3 className="font-medium mb-2">Interpretation</h3>
                            <div className="text-sm text-muted-foreground">
                              <p>
                                This model explains <span className="font-medium">{Math.round(diagnostics.metrics.r2 * 100)}%</span> of 
                                the variation in property values. The F-statistic indicates that the model 
                                is statistically significant ({diagnostics.metrics.fStatistic.toFixed(2)}, p &lt; {diagnostics.metrics.pValue.toExponential(1)}).
                              </p>
                              <p className="mt-2">
                                With a COD of {diagnostics.metrics.cov.toFixed(1)}%, the model 
                                {diagnostics.metrics.cov < 15 ? ' meets' : ' does not meet'} IAAO standards 
                                for residential properties (&lt;15%).
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Loading diagnostics data...</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <CalculatorIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium">No Model Selected</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                  Please select a regression model from the list on the left to view its details, 
                  variables, and diagnostics.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegressionPanel;