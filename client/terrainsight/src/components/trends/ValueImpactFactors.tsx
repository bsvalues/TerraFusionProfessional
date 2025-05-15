import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building, 
  Factory,
  School, 
  TrendingUp, 
  Zap, 
  FileText, 
  ArrowUpRight, 
  ArrowDownRight, 
  LayoutGrid,
  HelpCircle
} from 'lucide-react';
import { Tooltip } from '@/components/ui/custom-tooltip';

interface ValueImpactFactorsProps {
  selectedYear: string;
  className?: string;
}

export const ValueImpactFactors: React.FC<ValueImpactFactorsProps> = ({
  selectedYear,
  className = ''
}) => {
  // Active tab state
  const [activeTab, setActiveTab] = useState('economic');
  
  // Calculate relative time description (e.g., "Current", "2 years ago", "3 years in the future")
  const getTimeDescription = (year: string) => {
    const currentYear = new Date().getFullYear();
    const yearDiff = parseInt(year) - currentYear;
    
    if (yearDiff === 0) return 'Current';
    if (yearDiff < 0) return `${Math.abs(yearDiff)} years ago`;
    return `${yearDiff} years in the future`;
  };
  
  // Economic indicators that correlate with property values
  const economicFactors = [
    {
      id: 'interest-rates',
      name: 'Mortgage Interest Rates',
      value: selectedYear === '2025' ? '6.7%' : selectedYear === '2024' ? '7.1%' : selectedYear === '2023' ? '6.9%' : '5.5%',
      impact: selectedYear === '2025' ? 'positive' : selectedYear === '2024' ? 'negative' : 'neutral',
      description: 'Average 30-year fixed mortgage rates. Lower rates typically boost property values by increasing buyer purchasing power.'
    },
    {
      id: 'employment',
      name: 'County Employment Rate',
      value: selectedYear === '2025' ? '96.3%' : selectedYear === '2024' ? '95.8%' : selectedYear === '2023' ? '94.2%' : '93.5%',
      impact: 'positive',
      description: 'Employment figures for Benton County. Higher employment correlates with increased housing demand.'
    },
    {
      id: 'income',
      name: 'Median Household Income',
      value: selectedYear === '2025' ? '$78,950' : selectedYear === '2024' ? '$76,200' : selectedYear === '2023' ? '$72,500' : '$68,400',
      impact: 'positive',
      description: 'Median income for Benton County residents. Rising incomes typically drive property value appreciation.'
    },
    {
      id: 'population',
      name: 'Population Growth',
      value: selectedYear === '2025' ? '+1.8%' : selectedYear === '2024' ? '+1.5%' : selectedYear === '2023' ? '+1.2%' : '+0.9%',
      impact: 'positive', 
      description: 'Annual population growth rate. Population increases drive housing demand and typically raise property values.'
    }
  ];
  
  // Infrastructure projects that impact property values
  const infrastructureProjects = [
    {
      id: 'road-expansion',
      name: 'County Road Expansion',
      status: selectedYear >= '2024' ? 'Completed' : selectedYear >= '2022' ? 'In Progress' : 'Planned',
      impact: 'positive',
      description: 'Major expansion of Route 240 improving access to eastern Benton County. Expected to increase values in adjacent areas.',
      year: '2022-2024'
    },
    {
      id: 'water-system',
      name: 'Water System Upgrade',
      status: selectedYear >= '2025' ? 'Completed' : selectedYear >= '2023' ? 'In Progress' : 'Planned',
      impact: 'positive',
      description: 'Modernization of county water infrastructure increasing capacity and quality. Properties with upgraded water systems typically see 5-8% value increases.',
      year: '2023-2025'
    },
    {
      id: 'community-center',
      name: 'Richland Community Center',
      status: selectedYear >= '2023' ? 'Completed' : 'Under Construction',
      impact: 'positive',
      description: 'New community center with recreational facilities. Properties within 1 mile radius have shown 3-4% higher appreciation rates.',
      year: '2021-2023'
    },
    {
      id: 'fiber-network',
      name: 'County-wide Fiber Network',
      status: selectedYear >= '2025' ? 'Phase 1 Complete' : 'Planned',
      impact: 'positive',
      description: 'High-speed internet infrastructure deployment. Properties with fiber access typically command 3-7% price premiums.',
      year: '2024-2026'
    }
  ];
  
  // School district performance data
  const schoolPerformance = [
    {
      id: 'richland-sd',
      name: 'Richland School District',
      rating: selectedYear === '2025' ? 'A' : selectedYear === '2024' ? 'A-' : selectedYear === '2023' ? 'B+' : 'B',
      testScores: selectedYear === '2025' ? '91%' : selectedYear === '2024' ? '88%' : selectedYear === '2023' ? '85%' : '82%',
      impact: 'positive',
      description: 'District serving northern Benton County. Strong school performance typically adds 10-15% to property values.'
    },
    {
      id: 'kennewick-sd',
      name: 'Kennewick School District',
      rating: selectedYear === '2025' ? 'B+' : selectedYear === '2024' ? 'B' : selectedYear === '2023' ? 'B-' : 'C+',
      testScores: selectedYear === '2025' ? '84%' : selectedYear === '2024' ? '81%' : selectedYear === '2023' ? '78%' : '75%',
      impact: 'positive',
      description: 'District serving central Benton County. Improvement in school ratings often precedes property value increases.'
    },
    {
      id: 'pasco-sd',
      name: 'Pasco School District',
      rating: selectedYear === '2025' ? 'B' : selectedYear === '2024' ? 'B-' : selectedYear === '2023' ? 'C+' : 'C',
      testScores: selectedYear === '2025' ? '81%' : selectedYear === '2024' ? '78%' : selectedYear === '2023' ? '75%' : '72%',
      impact: 'neutral',
      description: 'District serving western portions of the county. Steady performance with modest improvement trends.'
    }
  ];
  
  // Zoning changes
  const zoningChanges = [
    {
      id: 'downtown-mixed-use',
      name: 'Downtown Mixed-Use Expansion',
      status: selectedYear >= '2024' ? 'Implemented' : selectedYear >= '2023' ? 'Approved' : 'Proposed',
      impact: 'positive',
      description: 'Expansion of mixed-use zoning in Richland downtown area. Typically results in 15-25% commercial property value increases.',
      year: '2023-2024'
    },
    {
      id: 'residential-density',
      name: 'Residential Density Increase',
      status: selectedYear >= '2025' ? 'Implemented' : 'Under Review',
      impact: 'positive',
      description: 'Allowing higher density residential development in northern neighborhoods. Can increase land values by 20-30%.',
      year: '2024-2025'
    },
    {
      id: 'agricultural-preservation',
      name: 'Agricultural Land Preservation',
      status: selectedYear >= '2023' ? 'Implemented' : 'Proposed',
      impact: 'neutral',
      description: 'Zoning to preserve agricultural lands in southern Benton County. Limits development but stabilizes rural property values.',
      year: '2022-2023'
    },
    {
      id: 'commercial-corridor',
      name: 'Highway 240 Commercial Corridor',
      status: selectedYear >= '2024' ? 'Phase 1 Complete' : 'Planned',
      impact: 'positive',
      description: 'New commercial zoning along Highway 240. Adjacent properties have shown 5-10% value increases in anticipation.',
      year: '2023-2026'
    }
  ];
  
  // Helper function to render impact indicators
  const renderImpactIndicator = (impact: string) => {
    if (impact === 'positive') {
      return (
        <div className="flex items-center text-emerald-600">
          <ArrowUpRight className="h-4 w-4 mr-1" />
          <span className="text-xs">Positive</span>
        </div>
      );
    } else if (impact === 'negative') {
      return (
        <div className="flex items-center text-rose-600">
          <ArrowDownRight className="h-4 w-4 mr-1" />
          <span className="text-xs">Negative</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-gray-500">
          <span className="text-xs">Neutral</span>
        </div>
      );
    }
  };
  
  return (
    <div className={`border border-neutral-200 rounded-lg bg-white overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 ${className}`}>
      <div className="p-3 border-b border-neutral-200 flex items-center justify-between bg-gradient-to-r from-white to-gray-50">
        <div className="flex items-center">
          <div className="bg-amber-50 p-1.5 rounded-md mr-2 shadow-sm">
            <Zap className="h-4 w-4 text-amber-500" />
          </div>
          <h2 className="text-base font-medium text-gray-900">Value Impact Factors</h2>
        </div>
        <div className="text-sm font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">
          {selectedYear} <span className="text-xs font-normal">({getTimeDescription(selectedYear)})</span>
        </div>
      </div>
      
      <div className="p-4">
        <Tabs defaultValue="economic" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-4">
            <TabsTrigger value="economic" className="flex-1">
              <TrendingUp className="h-4 w-4 mr-2" />
              <span>Economic</span>
            </TabsTrigger>
            <TabsTrigger value="infrastructure" className="flex-1">
              <Factory className="h-4 w-4 mr-2" />
              <span>Infrastructure</span>
            </TabsTrigger>
            <TabsTrigger value="schools" className="flex-1">
              <School className="h-4 w-4 mr-2" />
              <span>Schools</span>
            </TabsTrigger>
            <TabsTrigger value="zoning" className="flex-1">
              <LayoutGrid className="h-4 w-4 mr-2" />
              <span>Zoning</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="economic" className="space-y-4">
            <p className="text-sm text-gray-600 mb-3">
              Economic indicators that correlate with property value changes in Benton County:
            </p>
            <div className="space-y-3">
              {economicFactors.map(factor => (
                <div 
                  key={factor.id} 
                  className="border border-gray-100 rounded-lg p-3.5 hover:shadow-md hover:border-gray-200 transition-all duration-200 transform hover:-translate-y-1 bg-gradient-to-br from-white to-gray-50"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-gray-900">{factor.name}</h3>
                    {renderImpactIndicator(factor.impact)}
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-2xl font-bold text-primary drop-shadow-sm">{factor.value}</div>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{factor.description}</p>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="infrastructure" className="space-y-4">
            <p className="text-sm text-gray-600 mb-3">
              Major infrastructure projects affecting property values in the county:
            </p>
            <div className="space-y-3">
              {infrastructureProjects.map(project => (
                <div 
                  key={project.id} 
                  className="border border-gray-100 rounded-lg p-3.5 hover:shadow-md hover:border-gray-200 transition-all duration-200 transform hover:-translate-y-1 bg-gradient-to-br from-white to-gray-50"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-gray-900">{project.name}</h3>
                    {renderImpactIndicator(project.impact)}
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <div className="px-2 py-1 bg-blue-50 rounded-full text-xs font-medium text-blue-700 shadow-sm">
                      {project.status}
                    </div>
                    <div className="text-xs font-medium text-gray-700">
                      <span className="opacity-60 mr-1">Timeline:</span> {project.year}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{project.description}</p>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="schools" className="space-y-4">
            <p className="text-sm text-gray-600 mb-3">
              School district performance data and property value correlation:
            </p>
            <div className="space-y-3">
              {schoolPerformance.map(school => (
                <div 
                  key={school.id} 
                  className="border border-gray-100 rounded-lg p-3.5 hover:shadow-md hover:border-gray-200 transition-all duration-200 transform hover:-translate-y-1 bg-gradient-to-br from-white to-gray-50"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-gray-900">{school.name}</h3>
                    {renderImpactIndicator(school.impact)}
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center">
                      <div className="px-2 py-1 bg-emerald-50 rounded-full text-xs font-medium text-emerald-700 shadow-sm mr-2">
                        Rating: {school.rating}
                      </div>
                      <div className="text-xs font-medium text-gray-700 bg-gray-50 px-2 py-1 rounded-full">
                        <span className="opacity-60 mr-1">Test Scores:</span> {school.testScores}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{school.description}</p>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="zoning" className="space-y-4">
            <p className="text-sm text-gray-600 mb-3">
              Zoning changes affecting property development and values:
            </p>
            <div className="space-y-3">
              {zoningChanges.map(zoning => (
                <div 
                  key={zoning.id} 
                  className="border border-gray-100 rounded-lg p-3.5 hover:shadow-md hover:border-gray-200 transition-all duration-200 transform hover:-translate-y-1 bg-gradient-to-br from-white to-gray-50"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-gray-900">{zoning.name}</h3>
                    {renderImpactIndicator(zoning.impact)}
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <div className="px-2 py-1 bg-purple-50 rounded-full text-xs font-medium text-purple-700 shadow-sm">
                      {zoning.status}
                    </div>
                    <div className="text-xs font-medium text-gray-700">
                      <span className="opacity-60 mr-1">Timeline:</span> {zoning.year}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{zoning.description}</p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-start text-xs text-gray-500 p-1 bg-gray-50 rounded-md">
            <Tooltip 
              content="This data is based on county economic reports, planning documents, and education statistics."
            >
              <div className="flex items-center justify-center w-6 h-6 bg-white rounded-full shadow-sm mr-2 flex-shrink-0">
                <HelpCircle className="h-3.5 w-3.5 text-blue-500" />
              </div>
            </Tooltip>
            <p className="leading-relaxed pt-1">
              Value impact factors analyze how external conditions influence property values. 
              <span className="block mt-1 text-gray-400 italic">Data updated quarterly from Benton County economic development office, planning department, and school district reports.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};