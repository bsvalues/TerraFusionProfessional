import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

// Define the validation form schema
const propertyValidationSchema = z.object({
  parcelId: z.string().min(1, "Parcel ID is required"),
  address: z.string().min(1, "Address is required"),
  owner: z.string().optional(),
  squareFeet: z.coerce.number().min(1, "Square feet must be a positive number"),
  yearBuilt: z.coerce.number().optional(),
  bedrooms: z.coerce.number().optional(),
  bathrooms: z.coerce.number().optional(),
  lotSize: z.coerce.number().optional(),
  propertyType: z.string().optional(),
  neighborhood: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  strictValidation: z.boolean().default(false),
});

type PropertyValidationFormValues = z.infer<typeof propertyValidationSchema>;

const defaultValues: Partial<PropertyValidationFormValues> = {
  parcelId: "",
  address: "",
  owner: "",
  squareFeet: 0,
  yearBuilt: undefined,
  bedrooms: undefined,
  bathrooms: undefined,
  lotSize: undefined,
  propertyType: undefined,
  neighborhood: "",
  latitude: "",
  longitude: "",
  strictValidation: false,
};

// Issue severity to tailwind color mapping
const severityColorMap = {
  LOW: "bg-blue-500",
  MEDIUM: "bg-amber-500",
  HIGH: "bg-orange-500",
  CRITICAL: "bg-red-500",
};

export const PropertyValidationTool = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<PropertyValidationFormValues>({
    resolver: zodResolver(propertyValidationSchema),
    defaultValues,
  });

  const onSubmit = async (data: PropertyValidationFormValues) => {
    setIsSubmitting(true);
    setError(null);
    setValidationResult(null);

    try {
      // Prepare the property data
      const propertyData = {
        parcelId: data.parcelId,
        address: data.address,
        squareFeet: data.squareFeet,
        owner: data.owner || null,
        yearBuilt: data.yearBuilt || null,
        bedrooms: data.bedrooms || null,
        bathrooms: data.bathrooms || null,
        lotSize: data.lotSize || null,
        propertyType: data.propertyType || null,
        neighborhood: data.neighborhood || null,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
      };

      // Call the agent API
      const response = await fetch('/api/agents/data-validation-agent/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: {
            operation: 'validate_property',
            property: propertyData,
          },
          context: {
            parameters: {
              strict: data.strictValidation,
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const result = await response.json();
      setValidationResult(result);
    } catch (err) {
      console.error('Error validating property:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6 p-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Property Data Validation</CardTitle>
          <CardDescription>
            Validate property data against Washington State standards and Benton County requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                      <FormDescription>
                        Enter Benton County parcel ID format
                      </FormDescription>
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
                      <FormDescription>
                        Property street address and city
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="owner"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Owner</FormLabel>
                      <FormControl>
                        <Input placeholder="Property owner name" {...field} />
                      </FormControl>
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
                  name="propertyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Type</FormLabel>
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

                <FormField
                  control={form.control}
                  name="strictValidation"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Strict Validation</FormLabel>
                        <FormDescription>
                          Enable strict validation mode for more thorough checks
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Validating..." : "Validate Property Data"}
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

      {validationResult && validationResult.status === "success" && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Validation Results
              <Badge variant={validationResult.data.isValid ? "default" : "destructive"} className={validationResult.data.isValid ? "bg-green-500 hover:bg-green-600" : ""}>
                {validationResult.data.isValid ? "Valid" : "Issues Found"}
              </Badge>
            </CardTitle>
            <CardDescription>
              Data quality score: {validationResult.data.score}/100
            </CardDescription>
            <Progress value={validationResult.data.score} className="w-full h-2" />
          </CardHeader>
          <CardContent>
            {validationResult.data.issues && validationResult.data.issues.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Validation Issues</h3>
                <ScrollArea className="h-[300px] rounded-md border p-4">
                  <div className="space-y-4">
                    {validationResult.data.issues.map((issue: any, index: number) => (
                      <div key={index} className="rounded-lg border p-4">
                        <div className="flex justify-between items-start">
                          <p className="font-medium">Field: {issue.field}</p>
                          <Badge className={severityColorMap[issue.severity] || "bg-gray-500"}>
                            {issue.severity}
                          </Badge>
                        </div>
                        <p className="text-sm mt-1">{issue.description}</p>
                        {issue.remediation && (
                          <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded">
                            <p className="text-sm">
                              <span className="font-medium">Recommendation:</span> {issue.remediation}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {validationResult.data.recommendations && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Recommendations</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {validationResult.data.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="text-sm">{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button variant="outline" onClick={() => setValidationResult(null)}>
              Clear Results
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};