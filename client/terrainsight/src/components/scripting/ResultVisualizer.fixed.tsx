import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, BarChart2, LineChart, PieChart, Table as TableIcon, RefreshCw, Download, Circle } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ResultVisualizerProps {
  data: any;
}

const ResultVisualizer: React.FC<ResultVisualizerProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState('raw');
  const [isLoading, setIsLoading] = useState(false);
  const [visualizations, setVisualizations] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Function to generate visualization suggestions based on the data
  const generateVisualizations = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const generatedVisualizations = analyzDataForVisualization(data);
      
      setVisualizations(generatedVisualizations);
      if (generatedVisualizations.length > 0) {
        setActiveTab('viz');
      }
    } catch (err) {
      setError('Failed to generate visualizations. Please try again.');
      console.error('Visualization generation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to determine what kind of visualizations would be appropriate
  const analyzDataForVisualization = (data: any) => {
    const visualizations = [];
    
    // Check if there are property values by neighborhood
    if (data && data.neighborhoodStats) {
      visualizations.push({
        type: 'barChart',
        title: 'Average Property Values by Neighborhood',
        description: 'Comparing average property values across different neighborhoods',
        data: Object.entries(data.neighborhoodStats).map(([name, stats]: [string, any]) => ({
          name,
          value: parseFloat(stats.avgValue)
        }))
      });
    }
    
    // Check if there are top properties
    if (data && data.topProperties && Array.isArray(data.topProperties)) {
      visualizations.push({
        type: 'table',
        title: 'Top Valued Properties',
        description: 'A list of the highest valued properties in the dataset',
        data: data.topProperties
      });
    }
    
    // Check for geospatial hotspots
    if (data && data.hotspots && Array.isArray(data.hotspots)) {
      visualizations.push({
        type: 'mapVisualization',
        title: 'Property Value Hotspots',
        description: 'Geographic clusters with high property values',
        data: data.hotspots
      });
    }
    
    // Check for property type distribution
    if (data && data.typeDistribution) {
      visualizations.push({
        type: 'pieChart',
        title: 'Property Type Distribution',
        description: 'Distribution of properties by type',
        data: Object.entries(data.typeDistribution).map(([type, percentage]) => ({
          name: type,
          value: typeof percentage === 'string' ? parseFloat(percentage) : percentage as number
        }))
      });
    }
    
    // Check for time series data (yearly stats)
    if (data && data.yearlyStats) {
      visualizations.push({
        type: 'lineChart',
        title: 'Property Value Trends Over Time',
        description: 'Average property values by year',
        data: Object.entries(data.yearlyStats).map(([year, stats]: [string, any]) => ({
          name: year,
          value: parseFloat(stats.avg)
        })).sort((a, b) => parseInt(a.name) - parseInt(b.name))
      });
    }
    
    // Check for location-based data
    if (data && data.locationStats) {
      visualizations.push({
        type: 'advancedBarChart',
        title: 'Property Values by Location',
        description: 'Average property values by location (ZIP code, neighborhood, etc.)',
        data: Object.entries(data.locationStats)
          .filter(([_, stats]: [string, any]) => parseFloat(stats.avgValue) > 0)
          .map(([location, stats]: [string, any]) => ({
            name: location,
            value: parseFloat(stats.avgValue),
            count: stats.count
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10) // Take top 10 locations
      });
    }
    
    // Check for data quality assessment
    if (data && data.overallQualityScore) {
      const fieldsWithIssues = data.fieldsWithMissingData || [];
      visualizations.push({
        type: 'qualityGauge',
        title: 'Data Quality Score',
        description: 'Overall quality score of the property dataset',
        data: {
          score: parseFloat(data.overallQualityScore),
          fieldsWithIssues
        }
      });
    }
    
    return visualizations;
  };

  // Function to generate chart colors
  const generateChartColors = (count: number) => {
    const baseColors = [
      'rgba(59, 130, 246, 0.7)', // blue
      'rgba(16, 185, 129, 0.7)', // green
      'rgba(249, 115, 22, 0.7)', // orange
      'rgba(139, 92, 246, 0.7)', // purple
      'rgba(236, 72, 153, 0.7)', // pink
      'rgba(239, 68, 68, 0.7)',  // red
      'rgba(20, 184, 166, 0.7)', // teal
      'rgba(245, 158, 11, 0.7)', // amber
    ];
    
    const borderColors = baseColors.map(color => color.replace('0.7', '1'));
    
    // If we need more colors than in our base array, we'll generate additional ones
    if (count > baseColors.length) {
      for (let i = baseColors.length; i < count; i++) {
        const r = Math.floor(Math.random() * 200) + 30;
        const g = Math.floor(Math.random() * 200) + 30;
        const b = Math.floor(Math.random() * 200) + 30;
        baseColors.push(`rgba(${r}, ${g}, ${b}, 0.7)`);
        borderColors.push(`rgba(${r}, ${g}, ${b}, 1)`);
      }
    }
    
    return { 
      backgroundColors: baseColors.slice(0, count),
      borderColors: borderColors.slice(0, count)
    };
  };

  // Render visualizations using Chart.js
  const renderVisualization = (viz: any) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    
    // Helper function to format currency
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    };
    
    // Helper function to download chart as image
    const downloadChart = () => {
      if (chartRef.current) {
        const link = document.createElement('a');
        link.download = `${viz.title.replace(/\s+/g, '-').toLowerCase()}.png`;
        link.href = chartRef.current.toDataURL('image/png');
        link.click();
      }
    };
    
    switch (viz.type) {
      case 'barChart': {
        const labels = viz.data.map((item: any) => item.name);
        const values = viz.data.map((item: any) => item.value);
        const { backgroundColors, borderColors } = generateChartColors(labels.length);
        
        const chartData = {
          labels,
          datasets: [
            {
              label: 'Property Value',
              data: values,
              backgroundColor: backgroundColors,
              borderColor: borderColors,
              borderWidth: 1,
            },
          ],
        };
        
        const options = {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              callbacks: {
                label: function(context: any) {
                  return formatCurrency(context.parsed.y);
                }
              }
            }
          },
          scales: {
            y: {
              ticks: {
                callback: function(value: any) {
                  return formatCurrency(value);
                }
              }
            }
          }
        };
        
        return (
          <div className="bg-muted/40 rounded-md p-6 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium">{viz.title}</h3>
                <p className="text-sm text-muted-foreground">{viz.description}</p>
              </div>
              <Button variant="outline" size="sm" onClick={downloadChart} className="flex gap-1">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
            <div className="w-full h-[300px]">
              <Bar ref={chartRef} data={chartData} options={options} />
            </div>
          </div>
        );
      }
      
      case 'pieChart': {
        const labels = viz.data.map((item: any) => item.name);
        const values = viz.data.map((item: any) => item.value);
        const { backgroundColors, borderColors } = generateChartColors(labels.length);
        
        const chartData = {
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: backgroundColors,
              borderColor: borderColors,
              borderWidth: 1,
            },
          ],
        };
        
        const options = {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
            },
            tooltip: {
              callbacks: {
                label: function(context: any) {
                  const value = context.parsed;
                  const label = context.label || '';
                  return `${label}: ${value.toFixed(1)}%`;
                }
              }
            }
          }
        };
        
        return (
          <div className="bg-muted/40 rounded-md p-6 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium">{viz.title}</h3>
                <p className="text-sm text-muted-foreground">{viz.description}</p>
              </div>
              <Button variant="outline" size="sm" onClick={downloadChart} className="flex gap-1">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
            <div className="w-full h-[300px]">
              <Pie ref={chartRef} data={chartData} options={options} />
            </div>
          </div>
        );
      }
      
      case 'lineChart': {
        const labels = viz.data.map((item: any) => item.name);
        const values = viz.data.map((item: any) => item.value);
        
        const chartData = {
          labels,
          datasets: [
            {
              label: 'Average Value',
              data: values,
              borderColor: 'rgba(59, 130, 246, 1)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              fill: true,
              tension: 0.4,
            },
          ],
        };
        
        const options = {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
            },
            tooltip: {
              callbacks: {
                label: function(context: any) {
                  return formatCurrency(context.parsed.y);
                }
              }
            }
          },
          scales: {
            y: {
              ticks: {
                callback: function(value: any) {
                  return formatCurrency(value);
                }
              }
            }
          }
        };
        
        return (
          <div className="bg-muted/40 rounded-md p-6 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium">{viz.title}</h3>
                <p className="text-sm text-muted-foreground">{viz.description}</p>
              </div>
              <Button variant="outline" size="sm" onClick={downloadChart} className="flex gap-1">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
            <div className="w-full h-[300px]">
              <Line ref={chartRef} data={chartData} options={options} />
            </div>
          </div>
        );
      }
      
      case 'advancedBarChart': {
        const labels = viz.data.map((item: any) => item.name);
        const values = viz.data.map((item: any) => item.value);
        const counts = viz.data.map((item: any) => item.count);
        const { backgroundColors, borderColors } = generateChartColors(labels.length);
        
        const chartData = {
          labels,
          datasets: [
            {
              label: 'Average Value',
              data: values,
              backgroundColor: backgroundColors,
              borderColor: borderColors,
              borderWidth: 1,
              yAxisID: 'y',
            },
            {
              label: 'Property Count',
              data: counts,
              backgroundColor: 'rgba(156, 163, 175, 0.5)',
              borderColor: 'rgba(156, 163, 175, 1)',
              borderWidth: 1,
              type: 'line',
              yAxisID: 'y1',
            },
          ],
        };
        
        const options = {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
            },
            tooltip: {
              callbacks: {
                label: function(context: any) {
                  if (context.dataset.label === 'Average Value') {
                    return formatCurrency(context.parsed.y);
                  }
                  return `${context.dataset.label}: ${context.parsed.y}`;
                }
              }
            }
          },
          scales: {
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              ticks: {
                callback: function(value: any) {
                  return formatCurrency(value);
                }
              },
              title: {
                display: true,
                text: 'Average Value'
              }
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              grid: {
                drawOnChartArea: false,
              },
              title: {
                display: true,
                text: 'Property Count'
              }
            },
          }
        };
        
        return (
          <div className="bg-muted/40 rounded-md p-6 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium">{viz.title}</h3>
                <p className="text-sm text-muted-foreground">{viz.description}</p>
              </div>
              <Button variant="outline" size="sm" onClick={downloadChart} className="flex gap-1">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
            <div className="w-full h-[300px]">
              <Bar ref={chartRef} data={chartData} options={options} />
            </div>
          </div>
        );
      }
      
      case 'qualityGauge': {
        // Create a very simple gauge visualization for data quality
        const score = viz.data.score;
        const fieldsWithIssues = viz.data.fieldsWithIssues;
        
        // Determine color based on score
        const getScoreColor = (score: number) => {
          if (score >= 80) return 'bg-green-500';
          if (score >= 60) return 'bg-yellow-500';
          return 'bg-red-500';
        };
        
        return (
          <div className="bg-muted/40 rounded-md p-6 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium">{viz.title}</h3>
                <p className="text-sm text-muted-foreground">{viz.description}</p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-6">
              <div className="relative h-40 w-40 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-muted/50"></div>
                <div 
                  className={`absolute bottom-0 left-0 right-0 ${getScoreColor(score)} rounded-full`}
                  style={{ height: `${score}%` }}
                ></div>
                <div className="absolute inset-2 rounded-full bg-background flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl font-bold">{score}%</div>
                    <div className="text-xs text-muted-foreground">Quality Score</div>
                  </div>
                </div>
              </div>
              
              {fieldsWithIssues.length > 0 && (
                <div className="w-full mt-4">
                  <h4 className="text-sm font-medium mb-2">Fields with data quality issues:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {fieldsWithIssues.map((field: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <Circle className="h-2 w-2 fill-current text-red-500" />
                        <span>{field.field} ({field.percentage}% missing)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }
      
      case 'table':
        return (
          <div className="bg-muted/40 rounded-md p-6 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium">{viz.title}</h3>
                <p className="text-sm text-muted-foreground">{viz.description}</p>
              </div>
            </div>
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-3 text-left font-medium text-sm">Address</th>
                    <th className="py-2 px-3 text-right font-medium text-sm">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {viz.data.map((item: any, index: number) => (
                    <tr key={index} className="border-b border-muted">
                      <td className="py-2 px-3 text-sm">{item.address}</td>
                      <td className="py-2 px-3 text-sm text-right">{item.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
        
      case 'mapVisualization':
        return (
          <div className="bg-muted/40 rounded-md p-6 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium">{viz.title}</h3>
                <p className="text-sm text-muted-foreground">{viz.description}</p>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center gap-4 py-8">
              <Map className="h-16 w-16 text-primary opacity-40" />
              <p className="text-center text-muted-foreground">
                {viz.data.length} hotspot clusters identified
              </p>
              <p className="text-center text-sm text-muted-foreground mt-2">
                Map visualization requires GIS integration
              </p>
            </div>
          </div>
        );
        
      default:
        return (
          <div className="bg-muted/40 rounded-md p-6 flex items-center justify-center">
            <p className="text-muted-foreground">Unsupported visualization type: {viz.type}</p>
          </div>
        );
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted px-6 py-4 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Analysis Results</CardTitle>
          <CardDescription>
            {visualizations.length > 0 ? 
              `${visualizations.length} visualization${visualizations.length !== 1 ? 's' : ''} available` : 
              'View results and generate visualizations'
            }
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={generateVisualizations}
          disabled={isLoading || !data}
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <BarChart2 className="h-4 w-4 mr-2" />
              Visualize
            </>
          )}
        </Button>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="px-6 pt-2 border-b">
          <TabsList>
            <TabsTrigger value="raw">
              <TableIcon className="h-4 w-4 mr-2" />
              Raw Data
            </TabsTrigger>
            <TabsTrigger value="viz" disabled={visualizations.length === 0}>
              <BarChart2 className="h-4 w-4 mr-2" />
              Visualizations
              {visualizations.length > 0 && (
                <Badge className="ml-2 bg-primary/20 text-primary border-primary/20 hover:bg-primary/30" variant="outline">
                  {visualizations.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>
        
        <CardContent className="p-0">
          <TabsContent value="raw" className="m-0">
            <div className="p-6 overflow-auto max-h-[500px]">
              <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(data, null, 2)}</pre>
            </div>
          </TabsContent>
          
          <TabsContent value="viz" className="m-0">
            {error ? (
              <div className="p-6 flex items-start gap-2 text-red-600 bg-red-50">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {visualizations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Click "Visualize" to generate visualizations from your data</p>
                  </div>
                ) : (
                  visualizations.map((viz, index) => (
                    <React.Fragment key={index}>
                      {index > 0 && <div className="my-6 border-t border-border" />}
                      {renderVisualization(viz)}
                    </React.Fragment>
                  ))
                )}
              </div>
            )}
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
};

// Helper component for map visualization
function Map(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" x2="9" y1="3" y2="18" />
      <line x1="15" x2="15" y1="6" y2="21" />
    </svg>
  );
}

export default ResultVisualizer;