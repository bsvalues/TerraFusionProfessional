import React from 'react';
import { EnhancedDashboard } from '@/components/EnhancedDashboard';
import { useAppMode } from '@/contexts/AppModeContext';
import { AppModeIndicator } from '@/components/ui/app-mode-indicator';
import Dashboard from '@/components/Dashboard';
import { RouteComponentProps } from 'wouter';

export default function DashboardPage(_props: RouteComponentProps) {
  const { isStandalone } = useAppMode();
  // Use window.location to get the URL params
  const params = new URLSearchParams(window.location.search);
  const initialTab = params.get('tab') || undefined;
  
  // If initialTab is 'map', render Dashboard directly with map tab
  if (initialTab === 'map') {
    return <Dashboard initialTab="map" />;
  }
  
  return (
    <EnhancedDashboard />
  );
}