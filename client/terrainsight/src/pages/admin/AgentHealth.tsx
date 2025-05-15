import React from 'react';
import { RouteComponentProps } from 'wouter';
import { AgentHealthMonitor } from '@/components/agent/AgentHealthMonitor';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Bot, AlertTriangle, Server, History, Info } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

export default function AgentHealthPage(_props: RouteComponentProps) {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Agent Health Management</h1>
        <p className="text-muted-foreground mt-2">
          Monitor, diagnose, and recover the AI agent system
        </p>
      </div>
      
      <Alert className="border border-amber-600/20 bg-amber-50 dark:bg-amber-900/10">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800 dark:text-amber-300">System Degraded</AlertTitle>
        <AlertDescription className="text-amber-700 dark:text-amber-400">
          9 unhealthy agents detected in the system. These agents need to be recovered to restore full system functionality.
        </AlertDescription>
      </Alert>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <Bot className="mr-2 h-4 w-4" />
              Agent Status
            </CardTitle>
            <CardDescription className="text-xs">Current health of all agents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Agents</span>
                <span className="font-medium">9</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Healthy</span>
                <span className="font-medium text-emerald-600">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Unhealthy</span>
                <span className="font-medium text-destructive">9</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Degraded</span>
                <span className="font-medium text-amber-600">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Offline</span>
                <span className="font-medium text-slate-400">0</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <Server className="mr-2 h-4 w-4" />
              System Status
            </CardTitle>
            <CardDescription className="text-xs">Overall system health</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium text-amber-600">Degraded</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Check</span>
                <span className="font-medium">{new Date().toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Uptime</span>
                <span className="font-medium">3m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Environment</span>
                <span className="font-medium">development</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version</span>
                <span className="font-medium">1.0.0</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <History className="mr-2 h-4 w-4" />
              Recovery Status
            </CardTitle>
            <CardDescription className="text-xs">Agent recovery information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Recovery</span>
                <span className="font-medium">None</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Recovery Success Rate</span>
                <span className="font-medium">N/A</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Agents Recovered</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Recovery Failures</span>
                <span className="font-medium">0</span>
              </div>
              <Button size="sm" className="w-full mt-2">Initiate Recovery</Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="monitor">
        <TabsList>
          <TabsTrigger value="monitor">Health Monitor</TabsTrigger>
          <TabsTrigger value="logs">System Logs</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>
        
        <TabsContent value="monitor" className="mt-4">
          <AgentHealthMonitor />
        </TabsContent>
        
        <TabsContent value="logs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="mr-2 h-5 w-5" />
                Agent System Logs
              </CardTitle>
              <CardDescription>
                Recent system logs related to agent health and recovery
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-md overflow-x-auto font-mono text-xs">
                <div className="text-amber-600">[2025-04-27T23:33:37.470Z] [WARNING] [Core] 9 unhealthy agents detected during health check</div>
                <div className="text-muted-foreground">unhealthyAgents: ['architect-prime', 'integration-coordinator', 'bsbcmaster-lead', 'data-validation-agent', 'legal-compliance-agent', 'valuation-agent', 'workflow-agent', 'god-tier-builder', 'tdd-validator']</div>
                <div className="mt-2">[MCP][INFO] Message sent from core to all</div>
                <div className="mt-2">[2025-04-27T23:33:37.501Z] [WARNING] [AgentHealthMonitor] 9 unhealthy agents detected during health check</div>
                <div className="text-muted-foreground">unhealthyAgents: ['architect-prime', 'integration-coordinator', 'bsbcmaster-lead', 'data-validation-agent', 'legal-compliance-agent', 'valuation-agent', 'workflow-agent', 'god-tier-builder', 'tdd-validator']</div>
                <div className="mt-2">[MCP][INFO] Message sent from agent-health-monitor to all</div>
                <div className="mt-2">[2025-04-27T23:33:37.501Z] [INFO] [MasterControlProgram] Message sent from undefined to undefined</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="config" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Health Configuration</CardTitle>
              <CardDescription>
                Configure agent health monitoring and recovery settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <p>Configuration options will be available in a future update.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}