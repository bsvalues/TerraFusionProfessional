import React, { useState } from 'react';
import { RegressionModelConfig } from '@/services/regressionService';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tooltip } from '@/components/ui/custom-tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Loader2, Info, Plus, Trash2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ModelVariable } from './VariableSelector';

// Enums
export enum KernelType {
  Gaussian = 'gaussian',
  Bisquare = 'bisquare',
  Tricube = 'tricube',
  Exponential = 'exponential'
}

export enum TransformType {
  None = 'none',
  Log = 'log',
  Sqrt = 'sqrt',
  Square = 'square',
  Inverse = 'inverse'
}

// Schema for model configuration
const modelConfigSchema = z.object({
  includeIntercept: z.boolean().default(true),
  regressionType: z.enum(['OLS', 'WLS', 'GWR']).default('OLS'),
  targetTransform: z.enum(['none', 'log', 'sqrt', 'square', 'inverse']).default('none'),
  spatialWeight: z.object({
    type: z.enum(['fixed', 'adaptive']).default('fixed'),
    bandwidth: z.number().min(0.01).max(100).default(10),
    distanceDecay: z.number().min(0.1).max(10).default(2)
  }).optional(),
  weightVariable: z.string().optional(),
  interactions: z.array(
    z.object({
      var1: z.string(),
      var2: z.string()
    })
  ).default([]),
  polynomials: z.array(
    z.object({
      variable: z.string(),
      degree: z.number().int().min(2).max(3).default(2)
    })
  ).default([]),
  variableTransforms: z.record(z.enum(['none', 'log', 'sqrt', 'square', 'inverse'])).default({})
});

export type ModelConfigFormValues = z.infer<typeof modelConfigSchema>;

export interface ModelConfigurationProps {
  selectedVariables: ModelVariable[];
  targetVariable: string | null;
  config: RegressionModelConfig | null;
  onConfigChange: (config: RegressionModelConfig) => void;
  onRunRegression: () => void;
  isRunning: boolean;
  className?: string;
}

