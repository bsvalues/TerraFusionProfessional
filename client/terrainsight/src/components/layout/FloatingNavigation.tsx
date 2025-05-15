import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Map, 
  Home, 
  Activity, 
  Calculator, 
  GitCompare, 
  Code, 
  FileText, 
  BarChart, 
  Brain, 
  LineChart, 
  Settings,
  ChevronRight,
  X,
  Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingNavItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  path: string;
}

export const FloatingNavigation: React.FC = () => {
  const [location, navigate] = useLocation();
  const [expanded, setExpanded] = useState(false);
  
  // Force the navigation to be initially visible on the dashboard page
  useEffect(() => {
    if (location === '/dashboard') {
      setTimeout(() => setExpanded(true), 500);
    }
  }, [location]);

  // Navigation links with their paths
  const navItems: FloatingNavItem[] = [
    { id: 'dashboard', name: 'Overview', icon: <Home size={18} />, path: '/dashboard' },
    { id: 'map', name: 'Map', icon: <Map size={18} />, path: '/map' },
    { id: 'analysis', name: 'Spatial Analysis', icon: <Activity size={18} />, path: '/analysis' },
    { id: 'comparison', name: 'Comparison', icon: <GitCompare size={18} />, path: '/comparison' },
    { id: 'regression', name: 'Regression', icon: <Calculator size={18} />, path: '/regression' },
    { id: 'modeling', name: 'Predictive', icon: <Brain size={18} />, path: '/prediction' },
    { id: 'timeseries', name: 'Time Series', icon: <LineChart size={18} />, path: '/property-value-trends' },
    { id: 'ai-playground', name: 'AI Playground', icon: <Brain size={18} />, path: '/scripting' },
    { id: 'reporting', name: 'Reports', icon: <FileText size={18} />, path: '/reports' },
    { id: 'kpi', name: 'KPI Dashboard', icon: <BarChart size={18} />, path: '/dashboard' },
    { id: 'settings', name: 'Settings', icon: <Settings size={18} />, path: '/settings' }
  ];

  // Determine active path
  const getIsActive = (path: string) => {
    return location === path;
  };

  return (
    <AnimatePresence>
      <div className="fixed bottom-10 right-6 z-50">
        {/* Toggle button - more prominent Apple-style floating button */}
        <motion.button
          onClick={() => setExpanded(!expanded)}
          className="w-20 h-20 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-blue-700 focus:outline-none border-4 border-white ring-4 ring-blue-200"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
          }}
        >
          {expanded ? <X size={30} /> : <Menu size={30} />}
        </motion.button>

        {/* Navigation panel */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-24 right-0 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-5 border border-white/30 w-[340px]"
              style={{
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)'
              }}
            >
              <h2 className="text-sm font-semibold text-gray-700 mb-4 text-center">
                Navigation Menu
              </h2>
              
              <div className="flex flex-wrap justify-center gap-4">
                {navItems.map((item) => {
                  const isActive = getIsActive(item.path);
                  
                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => {
                        navigate(item.path);
                        setExpanded(false);
                      }}
                      className={cn(
                        "flex flex-col items-center justify-center p-3 rounded-xl transition-all w-20",
                        isActive 
                          ? "bg-primary/10 text-primary shadow-md" 
                          : "text-gray-700 hover:bg-gray-100/70"
                      )}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center mb-2 shadow-sm",
                        isActive ? "bg-primary text-white" : "bg-white text-primary"
                      )}>
                        {item.icon}
                      </div>
                      <span className="text-xs font-medium truncate max-w-full">
                        {item.name}
                      </span>
                      
                      {isActive && (
                        <motion.div 
                          className="mt-1 h-1 w-8 bg-primary rounded-full"
                          layoutId="activeNavIndicator"
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
};