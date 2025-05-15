import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AlertCircle, Calculator, Dices, HardHat, Home, LineChart, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

// Define the valuation form schema
const propertyValuationSchema = z.object({
  parcelId: z.string().min(1, "Parcel ID is required"),
  address: z.string().min(1, "Address is required"),
  owner: z.string().min(1, "Owner is required"),
  squareFeet: z.coerce.number().min(1, "Square feet must be a positive number"),
  yearBuilt: z.coerce.number().optional(),
  bedrooms: z.coerce.number().optional(),
  bathrooms: z.coerce.number().optional(),
  lotSize: z.coerce.number().optional(),
  propertyType: z.string().min(1, "Property type is required"),
  neighborhood: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  valuationMethod: z.enum(["market_comparison", "cost_approach", "income_approach", "mass_appraisal", "hybrid"]),
  
  // Income approach specific fields
  incomeData: z.object({
    potentialGrossIncome: z.coerce.number().optional(),
    vacancyRate: z.coerce.number().min(0).max(100).optional(),
    operatingExpenses: z.coerce.number().optional(),
    capRate: z.coerce.number().min(0.01).max(30).optional(),
  }).optional(),
  
  // Cost approach specific fields
  costData: z.object({
    replacementCost: z.coerce.number().optional(),
    depreciation: z.coerce.number().min(0).max(100).optional(),
  }).optional(),
});

type PropertyValuationFormValues = z.infer<typeof propertyValuationSchema>;

const defaultValues: Partial<PropertyValuationFormValues> = {
  parcelId: "",
  address: "",
  owner: "",
  squareFeet: 0,
  yearBuilt: undefined,
  bedrooms: undefined,
  bathrooms: undefined,
  lotSize: undefined,
  propertyType: "",
  neighborhood: "",
  latitude: "",
  longitude: "",
  valuationMethod: "market_comparison",
  incomeData: {
    potentialGrossIncome: undefined,
    vacancyRate: undefined,
    operatingExpenses: undefined,
    capRate: undefined,
  },
  costData: {
    replacementCost: undefined,
    depreciation: undefined,
  },
};

