import React, { useState } from 'react';
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
import { Separator } from '@/components/ui/separator';
import { 
  AlertCircle,
  CheckCircle2, 
  Play,
  Check,
  X,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
// Custom tooltip using title attribute

interface TransformationConfig {
  [key: string]: any;
}

interface TransformationRule {
  name: string;
  description: string;
  sourceField: string;
  targetField: string;
  transformationType: string;
  transformationConfig: TransformationConfig;
  isEnabled: boolean;
}

interface DataSample {
  name: string;
  type: string;
  columns: string[];
  rows: (string | number | null)[][];
}

interface ExecutionLogEntry {
  rule: string;
  status: 'success' | 'error' | 'skipped';
  message: string;
  transformedCount?: number;
}

interface TransformationStats {
  totalTransformations: number;
  byRule: Record<string, {
    cellsTransformed: number;
    fieldsAffected: string[];
  }>;
}

interface TransformationRuleExecutorProps {
  dataSample?: DataSample;
  rules: TransformationRule[];
  onTransformationComplete?: (transformedData: DataSample) => void;
}

export const TransformationRuleExecutor: React.FC<TransformationRuleExecutorProps> = ({
  dataSample,
  rules,
  onTransformationComplete
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [transformedData, setTransformedData] = useState<DataSample | null>(null);
  const [executionLog, setExecutionLog] = useState<ExecutionLogEntry[]>([]);
  const [transformationStats, setTransformationStats] = useState<TransformationStats | null>(null);
  const { toast } = useToast();

  const executeRules = async () => {
    if (!dataSample) {
      toast({
        title: 'No data to transform',
        description: 'Please provide a data sample to transform.',
        variant: 'destructive',
      });
      return;
    }

    if (!rules || rules.length === 0) {
      toast({
        title: 'No rules to apply',
        description: 'Please create transformation rules first.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiRequest(
        'POST', 
        '/api/etl/execute-transformation-rules',
        {
          data: dataSample,
          rules: rules
        }
      ) as { 
        transformedData: DataSample; 
        executionLog: ExecutionLogEntry[];
        transformationStats: TransformationStats;
      };

      setTransformedData(result.transformedData);
      setExecutionLog(result.executionLog);
      setTransformationStats(result.transformationStats);

      if (onTransformationComplete) {
        onTransformationComplete(result.transformedData);
      }

      toast({
        title: 'Transformation complete',
        description: `Applied ${result.transformationStats.totalTransformations} transformations to your data.`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Error executing transformation rules:', error);
      toast({
        title: 'Error',
        description: 'Failed to execute transformation rules. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'error':
        return <X className="h-4 w-4 text-red-500" />;
      case 'skipped':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'skipped':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Determine if there are any differences between the original and transformed data
  const calculateChanges = (): { totalChanges: number, changedFields: string[] } => {
    if (!dataSample || !transformedData) {
      return { totalChanges: 0, changedFields: [] };
    }

    let totalChanges = 0;
    const changedFields: string[] = [];

    // Check if columns have changed
    if (dataSample.columns.length !== transformedData.columns.length) {
      totalChanges += Math.abs(transformedData.columns.length - dataSample.columns.length);
      
      // Find new columns
      transformedData.columns.forEach(column => {
        if (!dataSample.columns.includes(column) && !changedFields.includes(column)) {
          changedFields.push(column);
        }
      });
    }

    // Check each row for changes
    const minRows = Math.min(dataSample.rows.length, transformedData.rows.length);
    for (let i = 0; i < minRows; i++) {
      const originalRow = dataSample.rows[i];
      const transformedRow = transformedData.rows[i];
      
      // Compare cells in each column that exists in both datasets
      dataSample.columns.forEach((column, colIndex) => {
        if (colIndex < originalRow.length && colIndex < transformedRow.length) {
          if (originalRow[colIndex] !== transformedRow[colIndex]) {
            totalChanges++;
            if (!changedFields.includes(column)) {
              changedFields.push(column);
            }
          }
        }
      });
      
      // Check for added columns in the transformed data
      for (let j = dataSample.columns.length; j < transformedData.columns.length; j++) {
        if (transformedRow[j] !== null && transformedRow[j] !== undefined) {
          totalChanges++;
        }
      }
    }

    return { totalChanges, changedFields };
  };

  const { totalChanges, changedFields } = calculateChanges();

  return (
    <Card className="w-full">
      <CardHeader className="bg-gray-50">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl">Transformation Rule Executor</CardTitle>
            <CardDescription>
              Apply transformation rules to your data to fix quality issues
            </CardDescription>
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={executeRules}
            disabled={isLoading || !dataSample || !rules || rules.length === 0}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Execute Rules
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {rules.length === 0 ? (
          <div className="text-center py-10">
            <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <h3 className="text-lg font-medium">No Rules Available</h3>
            <p className="text-gray-500 mt-1">
              You need to create transformation rules before you can execute them.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">Selected Rules ({rules.length})</h3>
              <div className="space-y-2">
                {rules.map((rule, index) => (
                  <div 
                    key={index} 
                    className={`border rounded-lg p-3 ${rule.isEnabled ? 'bg-white' : 'bg-gray-50'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {rule.isEnabled ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-gray-400 mr-2" />
                        )}
                        <div>
                          <h4 className="font-medium">{rule.name}</h4>
                          <p className="text-sm text-gray-600">{rule.description}</p>
                        </div>
                      </div>
                      <div className="tooltip" title={rule.isEnabled ? 'Rule will be applied' : 'Rule is disabled'}>
                        <Badge variant={rule.isEnabled ? 'default' : 'outline'}>
                          {rule.sourceField} → {rule.targetField}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {executionLog.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Execution Results</h3>
                
                {transformationStats && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium mb-2">Transformation Summary</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Total Transformations</p>
                        <p className="text-2xl font-bold">{transformationStats.totalTransformations}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Changed Fields</p>
                        <p className="text-2xl font-bold">{changedFields.length}</p>
                      </div>
                    </div>
                    
                    {changedFields.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600 mb-1">Affected Fields:</p>
                        <div className="flex flex-wrap gap-2">
                          {changedFields.map((field, index) => (
                            <Badge key={index} variant="outline">{field}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Rule</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead className="text-right">Transformations</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {executionLog.map((entry, index) => (
                      <TableRow key={index}>
                        <TableCell>{getStatusIcon(entry.status)}</TableCell>
                        <TableCell className="font-medium">{entry.rule}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(entry.status)}`}>
                            {entry.status}
                          </span>
                        </TableCell>
                        <TableCell>{entry.message}</TableCell>
                        <TableCell className="text-right">
                          {entry.transformedCount !== undefined ? entry.transformedCount : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {transformedData && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-3">Transformed Data Preview</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 border">
                    <thead className="bg-gray-50">
                      <tr>
                        {transformedData.columns.map((column, index) => (
                          <th 
                            key={index}
                            className={`px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                              changedFields.includes(column) ? 'bg-green-50' : ''
                            }`}
                          >
                            {column}
                            {changedFields.includes(column) && (
                              <span className="ml-1 text-green-500">*</span>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transformedData.rows.slice(0, 5).map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {row.map((cell, cellIndex) => {
                            // Check if this cell was transformed
                            const originalValue = rowIndex < (dataSample?.rows.length || 0) && 
                                                cellIndex < (dataSample?.columns.length || 0)
                                                ? dataSample?.rows[rowIndex][cellIndex]
                                                : null;
                            const wasTransformed = originalValue !== cell && 
                                                  changedFields.includes(transformedData.columns[cellIndex]);
                            
                            return (
                              <td 
                                key={cellIndex}
                                className={`px-4 py-2 text-sm text-gray-500 ${
                                  wasTransformed ? 'bg-green-50' : ''
                                }`}
                              >
                                {cell === null || cell === undefined || cell === '' 
                                  ? <em className="text-gray-400">empty</em> 
                                  : String(cell)}
                                {wasTransformed && (
                                  <span className="ml-1 text-green-500 tooltip" title={`Original: ${originalValue === '' ? 'empty' : String(originalValue)}`}>*</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {transformedData.rows.length > 5 && (
                    <p className="text-center text-sm text-gray-500 mt-2">
                      Showing 5 of {transformedData.rows.length} rows
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>

      <CardFooter className="bg-gray-50 border-t px-6 py-3">
        <div className="w-full flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {transformedData 
              ? `Last executed: ${new Date().toLocaleString()}`
              : 'Not yet executed'}
          </div>
          {transformedData && transformationStats && (
            <Badge variant="default">
              {transformationStats.totalTransformations} transformations applied
            </Badge>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default TransformationRuleExecutor;