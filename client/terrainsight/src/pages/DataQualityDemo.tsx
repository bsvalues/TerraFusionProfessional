import React, { useState, useEffect } from 'react';
import { 
  Alert, 
  AlertDescription, 
  AlertTitle 
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger
} from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Database, Table2, FileText, Play, Wand2 } from 'lucide-react';
import DataQualityAnalysis from '@/components/automation/DataQualityAnalysis';
import TransformationRuleSuggestions from '@/components/automation/TransformationRuleSuggestions';
import TransformationRuleExecutor from '@/components/automation/TransformationRuleExecutor';

const DataQualityDemo: React.FC = () => {
  const [selectedSample, setSelectedSample] = useState<string>('sample1');
  
  // Sample data sets with various data quality issues
  const dataSamples = {
    sample1: {
      name: "Property Data Sample With Issues",
      type: "csv",
      columns: ["id", "address", "value", "yearBuilt", "parcelId"],
      rows: [
        [1, "123 Main St", 450000, 2008, "P123456"],
        [1, "456 Oak Ave", -375000, 2004, "P789012"],
        [3, "789 Pine Ln", "NOT_A_NUMBER", 2012, "P345678"],
        [4, "321 Cedar Dr", 625000, 2050, "P901234"],
        [5, "987 Maple St", "", 2001, "P567890"]
      ]
    },
    sample2: {
      name: "Clean Property Data Sample",
      type: "csv",
      columns: ["id", "address", "value", "yearBuilt", "parcelId"],
      rows: [
        [1, "123 Main St", 450000, 2008, "P123456"],
        [2, "456 Oak Ave", 375000, 2004, "P789012"],
        [3, "789 Pine Ln", 525000, 2012, "P345678"],
        [4, "321 Cedar Dr", 625000, 2015, "P901234"],
        [5, "987 Maple St", 395000, 2001, "P567890"]
      ]
    },
    sample3: {
      name: "Mixed Commercial Properties",
      type: "csv",
      columns: ["id", "address", "type", "squareFeet", "yearBuilt", "value"],
      rows: [
        [1, "100 Commerce Way", "Retail", 5200, 1998, 1250000],
        [2, "200 Business Blvd", "Office", "", 2005, 1750000],
        [3, "300 Market St", "Mixed Use", 8500, 2010, "Contact Agent"],
        [4, "400 Industry Pkwy", "Warehouse", 12500, 1985, -2500000],
        [5, "500 Corporate Dr", "Office", 7000, 2045, 2100000]
      ]
    }
  };

  const getCurrentSample = () => {
    return dataSamples[selectedSample as keyof typeof dataSamples];
  };

  const handleSampleChange = (value: string) => {
    setSelectedSample(value);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <h1 className="text-3xl font-bold mb-2">Data Quality Management</h1>
      <p className="text-gray-600 mb-6">
        Analyze and improve the quality of your property data through automated validation and transformation
      </p>

      <Alert className="mb-6 bg-blue-50">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Demo Mode</AlertTitle>
        <AlertDescription>
          This is a demonstration of the data quality analysis and transformation rule suggestion features.
          Select different sample datasets to see how the system identifies and suggests fixes for various quality issues.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="analyze" className="mb-6">
        <TabsList className="grid grid-cols-2 w-[400px]">
          <TabsTrigger value="analyze" className="flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Data Quality Analysis
          </TabsTrigger>
          <TabsTrigger value="about" className="flex items-center">
            <Database className="h-4 w-4 mr-2" />
            About This Feature
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analyze" className="pt-4">
          <Card className="mb-6">
            <CardHeader className="bg-gray-50">
              <CardTitle className="text-xl">Sample Dataset Selection</CardTitle>
              <CardDescription>
                Choose a predefined dataset to analyze for quality issues
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Select Data Sample
                  </label>
                  <Select value={selectedSample} onValueChange={handleSampleChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a sample dataset" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sample1">Property Data With Issues</SelectItem>
                      <SelectItem value="sample2">Clean Property Data</SelectItem>
                      <SelectItem value="sample3">Mixed Commercial Properties</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">{getCurrentSample().name}</p>
                    <p>{getCurrentSample().rows.length} records, {getCurrentSample().columns.length} columns</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border">
                  <thead className="bg-gray-50">
                    <tr>
                      {getCurrentSample().columns.map((column, index) => (
                        <th 
                          key={index}
                          className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getCurrentSample().rows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                          <td 
                            key={cellIndex}
                            className="px-4 py-2 text-sm text-gray-500"
                          >
                            {cell === "" ? <em className="text-gray-400">empty</em> : String(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6">
            <DataQualityAnalysis 
              dataSample={getCurrentSample()} 
              onRefresh={() => console.log('Refreshing data')}
              onRuleCreated={() => console.log('Rule created')} 
            />
            
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                <span className="mr-2">Transformation Rules</span>
                <span className="text-sm font-normal text-gray-500">
                  (Automatically generated based on data quality issues)
                </span>
              </h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <RuleManagementTabs dataSample={getCurrentSample()} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="about" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>About Data Quality Management</CardTitle>
              <CardDescription>
                Understanding the importance of data quality in property analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h3>Why Data Quality Matters</h3>
              <p>
                High-quality data is essential for accurate property valuations and analysis. Poor data quality can lead to incorrect valuations, 
                skewed market analyses, and unreliable trend identification. Our data quality management system helps identify and resolve 
                common issues found in property datasets.
              </p>

              <h3>Key Features</h3>
              <ul>
                <li><strong>Automated Quality Analysis</strong> - Identifies issues such as missing values, inconsistent formats, and invalid data</li>
                <li><strong>Smart Transformation Rules</strong> - Suggests and implements data transformations to fix identified issues</li>
                <li><strong>Quality Metrics</strong> - Measures completeness, accuracy, and consistency of your data</li>
                <li><strong>AI-Enhanced Recommendations</strong> - Uses advanced AI to provide context-aware suggestions</li>
              </ul>

              <h3>Types of Issues Detected</h3>
              <ul>
                <li>Missing or empty values in critical fields</li>
                <li>Numeric fields containing text or invalid numbers</li>
                <li>Negative values in fields that should be positive (e.g., property values)</li>
                <li>Future dates in historical fields (e.g., construction years)</li>
                <li>Duplicate identifiers that should be unique</li>
                <li>Inconsistent formatting of addresses and other text fields</li>
              </ul>
            </CardContent>
            <CardFooter className="bg-gray-50 border-t">
              <p className="text-sm text-gray-600">
                This system is part of our comprehensive ETL (Extract, Transform, Load) management platform,
                designed specifically for property data analysis professionals.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Rule Management Tabs component for suggestions and execution
interface RuleManagementTabsProps {
  dataSample: {
    name: string;
    type: string;
    columns: string[];
    rows: (string | number | null)[][];
  };
}

const RuleManagementTabs: React.FC<RuleManagementTabsProps> = ({ dataSample }) => {
  const [activeTab, setActiveTab] = useState<string>('suggestions');
  const [transformedData, setTransformedData] = useState<any>(null);
  const [selectedRules, setSelectedRules] = useState<any[]>([]);

  const handleRuleSelect = (rule: any) => {
    // Check if rule is already selected
    const isSelected = selectedRules.some(r => r.name === rule.name);
    
    if (isSelected) {
      // Deselect the rule
      setSelectedRules(selectedRules.filter(r => r.name !== rule.name));
    } else {
      // Select the rule
      setSelectedRules([...selectedRules, rule]);
    }
  };

  const handleTransformationComplete = (newData: any) => {
    setTransformedData(newData);
    // Automatically switch to the "Review Results" tab
    setActiveTab('results');
  };

  return (
    <>
      <div className="col-span-2 mb-2">
        <div className="flex space-x-4 border-b">
          <button
            className={`pb-2 pt-1 px-1 font-medium text-sm flex items-center ${
              activeTab === 'suggestions' 
                ? 'border-b-2 border-primary text-primary' 
                : 'text-gray-500 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('suggestions')}
          >
            <Wand2 className="h-4 w-4 mr-2" />
            Suggested Rules
          </button>
          <button
            className={`pb-2 pt-1 px-1 font-medium text-sm flex items-center ${
              activeTab === 'execute' 
                ? 'border-b-2 border-primary text-primary' 
                : 'text-gray-500 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('execute')}
          >
            <Play className="h-4 w-4 mr-2" />
            Execute Rules
          </button>
          <button
            className={`pb-2 pt-1 px-1 font-medium text-sm flex items-center ${
              activeTab === 'results' 
                ? 'border-b-2 border-primary text-primary' 
                : 'text-gray-500 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('results')}
            disabled={!transformedData}
          >
            <Table2 className="h-4 w-4 mr-2" />
            Review Results
          </button>
        </div>
      </div>

      <div className="col-span-2">
        {activeTab === 'suggestions' && (
          <TransformationRuleSuggestions
            dataSample={dataSample}
            onRuleSelect={handleRuleSelect}
            selectedRules={selectedRules}
          />
        )}

        {activeTab === 'execute' && (
          <TransformationRuleExecutor
            dataSample={dataSample}
            rules={selectedRules}
            onTransformationComplete={handleTransformationComplete}
          />
        )}

        {activeTab === 'results' && transformedData && (
          <Card>
            <CardHeader className="bg-gray-50">
              <CardTitle className="text-xl">Transformation Results</CardTitle>
              <CardDescription>
                Review the results of applying your selected transformation rules
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border">
                  <thead className="bg-gray-50">
                    <tr>
                      {transformedData.columns.map((column: string, index: number) => (
                        <th 
                          key={index}
                          className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transformedData.rows.map((row: any[], rowIndex: number) => (
                      <tr key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                          <td 
                            key={cellIndex}
                            className="px-4 py-2 text-sm text-gray-500"
                          >
                            {cell === null || cell === undefined || cell === "" 
                              ? <em className="text-gray-400">empty</em> 
                              : String(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
            
            <CardFooter className="bg-gray-50 border-t px-6 py-3">
              <div className="w-full flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Applied {selectedRules.length} transformation rules
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setActiveTab('execute')}
                >
                  Back to Transformation Rules
                </Button>
              </div>
            </CardFooter>
          </Card>
        )}
      </div>
    </>
  );
};

export default DataQualityDemo;