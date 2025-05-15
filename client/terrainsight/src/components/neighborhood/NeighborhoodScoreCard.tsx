import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Settings, FileDown, Sliders, PenLine, Info } from 'lucide-react';
import { NeighborhoodTimeline } from '../../services/neighborhoodComparisonReportService';

interface ScoreMetric {
  id: string;
  name: string;
  value: number;
  weight: number;
  description: string;
  color?: string;
}

interface NeighborhoodScore {
  neighborhoodId: string;
  neighborhoodName: string;
  metrics: ScoreMetric[];
  totalScore: number;
}

interface NeighborhoodScoreCardProps {
  neighborhoods: NeighborhoodTimeline[];
  selectedNeighborhoods: string[];
  className?: string;
}

// Generate color based on score (1-10)
const getScoreColor = (score: number): string => {
  // Red to yellow to green gradient
  if (score < 4) {
    return `rgb(255, ${Math.round(score * 60)}, 0)`; // Red to orange
  } else if (score < 7) {
    return `rgb(${Math.round(255 - (score - 4) * 60)}, 255, 0)`; // Orange to yellow to green
  } else {
    return `rgb(0, 255, ${Math.round((10 - score) * 36)})`; // Green to bright green
  }
};

export const NeighborhoodScoreCard: React.FC<NeighborhoodScoreCardProps> = ({
  neighborhoods,
  selectedNeighborhoods,
  className = ''
}) => {
  // Define default metrics
  const defaultMetrics: ScoreMetric[] = [
    { id: 'value', name: 'Property Value', value: 0, weight: 1, description: 'Average property value in the neighborhood' },
    { id: 'growth', name: 'Growth Rate', value: 0, weight: 1, description: 'Annual property value growth rate' },
    { id: 'schools', name: 'School Quality', value: 0, weight: 1, description: 'Rating of local schools and educational facilities' },
    { id: 'safety', name: 'Safety Rating', value: 0, weight: 1, description: 'Crime rates and overall safety measures' },
    { id: 'amenities', name: 'Amenities', value: 0, weight: 1, description: 'Proximity to shopping, restaurants, and services' },
    { id: 'transport', name: 'Transportation', value: 0, weight: 1, description: 'Access to public transit and major roadways' }
  ];

  // State for metrics and visualization settings
  const [metrics, setMetrics] = useState<ScoreMetric[]>(defaultMetrics);
  const [displayType, setDisplayType] = useState<'card' | 'radar' | 'bar'>('card');
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [neighborhoodScores, setNeighborhoodScores] = useState<NeighborhoodScore[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Filter neighborhoods based on selection
  const filteredNeighborhoods = neighborhoods.filter(n => 
    selectedNeighborhoods.includes(n.id)
  );

  // Calculate scores for each neighborhood (would normally use real data)
  React.useEffect(() => {
    // In a real implementation, this would pull data from an API or database
    const scores = filteredNeighborhoods.map(neighborhood => {
      // Simulate different scores for each neighborhood
      const neighborhoodMetrics = metrics.map(metric => {
        // In a real app, these values would come from actual data
        // Here we're using a random value between 4-9 as a placeholder
        const baseValue = 4 + Math.random() * 5;
        
        return {
          ...metric,
          value: parseFloat(baseValue.toFixed(1)),
          color: getScoreColor(baseValue)
        };
      });
      
      // Calculate total score based on weights
      const totalWeight = neighborhoodMetrics.reduce((sum, m) => sum + m.weight, 0);
      const totalScore = neighborhoodMetrics.reduce(
        (sum, m) => sum + (m.value * m.weight), 0
      ) / (totalWeight || 1);
      
      return {
        neighborhoodId: neighborhood.id,
        neighborhoodName: neighborhood.name,
        metrics: neighborhoodMetrics,
        totalScore: parseFloat(totalScore.toFixed(1))
      };
    });
    
    setNeighborhoodScores(scores);
  }, [filteredNeighborhoods, metrics]);

  // Update metric weight
  const handleWeightChange = (metricId: string, weight: number) => {
    setMetrics(metrics.map(m => 
      m.id === metricId ? { ...m, weight } : m
    ));
  };

  // Export score card as CSV
  const exportScoreCard = () => {
    // Create CSV content
    let csv = 'Neighborhood,Total Score';
    metrics.forEach(metric => {
      csv += `,${metric.name}`;
    });
    csv += '\n';
    
    neighborhoodScores.forEach(score => {
      csv += `"${score.neighborhoodName}",${score.totalScore}`;
      score.metrics.forEach(metric => {
        csv += `,${metric.value}`;
      });
      csv += '\n';
    });
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `neighborhood-scorecard-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset all metrics to default values
  const resetAllMetrics = () => {
    setMetrics(defaultMetrics);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Neighborhood Score Card</h2>
        
        <div className="flex space-x-2">
          <ToggleGroup type="single" value={displayType} onValueChange={(value) => value && setDisplayType(value as any)}>
            <ToggleGroupItem value="card" size="sm">Card</ToggleGroupItem>
            <ToggleGroupItem value="radar" size="sm">Radar</ToggleGroupItem>
            <ToggleGroupItem value="bar" size="sm">Bar</ToggleGroupItem>
          </ToggleGroup>
          
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" data-testid="settings-button">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Customize Score Card</DialogTitle>
              </DialogHeader>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-sm">Metrics & Weights</h3>
                  
                  {metrics.map((metric) => (
                    <div key={metric.id} className="bg-gray-50 p-3 rounded-md">
                      <div className="flex justify-between items-center mb-2">
                        <Label className="font-medium">{metric.name}</Label>
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <span>Weight:</span>
                          <Select
                            value={metric.weight.toString()}
                            onValueChange={(value) => handleWeightChange(metric.id, parseFloat(value))}
                          >
                            <SelectTrigger className="w-16 h-7">
                              <SelectValue placeholder="1" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0.5">0.5</SelectItem>
                              <SelectItem value="1">1</SelectItem>
                              <SelectItem value="1.5">1.5</SelectItem>
                              <SelectItem value="2">2</SelectItem>
                              <SelectItem value="2.5">2.5</SelectItem>
                              <SelectItem value="3">3</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-500 mb-2">{metric.description}</p>
                    </div>
                  ))}
                  
                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    onClick={resetAllMetrics}
                  >
                    Reset to Default Weights
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-medium text-sm">Display Settings</h3>
                  
                  <div className="bg-gray-50 p-3 rounded-md">
                    <Label className="font-medium mb-2 block">Visualization Type</Label>
                    <ToggleGroup 
                      type="single" 
                      value={displayType} 
                      onValueChange={(value) => value && setDisplayType(value as any)}
                      className="justify-start"
                    >
                      <ToggleGroupItem value="card">Card</ToggleGroupItem>
                      <ToggleGroupItem value="radar">Radar</ToggleGroupItem>
                      <ToggleGroupItem value="bar">Bar</ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-md">
                    <Label className="font-medium mb-2 block">Color Scheme</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {[1, 3, 5, 7, 9].map(score => (
                        <div 
                          key={score}
                          className="w-full h-8 rounded-md flex items-center justify-center text-xs font-medium text-white"
                          style={{ backgroundColor: getScoreColor(score) }}
                        >
                          {score}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Color gradient based on score (1-10)
                    </p>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4"
                    onClick={exportScoreCard}
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Export Score Card Data
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {selectedNeighborhoods.length === 0 ? (
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border">
          <div className="text-center p-6">
            <div className="bg-primary/10 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <Info className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-medium mb-1">No Neighborhoods Selected</h3>
            <p className="text-sm text-gray-500">
              Select neighborhoods on the map to view their score cards.
            </p>
          </div>
        </div>
      ) : displayType === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {neighborhoodScores.map(score => (
            <Card key={score.neighborhoodId} className="overflow-hidden">
              <div className="bg-primary text-primary-foreground p-4 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold">{score.neighborhoodName}</h3>
                  <p className="text-sm opacity-90">Overall Score</p>
                </div>
                <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center">
                  <span 
                    className="text-2xl font-bold"
                    style={{ color: getScoreColor(score.totalScore) }}
                  >
                    {score.totalScore}
                  </span>
                </div>
              </div>
              
              <CardContent className="p-4">
                <div className="space-y-3">
                  {score.metrics.map(metric => (
                    <div key={metric.id} className="space-y-1">
                      <div className="flex justify-between items-center text-sm">
                        <span>{metric.name}</span>
                        <span 
                          className="font-bold"
                          style={{ color: metric.color }}
                        >
                          {metric.value}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full"
                          style={{ 
                            width: `${metric.value * 10}%`, 
                            backgroundColor: metric.color 
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : displayType === 'radar' ? (
        <div className="h-96 bg-white p-4 rounded-lg flex items-center justify-center border">
          <div className="text-center text-gray-500">
            <Sliders className="h-8 w-8 mx-auto mb-2" />
            <p>Radar chart visualization would display here.</p>
            <p className="text-sm">This would show a radar/spider chart comparing metrics across neighborhoods.</p>
          </div>
        </div>
      ) : (
        <div className="h-96 bg-white p-4 rounded-lg flex items-center justify-center border">
          <div className="text-center text-gray-500">
            <Sliders className="h-8 w-8 mx-auto mb-2" />
            <p>Bar chart visualization would display here.</p>
            <p className="text-sm">This would show a grouped bar chart comparing each metric across neighborhoods.</p>
          </div>
        </div>
      )}
    </div>
  );
};