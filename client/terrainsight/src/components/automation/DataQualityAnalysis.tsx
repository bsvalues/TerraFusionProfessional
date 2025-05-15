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
  FileText, 
  RefreshCw,
  Upload
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import TransformationRuleSuggestions from './TransformationRuleSuggestions';

export interface DataQualityItem {
  field: string;
  issue: string;
  severity: 'low' | 'medium' | 'high';
  recommendation: string;
}

export interface DataQualityAnalysis {
  totalIssues: number;
  completeness: number;
  accuracy: number;
  consistency: number;
  issues: DataQualityItem[];
  summary: string;
  aiRecommendations?: string[];
}

interface DataSample {
  name: string;
  type: string;
  columns: string[];
  rows: (string | number | null)[][];
}

interface DataQualityAnalysisProps {
  dataSample?: DataSample;
  onRefresh?: () => void;
  onRuleCreated?: () => void;
}

export const DataQualityAnalysis: React.FC<DataQualityAnalysisProps> = ({
  dataSample,
  onRefresh,
  onRuleCreated,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<DataQualityAnalysis | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { toast } = useToast();

  const analyzeDataQuality = async () => {
    if (!dataSample) {
      toast({
        title: 'No data to analyze',
        description: 'Please provide a data sample to analyze.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiRequest(
        'POST',
        '/api/etl/analyze-data-quality',
        dataSample
      ) as DataQualityAnalysis;

      setAnalysis(result);
      toast({
        title: 'Analysis complete',
        description: `Found ${result.totalIssues} data quality issues.`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Error analyzing data quality:', error);
      toast({
        title: 'Error',
        description: 'Failed to analyze data quality. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-500 hover:bg-red-600';
      case 'medium':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'low':
        return 'bg-blue-500 hover:bg-blue-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'High';
      case 'medium':
        return 'Medium';
      case 'low':
        return 'Low';
      default:
        return 'Unknown';
    }
  };

  const getQualityStatusColor = (value: number) => {
    if (value >= 90) return 'text-green-600';
    if (value >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (value: number) => {
    if (value >= 90) return 'bg-green-600';
    if (value >= 70) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader className="bg-gray-50">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl">Data Quality Analysis</CardTitle>
              <CardDescription>
                Analyze your data for quality issues and receive recommendations
              </CardDescription>
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={analyzeDataQuality}
                disabled={isLoading || !dataSample}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Analyze Quality
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {!analysis ? (
            <div className="text-center py-10">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-2" />
              <h3 className="text-lg font-medium">No Analysis Available</h3>
              <p className="text-gray-500 mt-1">
                {dataSample
                  ? 'Click "Analyze Quality" to evaluate your data.'
                  : 'Please provide a data sample to analyze.'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="border rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Completeness</h3>
                  <div className="flex items-center justify-between mb-2">
                    <p className={`text-2xl font-bold ${getQualityStatusColor(analysis.completeness)}`}>
                      {analysis.completeness}%
                    </p>
                    {analysis.completeness >= 90 ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                    )}
                  </div>
                  <Progress value={analysis.completeness} className={getProgressColor(analysis.completeness)} />
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Accuracy</h3>
                  <div className="flex items-center justify-between mb-2">
                    <p className={`text-2xl font-bold ${getQualityStatusColor(analysis.accuracy)}`}>
                      {analysis.accuracy}%
                    </p>
                    {analysis.accuracy >= 90 ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                    )}
                  </div>
                  <Progress value={analysis.accuracy} className={getProgressColor(analysis.accuracy)} />
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Consistency</h3>
                  <div className="flex items-center justify-between mb-2">
                    <p className={`text-2xl font-bold ${getQualityStatusColor(analysis.consistency)}`}>
                      {analysis.consistency}%
                    </p>
                    {analysis.consistency >= 90 ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                    )}
                  </div>
                  <Progress value={analysis.consistency} className={getProgressColor(analysis.consistency)} />
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Issues Detected ({analysis.totalIssues})</h3>
                {analysis.issues.length === 0 ? (
                  <div className="text-center py-4 border rounded-lg bg-gray-50">
                    <CheckCircle2 className="h-8 w-8 mx-auto text-green-600 mb-2" />
                    <p className="text-gray-700">No data quality issues detected!</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Field</TableHead>
                        <TableHead>Issue</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Recommendation</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analysis.issues.map((issue, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{issue.field}</TableCell>
                          <TableCell>{issue.issue}</TableCell>
                          <TableCell>
                            <Badge className={getSeverityColor(issue.severity)}>
                              {getSeverityLabel(issue.severity)}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-md">{issue.recommendation}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              {analysis.aiRecommendations && analysis.aiRecommendations.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-3">AI Recommendations</h3>
                  <div className="border rounded-lg p-4 bg-blue-50">
                    <ul className="list-disc pl-5 space-y-1">
                      {analysis.aiRecommendations.map((recommendation, index) => (
                        <li key={index}>{recommendation}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-center">
                <Button 
                  variant="outline" 
                  onClick={() => setShowSuggestions(!showSuggestions)}
                >
                  {showSuggestions ? 'Hide Suggestions' : 'Show Transformation Suggestions'}
                </Button>
              </div>
            </>
          )}
        </CardContent>

        <CardFooter className="bg-gray-50 border-t px-6 py-3">
          <div className="w-full flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {analysis
                ? `Last analyzed: ${new Date().toLocaleString()}`
                : 'Not yet analyzed'}
            </div>
            {analysis && analysis.issues.length > 0 && (
              <Button 
                variant="default" 
                size="sm"
                onClick={() => setShowSuggestions(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Get Fix Suggestions
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      {showSuggestions && analysis && (
        <TransformationRuleSuggestions 
          issues={analysis.issues} 
          onRefresh={onRefresh}
          onRuleCreated={onRuleCreated}
        />
      )}
    </div>
  );
};

export default DataQualityAnalysis;