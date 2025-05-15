import { Route, Switch } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/theme-provider';
import { AppLayout } from '@/components/layout/AppLayout';
import { WorkflowProvider } from '@/contexts/WorkflowContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import ErrorBoundary from '@/components/error/ErrorBoundary';
import HomePage from './pages/Home';
import NotFoundPage from './pages/NotFound';
import DatabaseStatusPage from './pages/admin/DatabaseStatus';
import AgentHealthPage from './pages/admin/AgentHealth';
import DataPage from './pages/Data';
import DashboardPage from './pages/dashboard';
import GISDataPage from './pages/GISDataPage';
import AnalysisPage from './pages/Analysis';
import PropertyExplorer from './pages/PropertyExplorer';
import DemoPage from './pages/DemoPage';
import IncomeApproachPage from './pages/IncomeApproachPage';
import ScriptingPage from './pages/scripting';
import LayersPage from './pages/Layers';
import ReportsPage from './pages/Reports';
import WorkflowManagementPage from './pages/WorkflowManagement';
import { queryClient } from './lib/queryClient';

function App() {
  // Global error handler for uncaught exceptions
  const handleGlobalError = (error: Error) => {
    console.error('Global error caught:', error);
    // In a production environment, you could send this to an error tracking service
  };

  return (
    <ErrorBoundary onError={handleGlobalError}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light" storageKey="terrainsight-theme">
          <NotificationProvider>
            <WorkflowProvider>
              <AppLayout>
                <Switch>
                  <Route path="/" component={(props) => (
                    <ErrorBoundary>
                      <HomePage {...props} />
                    </ErrorBoundary>
                  )} />
                  <Route path="/map" component={(props) => (
                    <ErrorBoundary>
                      <GISDataPage {...props} />
                    </ErrorBoundary>
                  )} />
                  <Route path="/analysis" component={(props) => (
                    <ErrorBoundary>
                      <AnalysisPage {...props} />
                    </ErrorBoundary>
                  )} />
                  <Route path="/income-approach" component={(props) => (
                    <ErrorBoundary>
                      <IncomeApproachPage {...props} />
                    </ErrorBoundary>
                  )} />
                  <Route path="/scripting" component={(props) => (
                    <ErrorBoundary>
                      <ScriptingPage {...props} />
                    </ErrorBoundary>
                  )} />
                  <Route path="/dashboard" component={(props) => (
                    <ErrorBoundary>
                      <DashboardPage {...props} />
                    </ErrorBoundary>
                  )} />
                  <Route path="/data" component={(props) => (
                    <ErrorBoundary>
                      <DataPage {...props} />
                    </ErrorBoundary>
                  )} />
                  <Route path="/properties" component={(props) => (
                    <ErrorBoundary>
                      <PropertyExplorer {...props} />
                    </ErrorBoundary>
                  )} />
                  <Route path="/layers" component={(props) => (
                    <ErrorBoundary>
                      <LayersPage {...props} />
                    </ErrorBoundary>
                  )} />
                  <Route path="/reports" component={(props) => (
                    <ErrorBoundary>
                      <ReportsPage {...props} />
                    </ErrorBoundary>
                  )} />
                  <Route path="/demos" component={(props) => (
                    <ErrorBoundary>
                      <DemoPage {...props} />
                    </ErrorBoundary>
                  )} />
                  <Route path="/workflows" component={(props) => (
                    <ErrorBoundary>
                      <WorkflowManagementPage {...props} />
                    </ErrorBoundary>
                  )} />
                  <Route path="/updates" component={(props) => (
                    <ErrorBoundary>
                      <WorkflowManagementPage {...props} />
                    </ErrorBoundary>
                  )} />
                  <Route path="/activity" component={(props) => (
                    <ErrorBoundary>
                      <WorkflowManagementPage {...props} />
                    </ErrorBoundary>
                  )} />
                  <Route path="/tasks" component={(props) => (
                    <ErrorBoundary>
                      <WorkflowManagementPage {...props} />
                    </ErrorBoundary>
                  )} />
                  <Route path="/accuracy" component={(props) => (
                    <ErrorBoundary>
                      <WorkflowManagementPage {...props} />
                    </ErrorBoundary>
                  )} />
                  <Route path="/admin/database" component={(props) => (
                    <ErrorBoundary>
                      <DatabaseStatusPage {...props} />
                    </ErrorBoundary>
                  )} />
                  <Route path="/admin/agents" component={(props) => (
                    <ErrorBoundary>
                      <AgentHealthPage {...props} />
                    </ErrorBoundary>
                  )} />
                  <Route component={(props) => (
                    <ErrorBoundary>
                      <NotFoundPage {...props} />
                    </ErrorBoundary>
                  )} />
                </Switch>
              </AppLayout>
            </WorkflowProvider>
          </NotificationProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;