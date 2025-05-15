import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Watch, 
  Server,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNotifications } from '@/contexts/NotificationContext';
import { LoadingOverlay } from '@/components/ui/loading-states';
import { cn } from '@/lib/utils';

// Define agent health status types
type AgentHealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'offline';

// Define agent data structure
interface Agent {
  id: string;
  name: string;
  status: AgentHealthStatus;
  lastUpdated: Date;
  uptimeSeconds?: number;
  errorCount?: number;
  memoryUsage?: number;
  capabilities?: string[];
}

// Sample data for demonstration
const SAMPLE_AGENTS: Agent[] = [
  {
    id: 'architect-prime',
    name: 'Architect Prime',
    status: 'unhealthy',
    lastUpdated: new Date(),
    errorCount: 3,
    capabilities: ['system-design', 'code-generation']
  },
  {
    id: 'integration-coordinator',
    name: 'Integration Coordinator',
    status: 'unhealthy',
    lastUpdated: new Date(),
    errorCount: 2,
    capabilities: ['api-integration', 'data-validation']
  },
  {
    id: 'bsbcmaster-lead',
    name: 'BSBC Master Lead',
    status: 'unhealthy',
    lastUpdated: new Date(),
    errorCount: 1,
    capabilities: ['task-coordination', 'process-automation']
  },
  {
    id: 'data-validation-agent',
    name: 'Data Validation Agent',
    status: 'unhealthy',
    lastUpdated: new Date(),
    errorCount: 4,
    capabilities: ['data-quality', 'schema-validation']
  },
  {
    id: 'legal-compliance-agent',
    name: 'Legal Compliance Agent',
    status: 'unhealthy', 
    lastUpdated: new Date(),
    errorCount: 2,
    capabilities: ['regulatory-compliance', 'document-analysis']
  },
  {
    id: 'valuation-agent',
    name: 'Valuation Agent',
    status: 'unhealthy',
    lastUpdated: new Date(),
    errorCount: 3,
    capabilities: ['property-valuation', 'market-analysis']
  },
  {
    id: 'workflow-agent',
    name: 'Workflow Agent',
    status: 'unhealthy',
    lastUpdated: new Date(),
    errorCount: 2,
    capabilities: ['process-automation', 'task-scheduling']
  },
  {
    id: 'god-tier-builder',
    name: 'God Tier Builder',
    status: 'unhealthy',
    lastUpdated: new Date(),
    errorCount: 1,
    capabilities: ['code-generation', 'system-design']
  },
  {
    id: 'tdd-validator',
    name: 'TDD Validator',
    status: 'unhealthy',
    lastUpdated: new Date(),
    errorCount: 3,
    capabilities: ['testing', 'code-quality']
  }
];

// API function to fetch agent health status
const fetchAgentHealth = async (): Promise<Agent[]> => {
  // In a real implementation, this would fetch data from the server
  // For now, we'll simulate some network latency
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return sample data
  return SAMPLE_AGENTS;
};

// API function to attempt agent recovery
const recoverAgent = async (agentId: string): Promise<boolean> => {
  // In a real implementation, this would make a request to recover the agent
  // For now, we'll simulate some network latency
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Simulate success in most cases, but occasional failure
  return Math.random() > 0.2;
};

// API function to recover all agents
const recoverAllAgents = async (): Promise<{
  successCount: number;
  failureCount: number;
  failures: string[];
}> => {
  // In a real implementation, this would make a request to recover all agents
  // For now, we'll simulate some network latency
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Simulate mostly success with some failures
  return {
    successCount: 7,
    failureCount: 2,
    failures: ['architect-prime', 'valuation-agent']
  };
};

interface AgentHealthMonitorProps {
  className?: string;
  compact?: boolean;
}

