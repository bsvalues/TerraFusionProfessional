import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Code, 
  Play, 
  Plus, 
  Trash2, 
  Edit, 
  CheckCircle, 
  ExternalLink
} from 'lucide-react';
import { TransformationRule } from '../../services/etl/ETLTypes';

// Mock data for sample transformations
const sampleTransformations: TransformationRule[] = [
  {
    id: 'rule-1',
    name: 'Convert to Uppercase',
    description: 'Converts text values to uppercase',
    dataType: 'text',
    transformationCode: 'UPPER(${field})',
    isActive: true,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)   // 2 days ago
  },
  {
    id: 'rule-2',
    name: 'Calculate Area',
    description: 'Calculate property area from length and width',
    dataType: 'number',
    transformationCode: '${length} * ${width}',
    isActive: true,
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)   // 1 day ago
  },
  {
    id: 'rule-3',
    name: 'Data Quality Check',
    description: 'Validates data quality',
    dataType: 'boolean',
    transformationCode: '${value} != NULL AND LENGTH(${value}) > 0',
    isActive: false,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)   // 1 day ago
  },
  {
    id: 'rule-4',
    name: 'Format Date',
    description: 'Formats dates to ISO standard',
    dataType: 'date',
    transformationCode: 'TO_CHAR(${date}, \'YYYY-MM-DD\')',
    isActive: true,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)   // 1 day ago
  }
];

