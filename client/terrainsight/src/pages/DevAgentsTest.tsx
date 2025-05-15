import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { apiRequest } from '@/lib/queryClient';

interface ApiResponse {
  status: string;
  data: {
    generatedCode?: string;
    testSuite?: string;
    analysis?: any;
    issues?: any[];
  };
  explanation?: string;
  message?: string;
}

/**
 * Development Agents Test Page
 * 
 * This page allows testing the functionality of our development agents:
 * - GodTierBuilderAgent for code generation
 * - TDDValidatorAgent for code verification and test generation
 */
const DevAgentsTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [activeOperation, setActiveOperation] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});
  const [codeToVerify, setCodeToVerify] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [complexity, setComplexity] = useState<'simple' | 'moderate' | 'complex'>('moderate');
  const [diagnostics, setDiagnostics] = useState<any>(null);

  // Fetch agent system diagnostics
  const fetchDiagnostics = async () => {
    setStatusMessage('Fetching agent system diagnostics...');
    setLoading(true);
    setActiveOperation('diagnostics');
    
    try {
      const response = await apiRequest<any>(
        'GET',
        '/api/agents/diagnostics'
      );
      
      setDiagnostics(response);
      setStatusMessage('Diagnostics fetched successfully');
    } catch (error) {
      console.error('Error fetching diagnostics:', error);
      setStatusMessage('Error fetching diagnostics: ' + String(error));
    } finally {
      setLoading(false);
      setActiveOperation(null);
    }
  };

  // Test the code generation capabilities of the GodTierBuilderAgent
  const testCodeGeneration = async () => {
    setLoading(true);
    setActiveOperation('codeGeneration');
    setStatusMessage('Initializing GodTierBuilderAgent...');
    
    try {
      setStatusMessage('Sending request to GodTierBuilderAgent...');
      
      const payload = {
        input: {
          operation: 'generate_code',
          data: {
            designSpec: {
              type: 'feature',
              name: 'Property Comparison Tool',
              description: 'A utility function that compares two property objects and returns the differences.',
              complexity: complexity,
              requirements: [
                'Compare all fields between two property objects',
                'Return an object showing which fields changed',
                'Include the old and new values for each changed field',
                'Handle nested objects within the property data'
              ]
            },
            codebaseContext: {
              language: 'typescript',
              existingCode: `
                // Example property object structure
                interface Property {
                  id: string;
                  address: {
                    street: string;
                    city: string;
                    state: string;
                    zip: string;
                  };
                  valuation: {
                    assessed: number;
                    market: number;
                  };
                  zoning: string;
                  lastUpdated: string;
                }
              `
            }
          }
        },
        context: {
          parameters: {},
          accessLevel: 'user',
          userId: 'web-user',
          correlationId: 'web-test-' + Date.now()
        }
      };
      
      setStatusMessage('AI agent is generating code...');
      const response = await apiRequest<ApiResponse>(
        'POST',
        '/api/agents/god-tier-builder/execute',
        payload
      );

      setStatusMessage('Code generation complete!');
      setResults((prev) => ({ ...prev, codeGeneration: response }));
      
      if (response?.data?.generatedCode) {
        setCodeToVerify(response.data.generatedCode);
      }
    } catch (error) {
      console.error('Error testing code generation:', error);
      setStatusMessage('Error during code generation: ' + String(error));
      setResults((prev) => ({ ...prev, codeGeneration: { status: 'error', data: null, explanation: String(error) } }));
    } finally {
      setLoading(false);
      setActiveOperation(null);
    }
  };

  // Test the code verification capabilities of the TDDValidatorAgent
  const testCodeVerification = async () => {
    if (!codeToVerify) {
      alert('Please generate code first');
      return;
    }

    setLoading(true);
    setActiveOperation('codeVerification');
    setStatusMessage('Initializing TDDValidatorAgent for code verification...');
    
    try {
      setStatusMessage('Sending code to TDDValidatorAgent for verification...');
      
      const payload = {
        input: {
          operation: 'verify_code',
          data: {
            code: codeToVerify,
            requirements: [
              'Compare all fields between two property objects',
              'Return an object showing which fields changed',
              'Include the old and new values for each changed field',
              'Handle nested objects within the property data'
            ],
            testingFramework: 'jest'
          }
        },
        context: {
          parameters: {},
          accessLevel: 'user',
          userId: 'web-user',
          correlationId: 'web-test-' + Date.now()
        }
      };
      
      setStatusMessage('AI agent is verifying code...');
      const response = await apiRequest<ApiResponse>(
        'POST',
        '/api/agents/tdd-validator/execute',
        payload
      );

      setStatusMessage('Code verification complete!');
      setResults((prev) => ({ ...prev, codeVerification: response }));
    } catch (error) {
      console.error('Error testing code verification:', error);
      setStatusMessage('Error during code verification: ' + String(error));
      setResults((prev) => ({ ...prev, codeVerification: { status: 'error', data: null, explanation: String(error) } }));
    } finally {
      setLoading(false);
      setActiveOperation(null);
    }
  };

  // Test the test generation capabilities of the TDDValidatorAgent
  const testTestGeneration = async () => {
    if (!codeToVerify) {
      alert('Please generate code first');
      return;
    }

    setLoading(true);
    setActiveOperation('testGeneration');
    setStatusMessage('Initializing TDDValidatorAgent for test generation...');
    
    try {
      setStatusMessage('Sending code to TDDValidatorAgent for test generation...');
      
      const payload = {
        input: {
          operation: 'generate_tests',
          data: {
            code: codeToVerify,
            testingFramework: 'jest'
          }
        },
        context: {
          parameters: {},
          accessLevel: 'user',
          userId: 'web-user',
          correlationId: 'web-test-' + Date.now()
        }
      };
      
      setStatusMessage('AI agent is generating tests...');
      const response = await apiRequest<ApiResponse>(
        'POST',
        '/api/agents/tdd-validator/execute',
        payload
      );

      setStatusMessage('Test generation complete!');
      setResults((prev) => ({ ...prev, testGeneration: response }));
    } catch (error) {
      console.error('Error testing test generation:', error);
      setStatusMessage('Error during test generation: ' + String(error));
      setResults((prev) => ({ ...prev, testGeneration: { status: 'error', data: null, explanation: String(error) } }));
    } finally {
      setLoading(false);
      setActiveOperation(null);
    }
  };

  return (
    <div className="container py-10">
      <h1 className="text-4xl font-bold mb-8">Development Agents Test</h1>
      
      {statusMessage && (
        <div className="bg-primary-50 border border-primary-200 text-primary-700 px-4 py-3 mb-6 rounded-lg">
          <p className="text-sm font-medium flex items-center">
            {loading && (
              <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em]" role="status"></span>
            )}
            {statusMessage}
          </p>
        </div>
      )}

      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>
              Adjust settings for the AI agents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div>
                <Label className="text-base">Code Complexity</Label>
                <RadioGroup
                  value={complexity}
                  onValueChange={(value) => setComplexity(value as 'simple' | 'moderate' | 'complex')}
                  className="flex gap-6 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="simple" id="simple" />
                    <Label htmlFor="simple">Simple</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="moderate" id="moderate" />
                    <Label htmlFor="moderate">Moderate</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="complex" id="complex" />
                    <Label htmlFor="complex">Complex</Label>
                  </div>
                </RadioGroup>
                <p className="text-sm text-muted-foreground mt-2">
                  Determines how sophisticated the generated code will be.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Button 
          variant="default" 
          size="lg" 
          onClick={testCodeGeneration} 
          disabled={loading}
        >
          {activeOperation === 'codeGeneration' ? 'Generating Code...' : 'Test Code Generation'}
        </Button>
        
        <Button 
          variant="secondary" 
          size="lg" 
          onClick={testCodeVerification} 
          disabled={loading || !codeToVerify}
        >
          {activeOperation === 'codeVerification' ? 'Verifying Code...' : 'Test Code Verification'}
        </Button>
        
        <Button 
          variant="outline" 
          size="lg" 
          onClick={testTestGeneration} 
          disabled={loading || !codeToVerify}
        >
          {activeOperation === 'testGeneration' ? 'Generating Tests...' : 'Test Test Generation'}
        </Button>

        <Button 
          variant="ghost" 
          size="lg" 
          onClick={fetchDiagnostics} 
          disabled={loading}
        >
          {activeOperation === 'diagnostics' ? 'Fetching Diagnostics...' : 'View Agent Diagnostics'}
        </Button>
      </div>
      
      <Tabs defaultValue="code" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="code">Generated Code</TabsTrigger>
          <TabsTrigger value="verification">Verification Results</TabsTrigger>
          <TabsTrigger value="tests">Generated Tests</TabsTrigger>
          <TabsTrigger value="diagnostics">Agent Diagnostics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="code">
          <Card>
            <CardHeader>
              <CardTitle>Generated Code</CardTitle>
              <CardDescription>Code generated by the GodTierBuilderAgent</CardDescription>
            </CardHeader>
            <CardContent>
              {results.codeGeneration ? (
                <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[500px]">
                  {results.codeGeneration.data?.generatedCode || JSON.stringify(results.codeGeneration, null, 2)}
                </pre>
              ) : (
                <p>No code generated yet. Click "Test Code Generation" above.</p>
              )}
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                Status: {results.codeGeneration?.status || 'Not run yet'}
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="verification">
          <Card>
            <CardHeader>
              <CardTitle>Code Verification Results</CardTitle>
              <CardDescription>Results from TDDValidatorAgent verification</CardDescription>
            </CardHeader>
            <CardContent>
              {results.codeVerification ? (
                <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[500px]">
                  {JSON.stringify(results.codeVerification, null, 2)}
                </pre>
              ) : (
                <p>No verification results yet. Generate code first, then click "Test Code Verification" above.</p>
              )}
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                Status: {results.codeVerification?.status || 'Not run yet'}
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="tests">
          <Card>
            <CardHeader>
              <CardTitle>Generated Tests</CardTitle>
              <CardDescription>Test suite generated by TDDValidatorAgent</CardDescription>
            </CardHeader>
            <CardContent>
              {results.testGeneration ? (
                <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[500px]">
                  {results.testGeneration.data?.testSuite || JSON.stringify(results.testGeneration, null, 2)}
                </pre>
              ) : (
                <p>No tests generated yet. Generate code first, then click "Test Test Generation" above.</p>
              )}
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                Status: {results.testGeneration?.status || 'Not run yet'}
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="diagnostics">
          <Card>
            <CardHeader>
              <CardTitle>Agent System Diagnostics</CardTitle>
              <CardDescription>Live information about the agent system</CardDescription>
            </CardHeader>
            <CardContent>
              {diagnostics ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium">System Status</h3>
                    <div className="mt-2 grid grid-cols-2 gap-4">
                      <div className="bg-muted p-3 rounded-md">
                        <div className="text-sm font-medium text-muted-foreground">Status</div>
                        <div className="text-lg mt-1">{diagnostics.coreStatus?.status || 'Unknown'}</div>
                      </div>
                      <div className="bg-muted p-3 rounded-md">
                        <div className="text-sm font-medium text-muted-foreground">Active Agents</div>
                        <div className="text-lg mt-1">{diagnostics.coreStatus?.agentCount || 0}</div>
                      </div>
                      <div className="bg-muted p-3 rounded-md">
                        <div className="text-sm font-medium text-muted-foreground">Uptime</div>
                        <div className="text-lg mt-1">{diagnostics.coreStatus?.uptimeSeconds || 0}s</div>
                      </div>
                      <div className="bg-muted p-3 rounded-md">
                        <div className="text-sm font-medium text-muted-foreground">Version</div>
                        <div className="text-lg mt-1">{diagnostics.coreStatus?.systemVersion || 'Unknown'}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium">Development Agents</h3>
                    <div className="mt-2 space-y-3">
                      {diagnostics.agents?.map((agent: any) => (
                        <div key={agent.id} className="bg-muted p-3 rounded-md">
                          <div className="flex justify-between items-center">
                            <div className="font-medium">{agent.name}</div>
                            <div className="text-sm px-2 py-1 rounded-full bg-green-100 text-green-800">
                              {agent.status || 'Unknown'}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Capabilities: {agent.capabilities?.join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium">Memory Usage</h3>
                    <div className="mt-2">
                      <pre className="bg-muted p-4 rounded-md text-xs overflow-auto">
                        {JSON.stringify(diagnostics.coreStatus?.memoryUsage || {}, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10">
                  <p className="text-muted-foreground mb-4">No diagnostics data available yet.</p>
                  <Button onClick={fetchDiagnostics} disabled={loading}>
                    {loading ? 'Loading...' : 'Fetch Diagnostics Data'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DevAgentsTest;