export function ModelConfiguration({
  selectedVariables,
  targetVariable,
  config,
  onConfigChange,
  onRunRegression,
  isRunning,
  className
}: ModelConfigurationProps) {
  const [activeTab, setActiveTab] = useState('basic');
  
  // Initialize form with values from config or defaults
  const form = useForm<ModelConfigFormValues>({
    resolver: zodResolver(modelConfigSchema),
    defaultValues: config ? {
      includeIntercept: config.includeIntercept ?? true,
      regressionType: config.regressionType,
      targetTransform: (config.dataTransforms && targetVariable ? 
        config.dataTransforms[targetVariable] : 'none') as TransformType,
      spatialWeight: config.spatialWeight,
      weightVariable: config.weightVariable,
      interactions: config.interactionTerms?.map(([var1, var2]) => ({ var1, var2 })) || [],
      polynomials: config.polynomialTerms?.map(([variable, degree]) => ({ variable, degree })) || [],
      variableTransforms: config.dataTransforms || {}
    } : {
      includeIntercept: true,
      regressionType: 'OLS',
      targetTransform: 'none',
      interactions: [],
      polynomials: [],
      variableTransforms: {}
    }
  });
  
  // Independent variables (excluding target and weight)
  const independentVariables = selectedVariables.filter(
    v => v.selected && v.type === 'independent'
  );
  
  // Weight variables
  const weightVariables = selectedVariables.filter(
    v => v.selected && v.type === 'weight'
  );
  
  // Watch for changes in regression type
  const regressionType = form.watch('regressionType');
  
  // Handle form submission
  const onSubmit = (data: ModelConfigFormValues) => {
    if (!targetVariable) return;
    
    // Build data transforms
    const dataTransforms: { [key: string]: TransformType } = {
      ...data.variableTransforms
    };
    
    // Add target transformation if specified
    if (data.targetTransform !== 'none') {
      dataTransforms[targetVariable] = data.targetTransform;
    }
    
    // Prepare config
    const newConfig: RegressionModelConfig = {
      targetVariable,
      independentVariables: independentVariables.map(v => v.name),
      interactionTerms: data.interactions.map(i => [i.var1, i.var2] as [string, string]),
      polynomialTerms: data.polynomials.map(p => [p.variable, p.degree] as [string, number]),
      includeIntercept: data.includeIntercept,
      regressionType: data.regressionType,
      dataTransforms: Object.keys(dataTransforms).length > 0 ? dataTransforms : undefined,
      weightVariable: data.weightVariable,
      spatialWeight: data.regressionType === 'GWR' ? data.spatialWeight : undefined
    };
    
    onConfigChange(newConfig);
  };
  
  // Add interaction term
  const addInteraction = () => {
    const currentInteractions = form.getValues('interactions');
    
    if (independentVariables.length < 2) return;
    
    const newInteraction = {
      var1: independentVariables[0].name,
      var2: independentVariables[1].name
    };
    
    form.setValue('interactions', [...currentInteractions, newInteraction]);
  };
  
  // Remove interaction term
  const removeInteraction = (index: number) => {
    const currentInteractions = form.getValues('interactions');
    const newInteractions = [
      ...currentInteractions.slice(0, index),
      ...currentInteractions.slice(index + 1)
    ];
    form.setValue('interactions', newInteractions);
  };
  
  // Add polynomial term
  const addPolynomial = () => {
    const currentPolynomials = form.getValues('polynomials');
    
    if (independentVariables.length === 0) return;
    
    const newPolynomial = {
      variable: independentVariables[0].name,
      degree: 2
    };
    
    form.setValue('polynomials', [...currentPolynomials, newPolynomial]);
  };
  
  // Remove polynomial term
  const removePolynomial = (index: number) => {
    const currentPolynomials = form.getValues('polynomials');
    const newPolynomials = [
      ...currentPolynomials.slice(0, index),
      ...currentPolynomials.slice(index + 1)
    ];
    form.setValue('polynomials', newPolynomials);
  };
  
  // Update variable transform
  const updateVariableTransform = (variableName: string, transform: TransformType) => {
    const currentTransforms = form.getValues('variableTransforms');
    
    if (transform === 'none') {
      // Remove transform if set to none
      const { [variableName]: removed, ...rest } = currentTransforms;
      form.setValue('variableTransforms', rest);
    } else {
      // Add or update transform
      form.setValue('variableTransforms', {
        ...currentTransforms,
        [variableName]: transform
      });
    }
  };
  
  // Find variable display name
  const getVariableDisplayName = (name: string) => {
    const variable = selectedVariables.find(v => v.name === name);
    return variable ? variable.displayName || variable.name : name;
  };
  
  // Helper to get variable transform
  const getVariableTransform = (name: string): TransformType => {
    const transforms = form.getValues('variableTransforms');
    return transforms[name] || 'none';
  };
  
  // Update form when config changes
  React.useEffect(() => {
    if (config) {
      form.reset({
        includeIntercept: config.includeIntercept ?? true,
        regressionType: config.regressionType,
        targetTransform: (config.dataTransforms && targetVariable ? 
          config.dataTransforms[targetVariable] : 'none') as TransformType,
        spatialWeight: config.spatialWeight,
        weightVariable: config.weightVariable,
        interactions: config.interactionTerms?.map(([var1, var2]) => ({ var1, var2 })) || [],
        polynomials: config.polynomialTerms?.map(([variable, degree]) => ({ variable, degree })) || [],
        variableTransforms: config.dataTransforms || {}
      });
    }
  }, [config, targetVariable]);
  
  // Update config when form changes
  React.useEffect(() => {
    const subscription = form.watch(value => {
      onSubmit(value as ModelConfigFormValues);
    });
    return () => subscription.unsubscribe();
  }, [form.watch, selectedVariables, targetVariable]);
  
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Model Configuration</CardTitle>
        <CardDescription>
          Configure regression model settings
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-auto">
        <Form {...form}>
          <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 w-full justify-start">
              <TabsTrigger value="basic">Basics</TabsTrigger>
              <TabsTrigger value="transforms">Transforms</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
              <TabsTrigger value="spatial" disabled={regressionType !== 'GWR'}>
                Spatial
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4 mt-0">
              <FormField
                control={form.control}
                name="regressionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Regression Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select regression type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="OLS">
                          <div className="flex flex-col">
                            <span>Ordinary Least Squares (OLS)</span>
                            <span className="text-xs text-muted-foreground">
                              Standard linear regression
                            </span>
                          </div>
                        </SelectItem>
                        <SelectItem value="WLS">
                          <div className="flex flex-col">
                            <span>Weighted Least Squares (WLS)</span>
                            <span className="text-xs text-muted-foreground">
                              Uses weights for heteroscedasticity
                            </span>
                          </div>
                        </SelectItem>
                        <SelectItem value="GWR">
                          <div className="flex flex-col">
                            <span>Geographically Weighted Regression (GWR)</span>
                            <span className="text-xs text-muted-foreground">
                              Accounts for spatial relationships
                            </span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the regression method to use for analysis
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {regressionType === 'WLS' && (
                <FormField
                  control={form.control}
                  name="weightVariable"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight Variable</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value || ''}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select weight variable" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {weightVariables.length === 0 ? (
                            <SelectItem value="" disabled>
                              No weight variables selected
                            </SelectItem>
                          ) : (
                            weightVariables.map(variable => (
                              <SelectItem key={variable.name} value={variable.name}>
                                {variable.displayName || variable.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select a variable to use as weights in the regression
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={form.control}
                name="includeIntercept"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Include Intercept Term</FormLabel>
                      <FormDescription>
                        Include a constant term in the regression model
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="pt-4">
                <h3 className="text-sm font-medium mb-1">Variables in Model</h3>
                <div className="space-y-1.5">
                  {targetVariable && (
                    <div className="flex items-center justify-between rounded-md border px-3 py-2">
                      <div className="flex items-center">
                        <Badge className="bg-primary mr-2">Target</Badge>
                        <span>{getVariableDisplayName(targetVariable)}</span>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        {form.watch('targetTransform') !== 'none' && (
                          <Badge variant="outline">
                            Transform: {form.watch('targetTransform')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {independentVariables.map(variable => (
                    <div 
                      key={variable.name}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <div className="flex items-center">
                        <Badge className="bg-secondary mr-2">Independent</Badge>
                        <span>{variable.displayName || variable.name}</span>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        {getVariableTransform(variable.name) !== 'none' && (
                          <Badge variant="outline">
                            Transform: {getVariableTransform(variable.name)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {form.watch('interactions').map((interaction, index) => (
                    <div 
                      key={`interaction-${index}`}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <div className="flex items-center">
                        <Badge className="bg-blue-500 mr-2">Interaction</Badge>
                        <span>
                          {getVariableDisplayName(interaction.var1)} × {getVariableDisplayName(interaction.var2)}
                        </span>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeInteraction(index)}
                        className="h-7 w-7"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  {form.watch('polynomials').map((poly, index) => (
                    <div 
                      key={`poly-${index}`}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <div className="flex items-center">
                        <Badge className="bg-amber-500 mr-2">Polynomial</Badge>
                        <span>
                          {getVariableDisplayName(poly.variable)}²
                          {poly.degree > 2 && '²'}
                        </span>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removePolynomial(index)}
                        className="h-7 w-7"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  {form.watch('weightVariable') && (
                    <div className="flex items-center justify-between rounded-md border px-3 py-2">
                      <div className="flex items-center">
                        <Badge className="bg-orange-500 mr-2">Weight</Badge>
                        <span>
                          {getVariableDisplayName(form.watch('weightVariable'))}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="transforms" className="space-y-4 mt-0">
              {targetVariable && (
                <div className="space-y-3 mb-6">
                  <h3 className="text-sm font-medium">Target Variable Transformation</h3>
                  <FormField
                    control={form.control}
                    name="targetTransform"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>{getVariableDisplayName(targetVariable)}</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="No transform" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">No transform</SelectItem>
                              <SelectItem value="log">Log transform</SelectItem>
                              <SelectItem value="sqrt">Square root</SelectItem>
                              <SelectItem value="square">Square</SelectItem>
                              <SelectItem value="inverse">Inverse (1/x)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              )}
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Independent Variable Transformations</h3>
                  <Tooltip
                    content={
                      <p className="max-w-[250px]">
                        Transformations can help linearize relationships.
                        Log transforms are useful for skewed data,
                        square root for count data, and square/inverse
                        for non-linear relationships.
                      </p>
                    }
                  >
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Info className="h-4 w-4" />
                    </Button>
                  </Tooltip>
                </div>
                
                <div className="space-y-2 border rounded-md p-3">
                  {independentVariables.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-2 text-center">
                      No independent variables selected
                    </div>
                  ) : (
                    independentVariables.map(variable => {
                      const transform = getVariableTransform(variable.name);
                      return (
                        <div 
                          key={variable.name} 
                          className="flex items-center justify-between py-1"
                        >
                          <span className="text-sm">
                            {variable.displayName || variable.name}
                          </span>
                          <Select
                            value={transform}
                            onValueChange={(value) => 
                              updateVariableTransform(variable.name, value as TransformType)
                            }
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue placeholder="No transform" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No transform</SelectItem>
                              <SelectItem value="log">Log transform</SelectItem>
                              <SelectItem value="sqrt">Square root</SelectItem>
                              <SelectItem value="square">Square</SelectItem>
                              <SelectItem value="inverse">Inverse (1/x)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="advanced" className="space-y-4 mt-0">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Interaction Terms</h3>
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={addInteraction}
                    disabled={independentVariables.length < 2}
                    className="h-7 px-2"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Interaction
                  </Button>
                </div>
                
                <div className="border rounded-md p-3">
                  {form.watch('interactions').length === 0 ? (
                    <div className="text-sm text-muted-foreground py-2 text-center">
                      No interaction terms added
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {form.watch('interactions').map((interaction, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Select
                            value={interaction.var1}
                            onValueChange={(value) => {
                              const interactions = form.getValues('interactions');
                              interactions[index].var1 = value;
                              form.setValue('interactions', [...interactions]);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {independentVariables.map(variable => (
                                <SelectItem key={variable.name} value={variable.name}>
                                  {variable.displayName || variable.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          
                          <Select
                            value={interaction.var2}
                            onValueChange={(value) => {
                              const interactions = form.getValues('interactions');
                              interactions[index].var2 = value;
                              form.setValue('interactions', [...interactions]);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {independentVariables.map(variable => (
                                <SelectItem key={variable.name} value={variable.name}>
                                  {variable.displayName || variable.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeInteraction(index)}
                            className="h-7 w-7 ml-auto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Polynomial Terms</h3>
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={addPolynomial}
                      disabled={independentVariables.length === 0}
                      className="h-7 px-2"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Add Polynomial
                    </Button>
                  </div>
                  
                  <div className="border rounded-md p-3 mt-3">
                    {form.watch('polynomials').length === 0 ? (
                      <div className="text-sm text-muted-foreground py-2 text-center">
                        No polynomial terms added
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {form.watch('polynomials').map((poly, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Select
                              value={poly.variable}
                              onValueChange={(value) => {
                                const polynomials = form.getValues('polynomials');
                                polynomials[index].variable = value;
                                form.setValue('polynomials', [...polynomials]);
                              }}
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {independentVariables.map(variable => (
                                  <SelectItem key={variable.name} value={variable.name}>
                                    {variable.displayName || variable.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            
                            <div className="w-[100px]">
                              <Select
                                value={poly.degree.toString()}
                                onValueChange={(value) => {
                                  const polynomials = form.getValues('polynomials');
                                  polynomials[index].degree = parseInt(value);
                                  form.setValue('polynomials', [...polynomials]);
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="2">Squared (²)</SelectItem>
                                  <SelectItem value="3">Cubed (³)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removePolynomial(index)}
                              className="h-7 w-7 ml-auto"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="spatial" className="space-y-4 mt-0">
              {regressionType === 'GWR' && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="spatialWeight.type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kernel Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select kernel type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="fixed">Fixed Distance</SelectItem>
                            <SelectItem value="adaptive">Adaptive (Nearest Neighbors)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Method to determine the influence of neighboring properties
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="spatialWeight.bandwidth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Bandwidth - {field.value.toFixed(1)}
                          {form.watch('spatialWeight.type') === 'fixed' ? ' km' : '%'}
                        </FormLabel>
                        <FormControl>
                          <Slider
                            defaultValue={[field.value]}
                            value={[field.value]}
                            onValueChange={([value]) => field.onChange(value)}
                            min={0.1}
                            max={form.watch('spatialWeight.type') === 'fixed' ? 50 : 100}
                            step={0.1}
                          />
                        </FormControl>
                        <FormDescription>
                          {form.watch('spatialWeight.type') === 'fixed'
                            ? 'Distance in kilometers considered for weighting (larger values include more properties)'
                            : 'Percentage of properties to consider for local regression (higher values include more properties)'}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="spatialWeight.distanceDecay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Distance Decay Factor - {field.value.toFixed(1)}</FormLabel>
                        <FormControl>
                          <Slider
                            defaultValue={[field.value]}
                            value={[field.value]}
                            onValueChange={([value]) => field.onChange(value)}
                            min={0.1}
                            max={10}
                            step={0.1}
                          />
                        </FormControl>
                        <FormDescription>
                          Controls how quickly influence decreases with distance (higher values mean sharper decay)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Form>
      </CardContent>
      
      <div className="mt-auto p-4 border-t flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {independentVariables.length} independent variables
          {form.watch('interactions').length > 0 && `, ${form.watch('interactions').length} interactions`}
          {form.watch('polynomials').length > 0 && `, ${form.watch('polynomials').length} polynomials`}
        </div>
        
        <Button 
          onClick={onRunRegression}
          disabled={
            isRunning || 
            !targetVariable || 
            independentVariables.length === 0 ||
            (regressionType === 'WLS' && !form.watch('weightVariable'))
          }
        >
          {isRunning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isRunning ? 'Running...' : 'Run Regression'}
        </Button>
      </div>
    </Card>
  );
}