export const PropertyValuationTool = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [valuationResult, setValuationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<PropertyValuationFormValues>({
    resolver: zodResolver(propertyValuationSchema),
    defaultValues,
  });

  // Watch the valuation method to conditionally show fields
  const valuationMethod = form.watch("valuationMethod");

  const onSubmit = async (data: PropertyValuationFormValues) => {
    setIsSubmitting(true);
    setError(null);
    setValuationResult(null);

    try {
      // Prepare the property data
      const propertyData = {
        parcelId: data.parcelId,
        address: data.address,
        owner: data.owner,
        squareFeet: data.squareFeet,
        yearBuilt: data.yearBuilt || null,
        bedrooms: data.bedrooms || null,
        bathrooms: data.bathrooms || null,
        lotSize: data.lotSize || null,
        propertyType: data.propertyType,
        neighborhood: data.neighborhood || null,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
      };

      // Call the agent API
      const response = await fetch('/api/agents/valuation-agent/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: {
            property: propertyData,
            method: data.valuationMethod,
            incomeData: data.valuationMethod === 'income_approach' ? data.incomeData : undefined,
            costData: data.valuationMethod === 'cost_approach' ? data.costData : undefined,
          },
          context: {
            parameters: {
              includeFactors: true,
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const result = await response.json();
      setValuationResult(result);
    } catch (err) {
      console.error('Error valuing property:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="flex flex-col space-y-6 p-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Property Valuation Tool</CardTitle>
          <CardDescription>
            Generate property valuations using Washington State approved methodologies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs defaultValue="property" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="property">Property Details</TabsTrigger>
                  <TabsTrigger value="valuation">Valuation Method</TabsTrigger>
                  <TabsTrigger value="methodology">Method Details</TabsTrigger>
                </TabsList>
                
                {/* Property Details Tab */}
                <TabsContent value="property" className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="parcelId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Parcel ID*</FormLabel>
                          <FormControl>
                            <Input placeholder="12-34567-000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address*</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Main St, Kennewick, WA 99336" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="owner"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Owner*</FormLabel>
                          <FormControl>
                            <Input placeholder="Property owner name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="propertyType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Property Type*</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select property type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Residential">Residential</SelectItem>
                              <SelectItem value="Commercial">Commercial</SelectItem>
                              <SelectItem value="Industrial">Industrial</SelectItem>
                              <SelectItem value="Agricultural">Agricultural</SelectItem>
                              <SelectItem value="Vacant Land">Vacant Land</SelectItem>
                              <SelectItem value="Multi-Family">Multi-Family</SelectItem>
                              <SelectItem value="Mixed Use">Mixed Use</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="squareFeet"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Square Feet*</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="2500" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="yearBuilt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Year Built</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="1985" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="neighborhood"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Neighborhood</FormLabel>
                          <FormControl>
                            <Input placeholder="West Kennewick" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bedrooms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bedrooms</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="3" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bathrooms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bathrooms</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="2.5" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lotSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lot Size (acres)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0.25" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="latitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Latitude</FormLabel>
                            <FormControl>
                              <Input placeholder="46.2087" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="longitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Longitude</FormLabel>
                            <FormControl>
                              <Input placeholder="-119.1372" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </TabsContent>
                
                {/* Valuation Method Tab */}
                <TabsContent value="valuation" className="space-y-4 pt-4">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="valuationMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valuation Method*</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select valuation method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="market_comparison">
                                <div className="flex items-center gap-2">
                                  <Home className="h-4 w-4" />
                                  <span>Market Comparison</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="cost_approach">
                                <div className="flex items-center gap-2">
                                  <HardHat className="h-4 w-4" />
                                  <span>Cost Approach</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="income_approach">
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-4 w-4" />
                                  <span>Income Approach</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="mass_appraisal">
                                <div className="flex items-center gap-2">
                                  <Calculator className="h-4 w-4" />
                                  <span>Mass Appraisal</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="hybrid">
                                <div className="flex items-center gap-2">
                                  <Dices className="h-4 w-4" />
                                  <span>Hybrid Method</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select the appropriate valuation methodology according to Washington State Department of Revenue guidelines.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Method descriptions */}
                    <Card className="bg-muted/50">
                      <CardContent className="p-4">
                        {valuationMethod === 'market_comparison' && (
                          <div>
                            <h3 className="font-semibold flex items-center gap-2">
                              <Home className="h-4 w-4" />
                              Market Comparison Approach
                            </h3>
                            <p className="text-sm mt-2">
                              Compares the subject property to similar properties that have recently sold in the same area.
                              This approach is most reliable for residential properties and properties in areas with active sales markets.
                            </p>
                          </div>
                        )}
                        {valuationMethod === 'cost_approach' && (
                          <div>
                            <h3 className="font-semibold flex items-center gap-2">
                              <HardHat className="h-4 w-4" />
                              Cost Approach
                            </h3>
                            <p className="text-sm mt-2">
                              Estimates value by calculating the cost to replace the structure, minus depreciation,
                              plus the value of the land. This approach is useful for newer buildings and special-purpose properties.
                            </p>
                          </div>
                        )}
                        {valuationMethod === 'income_approach' && (
                          <div>
                            <h3 className="font-semibold flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              Income Approach
                            </h3>
                            <p className="text-sm mt-2">
                              Estimates value based on the income the property generates. This approach is mainly used
                              for commercial, industrial, and multi-family residential properties.
                            </p>
                          </div>
                        )}
                        {valuationMethod === 'mass_appraisal' && (
                          <div>
                            <h3 className="font-semibold flex items-center gap-2">
                              <Calculator className="h-4 w-4" />
                              Mass Appraisal
                            </h3>
                            <p className="text-sm mt-2">
                              Uses statistical models to value many properties simultaneously.
                              This approach is commonly used by assessors for tax assessment purposes.
                            </p>
                          </div>
                        )}
                        {valuationMethod === 'hybrid' && (
                          <div>
                            <h3 className="font-semibold flex items-center gap-2">
                              <Dices className="h-4 w-4" />
                              Hybrid Method
                            </h3>
                            <p className="text-sm mt-2">
                              Combines multiple approaches to determine a weighted average value.
                              This approach is used for complex properties where a single method may not be sufficient.
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                {/* Method Details Tab */}
                <TabsContent value="methodology" className="space-y-4 pt-4">
                  {valuationMethod === 'income_approach' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Income Approach Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="incomeData.potentialGrossIncome"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Potential Gross Income (Annual)</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="120000" {...field} />
                              </FormControl>
                              <FormDescription>
                                Total potential annual income (before vacancies)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="incomeData.vacancyRate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Vacancy Rate (%)</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="5" {...field} />
                              </FormControl>
                              <FormDescription>
                                Expected vacancy percentage
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="incomeData.operatingExpenses"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Operating Expenses (Annual)</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="40000" {...field} />
                              </FormControl>
                              <FormDescription>
                                Total annual operating expenses
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="incomeData.capRate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Capitalization Rate (%)</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="5.5" step="0.1" {...field} />
                              </FormControl>
                              <FormDescription>
                                Cap rate for the property type and location
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}
                  
                  {valuationMethod === 'cost_approach' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Cost Approach Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="costData.replacementCost"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Replacement Cost (Total)</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="350000" {...field} />
                              </FormControl>
                              <FormDescription>
                                Cost to construct a similar building today
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="costData.depreciation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Depreciation (%)</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="20" {...field} />
                              </FormControl>
                              <FormDescription>
                                Total depreciation percentage (physical, functional, economic)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}
                  
                  {(valuationMethod === 'market_comparison' || valuationMethod === 'mass_appraisal' || valuationMethod === 'hybrid') && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">
                        {valuationMethod === 'market_comparison' ? 'Market Comparison' : 
                         valuationMethod === 'mass_appraisal' ? 'Mass Appraisal' : 'Hybrid Method'} Details
                      </h3>
                      <p className="text-sm">
                        No additional parameters are required. Our AI Valuation Agent will automatically analyze comparable properties
                        and market data to generate an accurate valuation using the {
                          valuationMethod === 'market_comparison' ? 'Market Comparison' : 
                          valuationMethod === 'mass_appraisal' ? 'Mass Appraisal' : 'Hybrid'
                        } approach.
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
              
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Calculating Value..." : "Generate Property Valuation"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {valuationResult && valuationResult.status === "success" && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-xl">
              Valuation Results
              <Badge variant="outline" className="ml-2 bg-primary text-primary-foreground">
                {valuationResult.data.method === 'market_comparison' ? 'Market Comparison Approach' :
                 valuationResult.data.method === 'cost_approach' ? 'Cost Approach' :
                 valuationResult.data.method === 'income_approach' ? 'Income Approach' :
                 valuationResult.data.method === 'mass_appraisal' ? 'Mass Appraisal' : 'Hybrid Method'}
              </Badge>
            </CardTitle>
            <CardDescription>
              Property: {valuationResult.data.property.address} (Parcel ID: {valuationResult.data.property.parcelId})
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Estimated Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">
                    {formatCurrency(valuationResult.data.estimatedValue)}
                  </p>
                  {valuationResult.data.valueRange && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Range: {formatCurrency(valuationResult.data.valueRange.low)} - {formatCurrency(valuationResult.data.valueRange.high)}
                    </p>
                  )}
                </CardContent>
              </Card>
              
              <Card className="bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Confidence Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-2">
                    <p className="text-3xl font-bold">
                      {valuationResult.data.confidenceScore}%
                    </p>
                    <Badge variant={
                      valuationResult.data.confidenceScore >= 90 ? "default" :
                      valuationResult.data.confidenceScore >= 70 ? "default" :
                      "destructive"
                    } className={
                      valuationResult.data.confidenceScore >= 90 ? "bg-green-500 hover:bg-green-600" :
                      valuationResult.data.confidenceScore >= 70 ? "bg-amber-500 hover:bg-amber-600" : ""
                    }>
                      {valuationResult.data.confidenceScore >= 90 ? "High" :
                       valuationResult.data.confidenceScore >= 70 ? "Medium" : "Low"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Based on data quality and methodology
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Valuation Date</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-medium">
                    {new Date(valuationResult.data.valuationDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Washington State standard valuation date
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {/* Value Components */}
            {valuationResult.data.valueComponents && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Value Components</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(valuationResult.data.valueComponents).map(([key, value]) => (
                    <div key={key} className="bg-muted p-3 rounded-md">
                      <p className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                      <p className={`text-lg font-semibold ${Number(value) < 0 ? 'text-red-500' : ''}`}>
                        {formatCurrency(Number(value))}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Influence Factors */}
            {valuationResult.data.factors && valuationResult.data.factors.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Valuation Factors</h3>
                <ScrollArea className="h-[200px] rounded-md border p-4">
                  <div className="space-y-3">
                    {valuationResult.data.factors.map((factor: any, index: number) => (
                      <div key={index} className="rounded-lg border p-3">
                        <div className="flex justify-between items-start">
                          <p className="font-medium">{factor.name}</p>
                          <Badge variant={factor.influence > 0 ? "default" : factor.influence < 0 ? "destructive" : "outline"} 
                            className={factor.influence > 0 ? "bg-green-500 hover:bg-green-600" : ""}>
                            {factor.influence > 0 ? '+' : ''}{(factor.influence * 100).toFixed(1)}%
                          </Badge>
                        </div>
                        <p className="text-sm mt-1">{factor.description}</p>
                        <p className="text-xs mt-1 text-muted-foreground">Category: {factor.category}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
            
            {/* Explanation */}
            {valuationResult.data.explanation && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Valuation Explanation</h3>
                <div className="bg-muted p-4 rounded-md">
                  <p className="text-sm whitespace-pre-line">{valuationResult.data.explanation}</p>
                </div>
              </div>
            )}
            
            {/* Recommendations */}
            {valuationResult.recommendations && valuationResult.recommendations.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Recommendations</h3>
                <div className="bg-muted p-4 rounded-md">
                  <ul className="list-disc pl-5 space-y-1">
                    {valuationResult.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="text-sm">{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setValuationResult(null)}>
              Clear Results
            </Button>
            <Button onClick={() => window.print()}>
              Print Valuation Report
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};