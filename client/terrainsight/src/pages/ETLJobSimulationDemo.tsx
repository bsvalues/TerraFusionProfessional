import React, { useState } from "react";
import { motion } from "framer-motion";
import { ETLJobSimulation } from "../components/etl/ETLJobSimulation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { AlertCircle, Info, CheckCircle } from "lucide-react";

const ETLJobSimulationDemo = () => {
  // Demo state
  const [selectedScenario, setSelectedScenario] = useState<"success" | "partial_success" | "failure">("success");
  const [lastJobResult, setLastJobResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>("scenarios");
  
  // Set of job scenarios
  const scenarios = [
    {
      id: "success",
      name: "Successful ETL Job",
      description: "Simulates a complete ETL job that runs successfully from start to finish"
    },
    {
      id: "partial_success",
      name: "Partial Success",
      description: "Simulates a job that completes but encounters some errors during processing"
    },
    {
      id: "failure",
      name: "Job Failure",
      description: "Simulates a job that fails during execution due to a critical error"
    }
  ];
  
  // Handle job completion
  const handleJobComplete = (success: boolean, metrics: any) => {
    console.log(`Job completed. Success: ${success}`, metrics);
    setLastJobResult({
      success,
      metrics,
      timestamp: new Date()
    });
  };
  
  return (
    <div className="container py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold mb-2">ETL Job Simulation</h1>
        <p className="text-gray-500 mb-8">Interactive ETL job visualization with realtime progress tracking</p>
        
        <div className="grid grid-cols-1 gap-8">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>About this component</AlertTitle>
            <AlertDescription>
              The ETL Job Simulation component demonstrates how our animation components can be 
              integrated into a real-world ETL job execution flow, providing users with clear 
              visual feedback about the process steps, status, and metrics.
            </AlertDescription>
          </Alert>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Scenarios Panel */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Job Scenarios</CardTitle>
                <CardDescription>Select a scenario to simulate</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {scenarios.map(scenario => (
                  <div 
                    key={scenario.id} 
                    className={`p-4 rounded-md border cursor-pointer transition-colors
                      ${selectedScenario === scenario.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}`}
                    onClick={() => setSelectedScenario(scenario.id as any)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="font-medium">{scenario.name}</div>
                      
                      {selectedScenario === scenario.id && (
                        <CheckCircle className="text-blue-500 w-4 h-4" />
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">{scenario.description}</div>
                  </div>
                ))}
                
                <Separator className="my-2" />
                
                <Select
                  value={selectedScenario}
                  onValueChange={(value: "success" | "partial_success" | "failure") => setSelectedScenario(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select scenario" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="success">Successful ETL Job</SelectItem>
                    <SelectItem value="partial_success">Partial Success</SelectItem>
                    <SelectItem value="failure">Job Failure</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            
            {/* Job Simulation Panel */}
            <div className="lg:col-span-2">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="scenarios">Single Job</TabsTrigger>
                  <TabsTrigger value="pipeline">Job Pipeline</TabsTrigger>
                </TabsList>
                
                <TabsContent value="scenarios" className="mt-4">
                  <ETLJobSimulation
                    jobName={scenarios.find(s => s.id === selectedScenario)?.name || "ETL Job"}
                    presetScenario={selectedScenario}
                    showJobMetrics={true}
                    onComplete={handleJobComplete}
                  />
                </TabsContent>
                
                <TabsContent value="pipeline" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>ETL Pipeline</CardTitle>
                      <CardDescription>Multiple jobs in a sequential pipeline</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Not implemented</AlertTitle>
                        <AlertDescription>
                          The pipeline demo is not yet implemented. Please use the single job simulation.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="p-12 flex justify-center items-center border rounded-md bg-gray-50">
                        <div className="text-center text-gray-500">
                          <div className="text-xl mb-2">Coming Soon</div>
                          <p>Pipeline execution visualization will be implemented in a future update</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
              
              {/* Last Job Results */}
              {lastJobResult && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-2">Last Job Result</h3>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <span className="text-sm text-gray-500 mr-2">Status:</span>
                          {lastJobResult.success ? (
                            <Badge className="bg-green-100 text-green-800">Success</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">Failed</Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(lastJobResult.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mb-2">
                        <div>
                          <div className="text-sm text-gray-500">Records</div>
                          <div className="font-medium">{lastJobResult.metrics.recordsTotal}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Processed</div>
                          <div className="font-medium">{lastJobResult.metrics.recordsProcessed}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Duration</div>
                          <div className="font-medium">{(lastJobResult.metrics.totalTimeMs / 1000).toFixed(2)}s</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm text-gray-500">Success</div>
                          <div className="font-medium text-green-600">{lastJobResult.metrics.recordsSuccess}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Errors</div>
                          <div className="font-medium text-red-600">{lastJobResult.metrics.recordsError}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Skipped</div>
                          <div className="font-medium text-amber-600">{lastJobResult.metrics.recordsSkipped}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ETLJobSimulationDemo;