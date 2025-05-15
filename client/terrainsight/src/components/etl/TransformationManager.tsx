import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { TransformationRule, TransformationType } from '../../services/etl/ETLTypes';
import { 
  Filter, 
  Map, 
  BarChart3, 
  GitMerge, 
  ArrowDownUp, 
  Group, 
  CheckSquare, 
  Plus, 
  Edit, 
  Trash2, 
  Move,
  RefreshCw,
  Fingerprint,
  Code,
  ArrowDown,
  ArrowUp,
  Copy
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { transformationService } from '../../services/etl/TransformationService';

interface TransformationManagerProps {
  transformations: TransformationRule[];
  onAddTransformation: (transformation: TransformationRule) => void;
  onUpdateTransformation: (transformation: TransformationRule) => void;
  onDeleteTransformation: (id: number) => void;
  onReorderTransformations: (transformations: TransformationRule[]) => void;
}

const TransformationManager: React.FC<TransformationManagerProps> = ({
  transformations,
  onAddTransformation,
  onUpdateTransformation,
  onDeleteTransformation,
  onReorderTransformations
}) => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingTransformation, setEditingTransformation] = useState<TransformationRule | null>(null);
  const [deletingTransformationId, setDeletingTransformationId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>("filter");
  const [sortedTransformations, setSortedTransformations] = useState<TransformationRule[]>([]);
  
  // Form state
  const [formValues, setFormValues] = useState({
    name: "",
    description: "",
    type: TransformationType.FILTER,
    order: 0,
    enabled: true,
    
    // Filter fields
    filterConditions: JSON.stringify([
      { field: "", operator: "equals", value: "" }
    ], null, 2),
    
    // Map fields
    mapConfig: JSON.stringify({
      mappings: [
        { source: "", target: "", defaultValue: "", transform: "" }
      ],
      includeOriginal: true
    }, null, 2),
    
    // Aggregate fields
    aggregateConfig: JSON.stringify({
      aggregations: [
        { field: "", operator: "sum", alias: "" }
      ]
    }, null, 2),
    
    // Join fields
    joinConfig: JSON.stringify({
      rightSourceId: "",
      leftKey: "",
      rightKey: "",
      type: "inner",
      prefix: "right_"
    }, null, 2),
    
    // Sort fields
    sortConfig: JSON.stringify({
      sortBy: [
        { field: "", direction: "asc" }
      ]
    }, null, 2),
    
    // Group fields
    groupConfig: JSON.stringify({
      groupBy: [""],
      aggregations: [
        { field: "", operator: "sum", alias: "" }
      ]
    }, null, 2),
    
    // Validate fields
    validateConfig: JSON.stringify({
      validations: [
        { field: "", rules: [{ type: "required", message: "" }] }
      ],
      stopOnFirstError: false,
      logErrors: true
    }, null, 2),
    
    // Custom fields
    customConfig: JSON.stringify({
      function: `function transformData(data) {
  // Add your custom transformation logic here
  return data;
}`
    }, null, 2)
  });
  
  // Update sorted transformations when transformations change
  useEffect(() => {
    setSortedTransformations([...transformations].sort((a, b) => a.order - b.order));
  }, [transformations]);
  
  // Reset form when dialog closes
  useEffect(() => {
    if (!isDialogOpen) {
      setEditingTransformation(null);
      resetForm();
    }
  }, [isDialogOpen]);
  
  // Initialize form when editing a transformation
  useEffect(() => {
    if (editingTransformation) {
      // Set common fields
      setFormValues({
        ...formValues,
        name: editingTransformation.name,
        description: editingTransformation.description || "",
        type: editingTransformation.type,
        order: editingTransformation.order,
        enabled: editingTransformation.enabled,
        
        // Set type-specific configurations
        ...initializeTypeSpecificFields(editingTransformation)
      });
      
      // Set active tab based on transformation type
      setActiveTab(getTabFromTransformationType(editingTransformation.type));
    }
  }, [editingTransformation]);
  
  /**
   * Get tab name from transformation type
   */
  const getTabFromTransformationType = (type: TransformationType): string => {
    switch (type) {
      case TransformationType.FILTER:
        return "filter";
      case TransformationType.MAP:
        return "map";
      case TransformationType.AGGREGATE:
        return "aggregate";
      case TransformationType.JOIN:
        return "join";
      case TransformationType.SORT:
        return "sort";
      case TransformationType.GROUP:
        return "group";
      case TransformationType.VALIDATE:
        return "validate";
      case TransformationType.DEDUPLICATE:
        return "deduplicate";
      case TransformationType.CUSTOM:
        return "custom";
      default:
        return "filter";
    }
  };
  
  /**
   * Initialize type-specific form fields from a transformation
   */
  const initializeTypeSpecificFields = (transformation: TransformationRule) => {
    const fields: any = {};
    const config = transformation.config;
    
    if (!config) {
      return fields;
    }
    
    switch (transformation.type) {
      case TransformationType.FILTER:
        fields.filterConditions = JSON.stringify(config.conditions || [], null, 2);
        break;
      
      case TransformationType.MAP:
        fields.mapConfig = JSON.stringify({
          mappings: config.mappings || [],
          includeOriginal: config.includeOriginal || false
        }, null, 2);
        break;
      
      case TransformationType.AGGREGATE:
        fields.aggregateConfig = JSON.stringify({
          aggregations: config.aggregations || []
        }, null, 2);
        break;
      
      case TransformationType.JOIN:
        fields.joinConfig = JSON.stringify({
          rightSourceId: config.rightSourceId || "",
          leftKey: config.leftKey || "",
          rightKey: config.rightKey || "",
          type: config.type || "inner",
          prefix: config.prefix || "right_"
        }, null, 2);
        break;
      
      case TransformationType.SORT:
        fields.sortConfig = JSON.stringify({
          sortBy: config.sortBy || []
        }, null, 2);
        break;
      
      case TransformationType.GROUP:
        fields.groupConfig = JSON.stringify({
          groupBy: config.groupBy || [],
          aggregations: config.aggregations || []
        }, null, 2);
        break;
      
      case TransformationType.VALIDATE:
        fields.validateConfig = JSON.stringify({
          validations: config.validations || [],
          stopOnFirstError: config.stopOnFirstError || false,
          logErrors: config.logErrors !== false
        }, null, 2);
        break;
      
      case TransformationType.CUSTOM:
        fields.customConfig = JSON.stringify({
          function: config.function || ""
        }, null, 2);
        break;
    }
    
    return fields;
  };
  
  /**
   * Reset form state
   */
  const resetForm = () => {
    const maxOrder = transformations.reduce((max, t) => Math.max(max, t.order), -1) + 1;
    
    setFormValues({
      name: "",
      description: "",
      type: TransformationType.FILTER,
      order: maxOrder,
      enabled: true,
      
      filterConditions: JSON.stringify([
        { field: "", operator: "equals", value: "" }
      ], null, 2),
      
      mapConfig: JSON.stringify({
        mappings: [
          { source: "", target: "", defaultValue: "", transform: "" }
        ],
        includeOriginal: true
      }, null, 2),
      
      aggregateConfig: JSON.stringify({
        aggregations: [
          { field: "", operator: "sum", alias: "" }
        ]
      }, null, 2),
      
      joinConfig: JSON.stringify({
        rightSourceId: "",
        leftKey: "",
        rightKey: "",
        type: "inner",
        prefix: "right_"
      }, null, 2),
      
      sortConfig: JSON.stringify({
        sortBy: [
          { field: "", direction: "asc" }
        ]
      }, null, 2),
      
      groupConfig: JSON.stringify({
        groupBy: [""],
        aggregations: [
          { field: "", operator: "sum", alias: "" }
        ]
      }, null, 2),
      
      validateConfig: JSON.stringify({
        validations: [
          { field: "", rules: [{ type: "required", message: "" }] }
        ],
        stopOnFirstError: false,
        logErrors: true
      }, null, 2),
      
      customConfig: JSON.stringify({
        function: `function transformData(data) {
  // Add your custom transformation logic here
  return data;
}`
      }, null, 2)
    });
    
    setActiveTab("filter");
  };
  
  /**
   * Handle input change
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };
  
  /**
   * Handle select change
   */
  const handleSelectChange = (name: string, value: string) => {
    setFormValues(prev => ({ ...prev, [name]: value }));
    
    // If changing the transformation type, update the active tab
    if (name === "type") {
      const newType = value as TransformationType;
      setActiveTab(getTabFromTransformationType(newType));
    }
  };
  
  /**
   * Handle checkbox change
   */
  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormValues(prev => ({ ...prev, [name]: checked }));
  };
  
  /**
   * Handle form submission
   */
  const handleSubmit = () => {
    // Validate form
    if (!formValues.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Transformation name is required",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Create transformation object
      const transformation: TransformationRule = {
        id: editingTransformation?.id || Date.now(),
        name: formValues.name.trim(),
        description: formValues.description.trim() || undefined,
        type: formValues.type as TransformationType,
        order: formValues.order,
        enabled: formValues.enabled,
        config: buildConfig()
      };
      
      // Save transformation
      if (editingTransformation) {
        onUpdateTransformation(transformation);
        toast({
          title: "Transformation Updated",
          description: `Transformation "${transformation.name}" has been updated successfully.`
        });
      } else {
        onAddTransformation(transformation);
        toast({
          title: "Transformation Added",
          description: `Transformation "${transformation.name}" has been added successfully.`
        });
      }
      
      // Close dialog
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: `Error saving transformation: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive"
      });
    }
  };
  
  /**
   * Build configuration object based on transformation type
   */
  const buildConfig = () => {
    const config: any = {};
    
    try {
      switch (formValues.type) {
        case TransformationType.FILTER:
          config.conditions = JSON.parse(formValues.filterConditions);
          break;
        
        case TransformationType.MAP:
          const mapConfig = JSON.parse(formValues.mapConfig);
          config.mappings = mapConfig.mappings;
          config.includeOriginal = mapConfig.includeOriginal;
          break;
        
        case TransformationType.AGGREGATE:
          const aggregateConfig = JSON.parse(formValues.aggregateConfig);
          config.aggregations = aggregateConfig.aggregations;
          break;
        
        case TransformationType.JOIN:
          const joinConfig = JSON.parse(formValues.joinConfig);
          config.rightSourceId = joinConfig.rightSourceId;
          config.leftKey = joinConfig.leftKey;
          config.rightKey = joinConfig.rightKey;
          config.type = joinConfig.type;
          config.prefix = joinConfig.prefix;
          break;
        
        case TransformationType.SORT:
          const sortConfig = JSON.parse(formValues.sortConfig);
          config.sortBy = sortConfig.sortBy;
          break;
        
        case TransformationType.GROUP:
          const groupConfig = JSON.parse(formValues.groupConfig);
          config.groupBy = groupConfig.groupBy;
          config.aggregations = groupConfig.aggregations;
          break;
        
        case TransformationType.VALIDATE:
          const validateConfig = JSON.parse(formValues.validateConfig);
          config.validations = validateConfig.validations;
          config.stopOnFirstError = validateConfig.stopOnFirstError;
          config.logErrors = validateConfig.logErrors;
          break;
        
        case TransformationType.DEDUPLICATE:
          config.fields = [];
          config.keepFirst = true;
          break;
        
        case TransformationType.CUSTOM:
          const customConfig = JSON.parse(formValues.customConfig);
          config.function = customConfig.function;
          break;
      }
    } catch (e) {
      throw new Error(`Invalid JSON configuration: ${e instanceof Error ? e.message : String(e)}`);
    }
    
    return config;
  };
  
  /**
   * Handle tab change
   */
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Update transformation type based on tab
    switch (value) {
      case "filter":
        handleSelectChange("type", TransformationType.FILTER);
        break;
      case "map":
        handleSelectChange("type", TransformationType.MAP);
        break;
      case "aggregate":
        handleSelectChange("type", TransformationType.AGGREGATE);
        break;
      case "join":
        handleSelectChange("type", TransformationType.JOIN);
        break;
      case "sort":
        handleSelectChange("type", TransformationType.SORT);
        break;
      case "group":
        handleSelectChange("type", TransformationType.GROUP);
        break;
      case "validate":
        handleSelectChange("type", TransformationType.VALIDATE);
        break;
      case "deduplicate":
        handleSelectChange("type", TransformationType.DEDUPLICATE);
        break;
      case "custom":
        handleSelectChange("type", TransformationType.CUSTOM);
        break;
    }
  };
  
  /**
   * Handle delete button click
   */
  const handleDeleteClick = (id: number) => {
    setDeletingTransformationId(id);
    setIsDeleteDialogOpen(true);
  };
  
  /**
   * Handle delete confirmation
   */
  const handleDeleteConfirm = () => {
    if (deletingTransformationId !== null) {
      onDeleteTransformation(deletingTransformationId);
      toast({
        title: "Transformation Deleted",
        description: "The transformation has been deleted successfully."
      });
      setIsDeleteDialogOpen(false);
      setDeletingTransformationId(null);
    }
  };
  
  /**
   * Move transformation up in order
   */
  const moveTransformationUp = (index: number) => {
    if (index === 0) return;
    
    const newTransformations = [...sortedTransformations];
    
    // Swap order values
    const tempOrder = newTransformations[index - 1].order;
    newTransformations[index - 1].order = newTransformations[index].order;
    newTransformations[index].order = tempOrder;
    
    // Swap positions in array
    [newTransformations[index - 1], newTransformations[index]] = 
      [newTransformations[index], newTransformations[index - 1]];
    
    setSortedTransformations(newTransformations);
    onReorderTransformations(newTransformations);
  };
  
  /**
   * Move transformation down in order
   */
  const moveTransformationDown = (index: number) => {
    if (index === sortedTransformations.length - 1) return;
    
    const newTransformations = [...sortedTransformations];
    
    // Swap order values
    const tempOrder = newTransformations[index + 1].order;
    newTransformations[index + 1].order = newTransformations[index].order;
    newTransformations[index].order = tempOrder;
    
    // Swap positions in array
    [newTransformations[index + 1], newTransformations[index]] = 
      [newTransformations[index], newTransformations[index + 1]];
    
    setSortedTransformations(newTransformations);
    onReorderTransformations(newTransformations);
  };
  
  /**
   * Duplicate a transformation
   */
  const duplicateTransformation = (transformation: TransformationRule) => {
    const maxOrder = transformations.reduce((max, t) => Math.max(max, t.order), -1) + 1;
    
    const newTransformation: TransformationRule = {
      ...transformation,
      id: Date.now(),
      name: `${transformation.name} (Copy)`,
      order: maxOrder
    };
    
    onAddTransformation(newTransformation);
    
    toast({
      title: "Transformation Duplicated",
      description: `Transformation "${transformation.name}" has been duplicated.`
    });
  };
  
  /**
   * Get icon for transformation type
   */
  const getTransformationIcon = (type: TransformationType) => {
    switch (type) {
      case TransformationType.FILTER:
        return <Filter className="w-4 h-4" />;
      case TransformationType.MAP:
        return <Map className="w-4 h-4" />;
      case TransformationType.AGGREGATE:
        return <BarChart3 className="w-4 h-4" />;
      case TransformationType.JOIN:
        return <GitMerge className="w-4 h-4" />;
      case TransformationType.SORT:
        return <ArrowDownUp className="w-4 h-4" />;
      case TransformationType.GROUP:
        return <Group className="w-4 h-4" />;
      case TransformationType.VALIDATE:
        return <CheckSquare className="w-4 h-4" />;
      case TransformationType.DEDUPLICATE:
        return <Fingerprint className="w-4 h-4" />;
      case TransformationType.CUSTOM:
        return <Code className="w-4 h-4" />;
      default:
        return <Filter className="w-4 h-4" />;
    }
  };
  
  /**
   * Render the dialog content
   */
  const renderDialogContent = () => {
    return (
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingTransformation ? "Edit Transformation" : "Add Transformation"}</DialogTitle>
          <DialogDescription>
            Configure a data transformation rule
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={formValues.name}
                onChange={handleInputChange}
                placeholder="Transformation Name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formValues.type}
                onValueChange={(value) => handleSelectChange("type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TransformationType.FILTER}>Filter</SelectItem>
                  <SelectItem value={TransformationType.MAP}>Map</SelectItem>
                  <SelectItem value={TransformationType.AGGREGATE}>Aggregate</SelectItem>
                  <SelectItem value={TransformationType.JOIN}>Join</SelectItem>
                  <SelectItem value={TransformationType.SORT}>Sort</SelectItem>
                  <SelectItem value={TransformationType.GROUP}>Group</SelectItem>
                  <SelectItem value={TransformationType.VALIDATE}>Validate</SelectItem>
                  <SelectItem value={TransformationType.DEDUPLICATE}>Deduplicate</SelectItem>
                  <SelectItem value={TransformationType.CUSTOM}>Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                value={formValues.description}
                onChange={handleInputChange}
                placeholder="Description (optional)"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="order">Order</Label>
              <Input
                id="order"
                name="order"
                type="number"
                value={formValues.order}
                onChange={handleInputChange}
                placeholder="0"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="enabled"
              checked={formValues.enabled}
              onCheckedChange={(checked) => handleCheckboxChange("enabled", !!checked)}
            />
            <Label htmlFor="enabled">Enabled</Label>
          </div>
          
          <div className="mt-4">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-9">
                <TabsTrigger value="filter">Filter</TabsTrigger>
                <TabsTrigger value="map">Map</TabsTrigger>
                <TabsTrigger value="aggregate">Aggregate</TabsTrigger>
                <TabsTrigger value="join">Join</TabsTrigger>
                <TabsTrigger value="sort">Sort</TabsTrigger>
                <TabsTrigger value="group">Group</TabsTrigger>
                <TabsTrigger value="validate">Validate</TabsTrigger>
                <TabsTrigger value="deduplicate">Deduplicate</TabsTrigger>
                <TabsTrigger value="custom">Custom</TabsTrigger>
              </TabsList>
              
              {/* Filter Tab */}
              <TabsContent value="filter" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="filterConditions">Filter Conditions</Label>
                  <textarea
                    id="filterConditions"
                    name="filterConditions"
                    value={formValues.filterConditions}
                    onChange={handleInputChange}
                    className="w-full h-64 p-2 rounded-md border font-mono text-sm"
                  />
                  <p className="text-sm text-gray-500">
                    Define conditions to filter data. Each condition should have a field, operator, and value.
                  </p>
                </div>
              </TabsContent>
              
              {/* Map Tab */}
              <TabsContent value="map" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mapConfig">Mapping Configuration</Label>
                  <textarea
                    id="mapConfig"
                    name="mapConfig"
                    value={formValues.mapConfig}
                    onChange={handleInputChange}
                    className="w-full h-64 p-2 rounded-md border font-mono text-sm"
                  />
                  <p className="text-sm text-gray-500">
                    Define mappings from source fields to target fields. You can include transformations and default values.
                  </p>
                </div>
              </TabsContent>
              
              {/* Aggregate Tab */}
              <TabsContent value="aggregate" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="aggregateConfig">Aggregation Configuration</Label>
                  <textarea
                    id="aggregateConfig"
                    name="aggregateConfig"
                    value={formValues.aggregateConfig}
                    onChange={handleInputChange}
                    className="w-full h-64 p-2 rounded-md border font-mono text-sm"
                  />
                  <p className="text-sm text-gray-500">
                    Define aggregations like sum, average, count, etc. for specific fields.
                  </p>
                </div>
              </TabsContent>
              
              {/* Join Tab */}
              <TabsContent value="join" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="joinConfig">Join Configuration</Label>
                  <textarea
                    id="joinConfig"
                    name="joinConfig"
                    value={formValues.joinConfig}
                    onChange={handleInputChange}
                    className="w-full h-64 p-2 rounded-md border font-mono text-sm"
                  />
                  <p className="text-sm text-gray-500">
                    Define a join between data from different sources. Specify the right source, keys, and join type.
                  </p>
                </div>
              </TabsContent>
              
              {/* Sort Tab */}
              <TabsContent value="sort" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sortConfig">Sort Configuration</Label>
                  <textarea
                    id="sortConfig"
                    name="sortConfig"
                    value={formValues.sortConfig}
                    onChange={handleInputChange}
                    className="w-full h-64 p-2 rounded-md border font-mono text-sm"
                  />
                  <p className="text-sm text-gray-500">
                    Define sorting criteria with fields and direction (asc/desc).
                  </p>
                </div>
              </TabsContent>
              
              {/* Group Tab */}
              <TabsContent value="group" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="groupConfig">Group Configuration</Label>
                  <textarea
                    id="groupConfig"
                    name="groupConfig"
                    value={formValues.groupConfig}
                    onChange={handleInputChange}
                    className="w-full h-64 p-2 rounded-md border font-mono text-sm"
                  />
                  <p className="text-sm text-gray-500">
                    Define grouping fields and aggregations to perform on each group.
                  </p>
                </div>
              </TabsContent>
              
              {/* Validate Tab */}
              <TabsContent value="validate" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="validateConfig">Validation Configuration</Label>
                  <textarea
                    id="validateConfig"
                    name="validateConfig"
                    value={formValues.validateConfig}
                    onChange={handleInputChange}
                    className="w-full h-64 p-2 rounded-md border font-mono text-sm"
                  />
                  <p className="text-sm text-gray-500">
                    Define validation rules for data fields. Invalid records can be filtered out or flagged.
                  </p>
                </div>
              </TabsContent>
              
              {/* Deduplicate Tab */}
              <TabsContent value="deduplicate" className="mt-4 space-y-4">
                <div className="p-4 rounded-md bg-gray-100">
                  <p className="text-sm text-gray-700">
                    Deduplicate transformation removes duplicate records based on all fields or a subset of fields.
                    Currently, this transformation uses simple settings that will be configured automatically.
                  </p>
                </div>
              </TabsContent>
              
              {/* Custom Tab */}
              <TabsContent value="custom" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customConfig">Custom Function</Label>
                  <textarea
                    id="customConfig"
                    name="customConfig"
                    value={formValues.customConfig}
                    onChange={handleInputChange}
                    className="w-full h-64 p-2 rounded-md border font-mono text-sm"
                  />
                  <p className="text-sm text-gray-500">
                    Define a custom function to transform the data. The function should take a data array as input and return the transformed data.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {editingTransformation ? "Update" : "Add"} Transformation
          </Button>
        </DialogFooter>
      </DialogContent>
    );
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Transformations</CardTitle>
          <CardDescription>Manage data transformation rules for ETL operations</CardDescription>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Transformation
        </Button>
      </CardHeader>
      <CardContent>
        {transformations.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-gray-500">No transformations added yet. Click "Add Transformation" to create one.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTransformations.map((transformation, index) => (
                <TableRow key={transformation.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <span className="mr-2">{transformation.order}</span>
                      <div className="flex flex-col">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => moveTransformationUp(index)}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => moveTransformationDown(index)}
                          disabled={index === sortedTransformations.length - 1}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{transformation.name}</div>
                    {transformation.description && (
                      <div className="text-sm text-gray-500">{transformation.description}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className="flex items-center space-x-1">
                      {getTransformationIcon(transformation.type)}
                      <span>{transformation.type}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {transformation.enabled ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Enabled
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                        Disabled
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingTransformation(transformation);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => duplicateTransformation(transformation)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(transformation.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      
      {isDialogOpen && renderDialogContent()}
      
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Transformation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this transformation? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default TransformationManager;