import React from 'react';
import { motion } from 'framer-motion';
import { Map, Database, Calculator, Settings, Activity, BarChartHorizontal, ChevronRight, Brain, LineChart, BarChart, Zap, Home, GitCompare, Code, FileText } from 'lucide-react';

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'overview', name: 'Overview', icon: <Home size={18} className="mr-2" /> },
    { id: 'map', name: 'Map', icon: <Map size={18} className="mr-2" /> },
    { id: 'analysis', name: 'Spatial Analysis', icon: <Activity size={18} className="mr-2" /> },
    { id: 'comparison', name: 'Comparison', icon: <GitCompare size={18} className="mr-2" /> },
    { id: 'regression', name: 'Regression', icon: <Calculator size={18} className="mr-2" /> },
    { id: 'modeling', name: 'Predictive', icon: <Brain size={18} className="mr-2" /> },
    { id: 'timeseries', name: 'Time Series', icon: <LineChart size={18} className="mr-2" /> },
    { id: 'scripts', name: 'Scripts', icon: <Code size={18} className="mr-2" /> },
    { id: 'reporting', name: 'Reports', icon: <FileText size={18} className="mr-2" /> },
    { id: 'kpi', name: 'KPI Dashboard', icon: <BarChart size={18} className="mr-2" /> },
    { id: 'analytics', name: 'Advanced Analytics', icon: <Zap size={18} className="mr-2" /> },
    { id: 'settings', name: 'Settings', icon: <Settings size={18} className="mr-2" /> }
  ];
  
  return (
    <nav className="bg-white backdrop-blur-md z-20 px-6 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.05)] border-b border-gray-100 sticky top-0">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          {/* Tabs bar with subtle glass effect */}
          <div className="relative overflow-hidden w-full">
            {/* Subtle indicators for scroll - no gradients for better readability */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-white z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-white z-10 pointer-events-none"></div>
            
            <ul className="flex space-x-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide relative">
              {tabs.map(tab => (
                <motion.li 
                  key={tab.id}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    cursor-pointer font-medium transition-all duration-200 flex items-center whitespace-nowrap
                    ${activeTab === tab.id 
                      ? 'text-primary' 
                      : 'text-gray-500 hover:text-gray-800'
                    }
                  `}
                  onClick={() => onTabChange(tab.id)}
                >
                  {/* Tab inner wrapper */}
                  <div className={`
                    px-4 py-2 rounded-xl flex items-center transition-all duration-300
                    ${activeTab === tab.id 
                      ? 'bg-gradient-to-br from-primary/10 to-primary/5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-primary/10' 
                      : 'hover:bg-gray-50 border border-transparent'
                    }
                  `}>
                    {/* Icon with subtle animation */}
                    <motion.div 
                      animate={activeTab === tab.id ? { rotate: [0, 5, 0] } : {}}
                      transition={{ duration: 0.3 }}
                      className={`
                        ${activeTab === tab.id 
                          ? 'text-primary' 
                          : 'text-gray-400'
                        } mr-2 transition-colors duration-200
                      `}
                    >
                      {tab.icon}
                    </motion.div>
                    
                    {/* Label */}
                    <span className="text-sm">{tab.name}</span>
                    
                    {/* Active indicator */}
                    {activeTab === tab.id && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-2 flex items-center"
                      >
                        <ChevronRight size={14} className="text-primary" />
                      </motion.div>
                    )}
                    
                    {/* Subtle underline for active tab */}
                    {activeTab === tab.id && (
                      <motion.div 
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary/30 rounded-full"
                        layoutId="activeTabIndicator"
                      />
                    )}
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>
          
          {/* Breadcrumb path with enhanced styling */}
          <motion.div 
            initial={{ opacity: 0, y: 5 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center mt-2 md:mt-0 text-xs text-gray-500 bg-gray-50/70 px-3 py-1.5 rounded-lg"
          >
            <span className="font-medium text-gray-600 module-lockup module-insight">
              <span className="prefix">Terra</span><span className="name">Insight</span>
            </span>
            <ChevronRight size={12} className="mx-1 text-gray-400" />
            <span className="font-medium text-primary">
              {tabs.find(tab => tab.id === activeTab)?.name}
            </span>
          </motion.div>
        </div>
      </div>
    </nav>
  );
};

export default TabNavigation;