// Mock function to test a transformation
const testTransformation = async (code: string): Promise<{ success: boolean; result?: string; error?: string }> => {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  try {
    // Simple validation for demonstration purposes
    if (!code.trim()) {
      throw new Error('Transformation code cannot be empty');
    }
    
    if (code.includes('ERROR')) {
      throw new Error('Transformation contains errors');
    }
    
    return {
      success: true,
      result: 'Transformation is valid and executable'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export function ETLTransformationEditor() {
  const [transformations, setTransformations] = useState<TransformationRule[]>(sampleTransformations);
  const [selectedTransformation, setSelectedTransformation] = useState<TransformationRule | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [isTestingCode, setIsTestingCode] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; result?: string; error?: string } | null>(null);
  const [showCodePanel, setShowCodePanel] = useState(false);
  
  const [formData, setFormData] = useState<Partial<TransformationRule>>({
    name: '',
    description: '',
    dataType: 'text',
    transformationCode: '',
    isActive: true
  });
  
  // Handle selecting a transformation
  const handleSelectTransformation = (transformation: TransformationRule) => {
    setSelectedTransformation(transformation);
    setTestResult(null);
    setShowCodePanel(true);
  };
  
  // Handle opening the create form
  const handleOpenCreateForm = () => {
    setFormData({
      name: '',
      description: '',
      dataType: 'text',
      transformationCode: '',
      isActive: true
    });
    setIsEdit(false);
    setFormOpen(true);
  };
  
  // Handle opening the edit form
  const handleOpenEditForm = (transformation: TransformationRule) => {
    setFormData({
      name: transformation.name,
      description: transformation.description,
      dataType: transformation.dataType,
      transformationCode: transformation.transformationCode,
      isActive: transformation.isActive
    });
    setIsEdit(true);
    setFormOpen(true);
  };
  
  // Handle form submission
  const handleFormSubmit = () => {
    const now = new Date();
    
    if (isEdit && selectedTransformation) {
      // Update existing transformation
      const updatedTransformations = transformations.map(t => 
        t.id === selectedTransformation.id 
          ? { 
              ...t, 
              ...formData, 
              updatedAt: now 
            }
          : t
      );
      
      setTransformations(updatedTransformations);
      setSelectedTransformation({
        ...selectedTransformation,
        ...formData,
        updatedAt: now
      });
    } else {
      // Create new transformation
      const newTransformation: TransformationRule = {
        id: `rule-${transformations.length + 1}`,
        name: formData.name || 'Unnamed Transformation',
        description: formData.description || '',
        dataType: formData.dataType as 'text' | 'number' | 'date' | 'boolean' | 'object',
        transformationCode: formData.transformationCode || '',
        isActive: formData.isActive || false,
        createdAt: now,
        updatedAt: now
      };
      
      setTransformations([...transformations, newTransformation]);
      setSelectedTransformation(newTransformation);
      setShowCodePanel(true);
    }
    
    // Close the form
    setFormOpen(false);
  };
  
  // Handle form input change
  const handleFormInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle form select change
  const handleFormSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle form switch change
  const handleFormSwitchChange = (name: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle toggling transformation active state
  const handleToggleActive = (id: string) => {
    const updatedTransformations = transformations.map(t => 
      t.id === id 
        ? { ...t, isActive: !t.isActive, updatedAt: new Date() }
        : t
    );
    
    setTransformations(updatedTransformations);
    
    // Update selected transformation if it's the one being toggled
    if (selectedTransformation && selectedTransformation.id === id) {
      setSelectedTransformation({
        ...selectedTransformation,
        isActive: !selectedTransformation.isActive,
        updatedAt: new Date()
      });
    }
  };
  
  // Handle deleting a transformation
  const handleDeleteTransformation = (id: string) => {
    const updatedTransformations = transformations.filter(t => t.id !== id);
    setTransformations(updatedTransformations);
    
    // Clear selection if the deleted transformation was selected
    if (selectedTransformation && selectedTransformation.id === id) {
      setSelectedTransformation(null);
      setShowCodePanel(false);
    }
  };
  
  // Handle testing transformation code
  const handleTestCode = async () => {
    if (!selectedTransformation) return;
    
    setIsTestingCode(true);
    setTestResult(null);
    
    try {
      const result = await testTransformation(selectedTransformation.transformationCode);
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsTestingCode(false);
    }
  };
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ETL Transformation Rules</h1>
        <Button onClick={handleOpenCreateForm}>
          <Plus className="h-4 w-4 mr-2" />
          Create Transformation
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Transformation Rules</CardTitle>
              <CardDescription>
                Define how data should be transformed during ETL processes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transformations.map(transformation => (
                  <Card 
                    key={transformation.id} 
                    className={`cursor-pointer transition-colors ${
                      selectedTransformation?.id === transformation.id 
                        ? 'bg-gray-50 border-blue-300' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleSelectTransformation(transformation)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium">{transformation.name}</h3>
                            {!transformation.isActive && (
                              <Badge variant="outline" className="text-gray-500 border-gray-300">
                                Inactive
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {transformation.description || 'No description'}
                          </p>
                          <div className="flex items-center mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {transformation.dataType.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleActive(transformation.id);
                            }}
                          >
                            {transformation.isActive ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-gray-300" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditForm(transformation);
                            }}
                          >
                            <Edit className="h-4 w-4 text-gray-500" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTransformation(transformation.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-gray-500" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {transformations.length === 0 && (
                  <div className="text-center p-6 text-gray-500 bg-gray-50 rounded-md">
                    No transformation rules defined
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          {showCodePanel && selectedTransformation ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{selectedTransformation.name}</CardTitle>
                    <CardDescription>
                      {selectedTransformation.description || 'No description'}
                    </CardDescription>
                  </div>
                  <Badge variant={selectedTransformation.isActive ? 'default' : 'secondary'}>
                    {selectedTransformation.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="transformationCode" className="text-sm font-medium flex items-center">
                      <Code className="h-4 w-4 mr-1" />
                      Transformation Code
                      <Badge className="ml-2" variant="outline">
                        {selectedTransformation.dataType.toUpperCase()}
                      </Badge>
                    </Label>
                    <div className="mt-2 relative">
                      <div className="rounded-md overflow-hidden border border-gray-300">
                        <pre className="bg-gray-50 p-4 font-mono text-sm overflow-auto max-h-[300px]">
                          <code>{selectedTransformation.transformationCode}</code>
                        </pre>
                      </div>
                      <Button
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={handleTestCode}
                        disabled={isTestingCode}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Test
                      </Button>
                    </div>
                    
                    {testResult && (
                      <div className={`mt-4 p-4 rounded-md ${
                        testResult.success 
                          ? 'bg-green-50 border border-green-200' 
                          : 'bg-red-50 border border-red-200'
                      }`}>
                        <div className="flex items-start">
                          {testResult.success ? (
                            <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          ) : (
                            <Trash2 className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                          )}
                          <div>
                            <p className={`font-medium ${
                              testResult.success 
                                ? 'text-green-800' 
                                : 'text-red-800'
                            }`}>
                              {testResult.success ? 'Transformation is valid' : 'Transformation error'}
                            </p>
                            <p className={`text-sm mt-1 ${
                              testResult.success 
                                ? 'text-green-700' 
                                : 'text-red-700'
                            }`}>
                              {testResult.success ? testResult.result : testResult.error}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-sm font-medium mb-2">Usage Examples</h3>
                    <Card className="bg-gray-50">
                      <CardContent className="p-4">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-xs font-semibold text-gray-600 uppercase">SQL Example</h4>
                            <pre className="bg-white mt-1 p-3 rounded-md text-xs border border-gray-200 overflow-auto">
                              <code>
                                SELECT {selectedTransformation.transformationCode.replace(/\${([^}]+)}/g, '$1')}, 
                                original_value
                                FROM my_table
                              </code>
                            </pre>
                          </div>
                          
                          <div>
                            <h4 className="text-xs font-semibold text-gray-600 uppercase">Python Example</h4>
                            <pre className="bg-white mt-1 p-3 rounded-md text-xs border border-gray-200 overflow-auto">
                              <code>
                                {`def transform_data(df):
    df['transformed_column'] = ${selectedTransformation.transformationCode.replace(/\${([^}]+)}/g, "df['$1']")}
    return df`}
                              </code>
                            </pre>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline"
                  onClick={() => handleOpenEditForm(selectedTransformation)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Transformation
                </Button>
                <Button>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Apply to ETL Job
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12">
                <div className="text-center">
                  <Code className="h-12 w-12 mx-auto text-gray-300" />
                  <h3 className="mt-4 text-lg font-medium">Select a Transformation Rule</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Click on a transformation rule from the list to view and test its code,
                    or create a new transformation rule.
                  </p>
                  <Button
                    className="mt-6"
                    onClick={handleOpenCreateForm}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Transformation
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* Create/Edit Transformation Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEdit ? 'Edit Transformation Rule' : 'Create Transformation Rule'}
            </DialogTitle>
            <DialogDescription>
              {isEdit 
                ? 'Update the details of this transformation rule' 
                : 'Define a new transformation rule for ETL processes'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name || ''}
                onChange={handleFormInputChange}
                placeholder="e.g., Convert to Uppercase"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description || ''}
                onChange={handleFormInputChange}
                placeholder="Briefly describe what this transformation does"
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dataType">Data Type</Label>
              <Select
                defaultValue={formData.dataType || 'text'}
                onValueChange={(value) => handleFormSelectChange('dataType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select data type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="boolean">Boolean</SelectItem>
                  <SelectItem value="object">Object</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="transformationCode">Transformation Code</Label>
              <Textarea
                id="transformationCode"
                name="transformationCode"
                value={formData.transformationCode || ''}
                onChange={handleFormInputChange}
                placeholder="Enter transformation code, using dollar sign and curly braces for field references"
                rows={4}
                className="font-mono"
              />
              <p className="text-xs text-gray-500">
                Use dollar sign and curly braces to reference input fields, e.g., UPPER(fieldName)
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive || false}
                onCheckedChange={(checked) => handleFormSwitchChange('isActive', checked)}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleFormSubmit}>
              {isEdit ? 'Update' : 'Create'} Transformation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}