export const AgentHealthMonitor: React.FC<AgentHealthMonitorProps> = ({ 
  className,
  compact = false
}) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recoveringAgentId, setRecoveringAgentId] = useState<string | null>(null);
  const [recoveringAll, setRecoveringAll] = useState(false);
  const { addNotification } = useNotifications();
  
  // Calculate health metrics
  const totalAgents = agents.length;
  const healthyAgents = agents.filter(agent => agent.status === 'healthy').length;
  const unhealthyAgents = agents.filter(agent => agent.status === 'unhealthy').length;
  const degradedAgents = agents.filter(agent => agent.status === 'degraded').length;
  const offlineAgents = agents.filter(agent => agent.status === 'offline').length;
  
  const healthPercentage = totalAgents > 0 ? Math.round((healthyAgents / totalAgents) * 100) : 0;
  
  // Determine overall system health status
  const getSystemStatus = (): 'healthy' | 'degraded' | 'critical' => {
    if (unhealthyAgents + offlineAgents === 0) return 'healthy';
    if (unhealthyAgents + offlineAgents <= 2) return 'degraded';
    return 'critical';
  };
  
  const systemStatus = getSystemStatus();
  
  // Load agent health data
  const loadAgentHealth = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAgentHealth();
      setAgents(data);
    } catch (err) {
      setError('Failed to load agent health data');
      console.error('Error fetching agent health:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle agent recovery
  const handleRecoverAgent = async (agentId: string) => {
    try {
      setRecoveringAgentId(agentId);
      const success = await recoverAgent(agentId);
      
      if (success) {
        // Update the agent's status locally
        setAgents(prevAgents => 
          prevAgents.map(agent => 
            agent.id === agentId 
              ? { ...agent, status: 'healthy' as AgentHealthStatus, errorCount: 0 } 
              : agent
          )
        );
        
        addNotification({
          type: 'success',
          title: 'Agent Recovered',
          message: `Successfully recovered agent: ${agents.find(a => a.id === agentId)?.name}`,
          duration: 5000
        });
      } else {
        addNotification({
          type: 'error',
          title: 'Recovery Failed',
          message: `Failed to recover agent: ${agents.find(a => a.id === agentId)?.name}`,
          duration: 5000
        });
      }
    } catch (err) {
      console.error('Error recovering agent:', err);
      addNotification({
        type: 'error',
        title: 'Recovery Error',
        message: `An error occurred while attempting to recover the agent`,
        duration: 5000
      });
    } finally {
      setRecoveringAgentId(null);
    }
  };
  
  // Handle recovery of all agents
  const handleRecoverAllAgents = async () => {
    try {
      setRecoveringAll(true);
      const result = await recoverAllAgents();
      
      // Update the agents' statuses locally
      setAgents(prevAgents => 
        prevAgents.map(agent => 
          !result.failures.includes(agent.id)
            ? { ...agent, status: 'healthy' as AgentHealthStatus, errorCount: 0 }
            : agent
        )
      );
      
      if (result.failureCount === 0) {
        addNotification({
          type: 'success',
          title: 'All Agents Recovered',
          message: `Successfully recovered all ${result.successCount} agents`,
          duration: 5000
        });
      } else {
        addNotification({
          type: 'warning',
          title: 'Partial Recovery',
          message: `Recovered ${result.successCount} agents, but ${result.failureCount} failed`,
          duration: 5000
        });
      }
    } catch (err) {
      console.error('Error recovering all agents:', err);
      addNotification({
        type: 'error',
        title: 'Recovery Error',
        message: 'An error occurred while attempting to recover all agents',
        duration: 5000
      });
    } finally {
      setRecoveringAll(false);
    }
  };
  
  // Load agent health data on mount
  useEffect(() => {
    loadAgentHealth();
    
    // Set up polling to refresh data
    const intervalId = setInterval(loadAgentHealth, 60000); // Refresh every minute
    
    return () => clearInterval(intervalId);
  }, []);
  
  // If in compact mode, render a simplified version
  if (compact) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="p-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center">
              <Server className="mr-2 h-4 w-4" />
              Agent Health
            </CardTitle>
            <Badge 
              variant={systemStatus === 'healthy' ? 'default' : systemStatus === 'degraded' ? 'outline' : 'destructive'}
              className={cn(
                "px-2 py-0",
                systemStatus === 'healthy' ? "bg-emerald-500 hover:bg-emerald-500/80" : 
                systemStatus === 'degraded' ? "text-amber-600 border-amber-600" : ""
              )}
            >
              {systemStatus === 'healthy' ? 'Healthy' : systemStatus === 'degraded' ? 'Degraded' : 'Critical'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>System Health</span>
              <span>{healthPercentage}%</span>
            </div>
            <Progress value={healthPercentage} className="h-2" />
            
            <div className="grid grid-cols-2 gap-2 text-sm mt-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Agents</span>
                <span>{totalAgents}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Unhealthy</span>
                <span className="font-medium text-destructive">{unhealthyAgents}</span>
              </div>
            </div>
          </div>
        </CardContent>
        {unhealthyAgents > 0 && (
          <CardFooter className="p-4 pt-0 flex justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs"
              onClick={handleRecoverAllAgents}
              disabled={recoveringAll}
            >
              {recoveringAll ? (
                <>
                  <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                  Recovering...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-1 h-3 w-3" />
                  Recover All
                </>
              )}
            </Button>
          </CardFooter>
        )}
      </Card>
    );
  }
  
  // Full version
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="flex items-center">
              <Server className="mr-2 h-5 w-5" />
              Agent Health Monitor
            </CardTitle>
            <CardDescription>
              Monitor and recover AI agent system health
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant={systemStatus === 'healthy' ? 'default' : systemStatus === 'degraded' ? 'outline' : 'destructive'}
              className={cn(
                "px-3 py-1",
                systemStatus === 'healthy' ? "bg-emerald-500 hover:bg-emerald-500/80" : 
                systemStatus === 'degraded' ? "text-amber-600 border-amber-600" : ""
              )}
            >
              {systemStatus === 'healthy' ? 'System Healthy' : systemStatus === 'degraded' ? 'System Degraded' : 'System Critical'}
            </Badge>
            
            <Button 
              size="sm" 
              variant="outline"
              onClick={loadAgentHealth}
              disabled={loading}
            >
              <RefreshCw className={cn("h-4 w-4 mr-1", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <LoadingOverlay isLoading={loading && agents.length === 0} text="Loading agent data...">
          {error ? (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm font-medium">System Health</div>
                  <div className="text-xl font-bold">{healthPercentage}%</div>
                </div>
                <Progress value={healthPercentage} className="h-2 mt-2" />
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm font-medium">Agent Status</div>
                  <div className="text-lg">
                    <span className="mr-2">
                      <span className="text-emerald-500 font-bold">{healthyAgents}</span> Healthy
                    </span>
                    <span>
                      <span className="text-destructive font-bold">{unhealthyAgents + offlineAgents}</span> Issues
                    </span>
                  </div>
                </div>
                <div className="flex justify-between mt-2">
                  <div className="flex-1 h-8 bg-emerald-100 dark:bg-emerald-900/20 mr-1" style={{ width: `${(healthyAgents / totalAgents) * 100}%` }}></div>
                  <div className="flex-1 h-8 bg-amber-100 dark:bg-amber-900/20 mr-1" style={{ width: `${(degradedAgents / totalAgents) * 100}%` }}></div>
                  <div className="flex-1 h-8 bg-destructive/20 mr-1" style={{ width: `${(unhealthyAgents / totalAgents) * 100}%` }}></div>
                  <div className="flex-1 h-8 bg-slate-200 dark:bg-slate-800" style={{ width: `${(offlineAgents / totalAgents) * 100}%` }}></div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <div className="text-sm font-medium">Recovery Actions</div>
                  <div className="text-sm text-muted-foreground mt-1">Fix agent issues</div>
                </div>
                
                <Button 
                  onClick={handleRecoverAllAgents}
                  disabled={recoveringAll || unhealthyAgents === 0}
                  className="ml-2"
                >
                  {recoveringAll ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Recovering...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Recover All
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <Tabs defaultValue="issues" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="issues">Issues ({unhealthyAgents + degradedAgents + offlineAgents})</TabsTrigger>
              <TabsTrigger value="all">All Agents ({totalAgents})</TabsTrigger>
              <TabsTrigger value="health-log">Health Log</TabsTrigger>
            </TabsList>
            
            <TabsContent value="issues" className="mt-4">
              {unhealthyAgents + degradedAgents + offlineAgents === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">All Agents Healthy</h3>
                  <p className="text-muted-foreground mt-1">No issues detected in the agent system</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {agents
                    .filter(agent => agent.status !== 'healthy')
                    .map(agent => (
                      <Card key={agent.id} className="overflow-hidden">
                        <div className="flex border-l-4 border-destructive">
                          <div className="flex-1 p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <Bot className="h-5 w-5 mr-2 text-muted-foreground" />
                                <div>
                                  <h4 className="font-medium">{agent.name}</h4>
                                  <p className="text-sm text-muted-foreground">ID: {agent.id}</p>
                                </div>
                              </div>
                              
                              <Badge 
                                variant={
                                  agent.status === 'degraded' ? 'outline' : 
                                  agent.status === 'unhealthy' ? 'destructive' : 
                                  'outline'
                                }
                                className={
                                  agent.status === 'degraded' ? "text-amber-600 border-amber-600" : 
                                  agent.status === 'unhealthy' ? "" : 
                                  "text-slate-400 border-slate-400"
                                }
                              >
                                {agent.status === 'degraded' ? 'Degraded' : 
                                 agent.status === 'unhealthy' ? 'Unhealthy' : 
                                 'Offline'}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                              <div>
                                <div className="text-xs text-muted-foreground">Status</div>
                                <div className="flex items-center mt-1">
                                  {agent.status === 'degraded' ? (
                                    <AlertTriangle className="h-4 w-4 text-amber-500 mr-1" />
                                  ) : agent.status === 'unhealthy' ? (
                                    <XCircle className="h-4 w-4 text-destructive mr-1" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-slate-400 mr-1" />
                                  )}
                                  <span>{agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}</span>
                                </div>
                              </div>
                              
                              <div>
                                <div className="text-xs text-muted-foreground">Last Updated</div>
                                <div className="mt-1 flex items-center">
                                  <Watch className="h-4 w-4 mr-1 text-muted-foreground" />
                                  {agent.lastUpdated.toLocaleTimeString()}
                                </div>
                              </div>
                              
                              <div>
                                <div className="text-xs text-muted-foreground">Error Count</div>
                                <div className="mt-1">
                                  {agent.errorCount || 0}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-muted p-4 flex items-center">
                            <Button 
                              onClick={() => handleRecoverAgent(agent.id)}
                              disabled={recoveringAgentId === agent.id}
                              className="whitespace-nowrap"
                            >
                              {recoveringAgentId === agent.id ? (
                                <>
                                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                  Recovering...
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="mr-2 h-4 w-4" />
                                  Recover Agent
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="all" className="mt-4">
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted border-b">
                      <th className="py-3 px-4 text-left font-medium">Agent</th>
                      <th className="py-3 px-4 text-left font-medium">Status</th>
                      <th className="py-3 px-4 text-left font-medium hidden md:table-cell">Capabilities</th>
                      <th className="py-3 px-4 text-left font-medium hidden md:table-cell">Last Updated</th>
                      <th className="py-3 px-4 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {agents.map(agent => (
                      <tr key={agent.id} className={agent.status !== 'healthy' ? 'bg-destructive/5' : ''}>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <Bot className="h-4 w-4 mr-2 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{agent.name}</div>
                              <div className="text-xs text-muted-foreground">{agent.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge 
                            variant={
                              agent.status === 'healthy' ? 'default' :
                              agent.status === 'degraded' ? 'outline' : 
                              agent.status === 'unhealthy' ? 'destructive' : 
                              'outline'
                            }
                            className={
                              agent.status === 'healthy' ? "bg-emerald-500 hover:bg-emerald-500/80" :
                              agent.status === 'degraded' ? "text-amber-600 border-amber-600" : 
                              agent.status === 'unhealthy' ? "" : 
                              "text-slate-400 border-slate-400"
                            }
                          >
                            {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {agent.capabilities?.map((capability, index) => (
                              <span 
                                key={index} 
                                className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs"
                              >
                                {capability}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell">
                          {agent.lastUpdated.toLocaleTimeString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {agent.status !== 'healthy' ? (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleRecoverAgent(agent.id)}
                              disabled={recoveringAgentId === agent.id}
                            >
                              {recoveringAgentId === agent.id ? (
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <RefreshCw className="h-3.5 w-3.5" />
                              )}
                              <span className="ml-1 md:hidden">Recover</span>
                              <span className="ml-1 hidden md:inline">Recover Agent</span>
                            </Button>
                          ) : (
                            <Badge variant="outline" className="font-normal">
                              <CheckCircle className="h-3 w-3 text-emerald-500 mr-1" /> 
                              Healthy
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
            
            <TabsContent value="health-log" className="mt-4">
              <div className="rounded-md border overflow-hidden">
                <div className="p-4 bg-muted border-b flex justify-between items-center">
                  <div className="font-medium">Agent Health Activity Log</div>
                  <Button size="sm" variant="outline">
                    <RefreshCw className="h-3.5 w-3.5 mr-1" />
                    Refresh Log
                  </Button>
                </div>
                
                <div className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-3">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">System degraded</div>
                        <div className="text-sm text-muted-foreground">9 unhealthy agents detected during health check</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date().toLocaleTimeString()} • Agent Health Monitor
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <RefreshCw className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">Recovery attempt initiated</div>
                        <div className="text-sm text-muted-foreground">Attempting recovery for all unhealthy agents</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date().toLocaleTimeString()} • System
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-3">
                        <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                          <XCircle className="h-4 w-4 text-destructive" />
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">Recovery failed for some agents</div>
                        <div className="text-sm text-muted-foreground">
                          Failed to recover: architect-prime, valuation-agent
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date().toLocaleTimeString()} • Recovery Service
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">Recovery succeeded for 7 agents</div>
                        <div className="text-sm text-muted-foreground">
                          Successfully recovered 7 out of 9 agents
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date().toLocaleTimeString()} • Recovery Service
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </LoadingOverlay>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm">
          View Detailed Reports
        </Button>
        
        <Button size="sm" variant="link" className="gap-1">
          Configure Monitor Settings
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AgentHealthMonitor;