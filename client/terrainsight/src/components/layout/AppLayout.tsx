import React, { useState } from 'react';
import { AppHeader } from './AppHeader';
import { Sidebar } from './Sidebar';
import AppNavigation from './AppNavigation';
import { Toaster } from '@/components/ui/toaster';
import { WorkflowPanel } from '@/components/workflow/WorkflowPanel';
import { useWorkflow } from '@/contexts/WorkflowContext';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { activeWorkflow } = useWorkflow();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <AppHeader onToggleSidebar={toggleSidebar} />
      
      {/* Main Content */}
      <div className="flex-grow flex pt-14">
        {/* Sidebar */}
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        {/* Main Content Area */}
        <main className="flex-grow">
          {/* Workflow Panel (shown when a workflow is active) */}
          {activeWorkflow && (
            <div className="sticky top-14 z-10 bg-background border-b shadow-sm">
              <div className="container mx-auto px-4 py-2">
                <WorkflowPanel />
              </div>
            </div>
          )}
          
          {children}
        </main>
      </div>
      
      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <AppNavigation />
      </div>
      
      {/* Toast notifications */}
      <Toaster />
    </div>
  );
};