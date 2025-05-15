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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger 
} from '@/components/ui/accordion';
import {
  AlertCircle,
  CheckCircle2,
  Trash2,
  Info,
  AlertTriangle,
  Settings,
  ArrowRightCircle,
  PlusCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { apiRequest } from '@/lib/queryClient';

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

interface TransformationRuleSuggestionsProps {
  dataSample: DataSample;
  selectedRules?: TransformationRule[];
  onRuleSelect?: (rule: TransformationRule) => void;
}

const TransformationRuleSuggestions: React.FC<TransformationRuleSuggestionsProps> = ({
  dataSample,
  selectedRules = [],
  onRuleSelect = () => {}
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<TransformationRule[]>([]);

  useEffect(() => {
    // Generate suggestions based on the data sample
    generateSuggestions();
  }, [dataSample]);

  const generateSuggestions = () => {
    setIsLoading(true);
    
    // In a real application, we would call the API here
    // For demo purposes, we'll generate suggestions locally
    setTimeout(() => {
      const newSuggestions = [];
      
      // Check for duplicate IDs
      const idColumnIndex = dataSample.columns.indexOf('id');
      if (idColumnIndex !== -1) {
        const ids = dataSample.rows.map(row => row[idColumnIndex]);
        const uniqueIds = new Set(ids);
        
        if (uniqueIds.size < ids.length) {
          newSuggestions.push({
            name: "Fix Duplicate IDs",
            description: "Add a suffix to duplicate ID values to make them unique",
            sourceField: "id",
            targetField: "id",
            transformationType: "deduplicate",
            transformationConfig: {
              strategy: "addSuffix",
              suffixPattern: "_${index}"
            },
            isEnabled: true
          });
        }
      }
      
      // Check for negative values in price/value fields
      const valueColumnIndex = dataSample.columns.indexOf('value');
      if (valueColumnIndex !== -1) {
        const hasNegativeValues = dataSample.rows.some(row => {
          const value = row[valueColumnIndex];
          return typeof value === 'number' && value < 0;
        });
        
        if (hasNegativeValues) {
          newSuggestions.push({
            name: "Fix Negative Values",
            description: "Convert negative values to their absolute value",
            sourceField: "value",
            targetField: "value",
            transformationType: "numberTransform",
            transformationConfig: {
              operation: "abs"
            },
            isEnabled: true
          });
        }
      }
      
      // Check for non-numeric values in price/value fields
      if (valueColumnIndex !== -1) {
        const hasNonNumericValues = dataSample.rows.some(row => {
          const value = row[valueColumnIndex];
          return value !== null && value !== "" && isNaN(Number(value));
        });
        
        if (hasNonNumericValues) {
          newSuggestions.push({
            name: "Convert Text to Numeric",
            description: "Convert non-numeric values to a default value",
            sourceField: "value",
            targetField: "value",
            transformationType: "validation",
            transformationConfig: {
              validationType: "numeric",
              action: "convert",
              fallbackValue: 0
            },
            isEnabled: true
          });
        }
      }
      
      // Check for future years in yearBuilt
      const yearBuiltColumnIndex = dataSample.columns.indexOf('yearBuilt');
      if (yearBuiltColumnIndex !== -1) {
        const currentYear = new Date().getFullYear();
        const hasFutureYears = dataSample.rows.some(row => {
          const year = row[yearBuiltColumnIndex];
          return typeof year === 'number' && year > currentYear;
        });
        
        if (hasFutureYears) {
          newSuggestions.push({
            name: "Fix Future Years",
            description: "Set year values in the future to the current year",
            sourceField: "yearBuilt",
            targetField: "yearBuilt",
            transformationType: "dateValidation",
            transformationConfig: {
              maxDate: new Date().toISOString().split('T')[0],
              invalidAction: "setToMax"
            },
            isEnabled: true
          });
        }
      }
      
      // Check for empty values
      dataSample.columns.forEach(column => {
        const columnIndex = dataSample.columns.indexOf(column);
        const hasEmptyValues = dataSample.rows.some(row => {
          const value = row[columnIndex];
          return value === null || value === undefined || value === "";
        });
        
        if (hasEmptyValues) {
          let defaultValue: string | number = "";
          
          // Suggest appropriate default values based on column type
          if (column === 'value' || column.includes('price') || column.includes('cost')) {
            defaultValue = 0;
          } else if (column.includes('date')) {
            defaultValue = "CURRENT_DATE";
          } else if (column.includes('year')) {
            defaultValue = new Date().getFullYear();
          } else if (column.includes('id')) {
            defaultValue = "UNKNOWN";
          }
          
          newSuggestions.push({
            name: `Fill Empty ${column} Values`,
            description: `Fill missing or empty ${column} values with a default`,
            sourceField: column,
            targetField: column,
            transformationType: "fillMissingValues",
            transformationConfig: {
              defaultValue: defaultValue
            },
            isEnabled: true
          });
        }
      });
      
      // Add quality score calculation rule
      newSuggestions.push({
        name: "Calculate Data Quality Score",
        description: "Add a quality score column to evaluate each record",
        sourceField: "*",
        targetField: "qualityScore",
        transformationType: "qualityScore",
        transformationConfig: {
          factors: ["completeness", "validity"],
          weights: {
            completeness: 0.6,
            validity: 0.4
          }
        },
        isEnabled: true
      });
      
      setSuggestions(newSuggestions);
      setIsLoading(false);
    }, 500);
  };

  const isRuleSelected = (rule: TransformationRule) => {
    return selectedRules.some(r => r.name === rule.name);
  };

  const renderTransformationConfig = (rule: TransformationRule) => {
    const { transformationType, transformationConfig } = rule;
    
    switch (transformationType) {
      case 'fillMissingValues':
        return (
          <div className="text-sm">
            <p>Default value: <span className="font-mono bg-gray-100 px-1 rounded">{String(transformationConfig.defaultValue)}</span></p>
          </div>
        );
        
      case 'validation':
        return (
          <div className="text-sm">
            <p>Type: <span className="font-mono bg-gray-100 px-1 rounded">{transformationConfig.validationType}</span></p>
            <p>Action: <span className="font-mono bg-gray-100 px-1 rounded">{transformationConfig.action}</span></p>
            <p>Fallback: <span className="font-mono bg-gray-100 px-1 rounded">{String(transformationConfig.fallbackValue)}</span></p>
          </div>
        );
        
      case 'numberTransform':
        return (
          <div className="text-sm">
            <p>Operation: <span className="font-mono bg-gray-100 px-1 rounded">{transformationConfig.operation}</span></p>
          </div>
        );
        
      case 'deduplicate':
        return (
          <div className="text-sm">
            <p>Strategy: <span className="font-mono bg-gray-100 px-1 rounded">{transformationConfig.strategy}</span></p>
            <p>Pattern: <span className="font-mono bg-gray-100 px-1 rounded">{transformationConfig.suffixPattern}</span></p>
          </div>
        );
        
      case 'dateValidation':
        return (
          <div className="text-sm">
            <p>Max date: <span className="font-mono bg-gray-100 px-1 rounded">{transformationConfig.maxDate || 'Current date'}</span></p>
            <p>Invalid action: <span className="font-mono bg-gray-100 px-1 rounded">{transformationConfig.invalidAction}</span></p>
          </div>
        );
        
      case 'qualityScore':
        return (
          <div className="text-sm">
            <p>Factors: {transformationConfig.factors.map((factor: string, index: number) => (
              <Badge key={index} variant="outline" className="ml-1">{factor}</Badge>
            ))}</p>
            <p className="mt-1">Weights: {Object.entries(transformationConfig.weights).map(([key, value], index) => (
              <Badge key={index} variant="outline" className="ml-1">{key}: {value}</Badge>
            ))}</p>
          </div>
        );
        
      default:
        return null;
    }
  };

  const getSeverityIcon = (type: string) => {
    switch (type) {
      case 'deduplicate':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'numberTransform':
      case 'validation':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'dateValidation':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'fillMissingValues':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'qualityScore':
        return <Settings className="h-5 w-5 text-gray-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="bg-gray-50">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl">Transformation Rule Suggestions</CardTitle>
            <CardDescription>
              Based on analysis of your data quality issues
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={generateSuggestions}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-800"></div>
            ) : (
              <>
                Refresh Suggestions
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="ml-3 text-gray-500">Analyzing data and generating suggestions...</p>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-2" />
            <h3 className="text-lg font-medium">No Issues Detected</h3>
            <p className="text-gray-500 mt-1">
              Your data appears to be clean. No transformation rules are needed.
            </p>
          </div>
        ) : (
          <Accordion type="multiple" className="space-y-2">
            {suggestions.map((rule, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className={`border rounded-lg ${
                  isRuleSelected(rule) ? 'border-primary bg-primary/5' : 'border-gray-200'
                }`}
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center w-full">
                    <div className="mr-3">
                      {getSeverityIcon(rule.transformationType)}
                    </div>
                    <div className="flex-grow text-left">
                      <h4 className="font-medium text-base">{rule.name}</h4>
                      <p className="text-sm text-gray-600">{rule.description}</p>
                    </div>
                    <div className="ml-2">
                      <Badge variant={isRuleSelected(rule) ? "default" : "outline"}>
                        {rule.transformationType}
                      </Badge>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-3 pt-0">
                  <div className="grid md:grid-cols-2 gap-4 pt-2 border-t">
                    <div>
                      <h5 className="font-medium text-sm mb-1">Configuration</h5>
                      {renderTransformationConfig(rule)}
                      
                      <div className="mt-3">
                        <h5 className="font-medium text-sm mb-1">Fields</h5>
                        <div className="flex items-center gap-2 text-sm">
                          <span>{rule.sourceField}</span>
                          <ArrowRightCircle className="h-4 w-4 text-gray-400" />
                          <span>{rule.targetField}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col justify-between">
                      <div>
                        <h5 className="font-medium text-sm mb-1">Effect</h5>
                        <p className="text-sm text-gray-600">
                          {rule.transformationType === 'fillMissingValues' && 
                            `Fill empty values in ${rule.sourceField} with a default value.`}
                          {rule.transformationType === 'validation' && 
                            `Validate and convert non-numeric values in ${rule.sourceField}.`}
                          {rule.transformationType === 'numberTransform' && 
                            `Transform negative values in ${rule.sourceField} to their absolute value.`}
                          {rule.transformationType === 'deduplicate' && 
                            `Add suffixes to duplicate values in ${rule.sourceField} to make them unique.`}
                          {rule.transformationType === 'dateValidation' && 
                            `Fix future dates in ${rule.sourceField} by setting them to the current date.`}
                          {rule.transformationType === 'qualityScore' && 
                            `Calculate a quality score for each record based on completeness and validity.`}
                        </p>
                      </div>
                      
                      <div className="mt-4 flex justify-end">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id={`select-rule-${index}`}
                            checked={isRuleSelected(rule)}
                            onCheckedChange={() => onRuleSelect(rule)}
                          />
                          <label
                            htmlFor={`select-rule-${index}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {isRuleSelected(rule) ? 'Selected' : 'Select this rule'}
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>

      <CardFooter className="bg-gray-50 border-t px-6 py-3">
        <div className="w-full flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {suggestions.length} rule suggestions based on data analysis
          </div>
          <div className="flex items-center">
            <span className="text-sm text-gray-500 mr-2">
              {selectedRules.length} rules selected
            </span>
            <Badge variant="outline">
              {selectedRules.length}/{suggestions.length}
            </Badge>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default TransformationRuleSuggestions;