import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  BarChart2, 
  TrendingUp, 
  Map, 
  Calendar,
  SlidersHorizontal
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

interface KPIConfigPanelProps {
  config: {
    visibleCards: {
      valuationMetrics: boolean;
      marketTrend: boolean;
      regionalPerformance: boolean;
      valueChange: boolean;
    };
    timePeriod: string;
  };
  onConfigChange: (config: {
    visibleCards: {
      valuationMetrics: boolean;
      marketTrend: boolean;
      regionalPerformance: boolean;
      valueChange: boolean;
    };
    timePeriod: string;
  }) => void;
  className?: string;
}

/**
 * Configuration panel for KPI dashboard
 */
export const KPIConfigPanel: React.FC<KPIConfigPanelProps> = ({
  config,
  onConfigChange,
  className = ''
}) => {
  // Handler for toggling card visibility
  const handleToggleCard = (cardName: keyof typeof config.visibleCards) => {
    onConfigChange({
      ...config,
      visibleCards: {
        ...config.visibleCards,
        [cardName]: !config.visibleCards[cardName]
      }
    });
  };
  
  // Handler for changing time period
  const handleTimePeriodChange = (value: string) => {
    onConfigChange({
      ...config,
      timePeriod: value
    });
  };
  
  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Dashboard Configuration</CardTitle>
            <CardDescription>Customize your KPI view</CardDescription>
          </div>
          <SlidersHorizontal className="h-5 w-5 text-primary opacity-70" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-3">Visible Components</h3>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BarChart2 className="h-4 w-4 text-primary" />
                  <Label htmlFor="show-valuation-metrics" className="cursor-pointer">
                    Valuation Metrics
                  </Label>
                </div>
                <Switch
                  id="show-valuation-metrics"
                  checked={config.visibleCards.valuationMetrics}
                  onCheckedChange={() => handleToggleCard('valuationMetrics')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <Label htmlFor="show-market-trend" className="cursor-pointer">
                    Market Trend
                  </Label>
                </div>
                <Switch
                  id="show-market-trend"
                  checked={config.visibleCards.marketTrend}
                  onCheckedChange={() => handleToggleCard('marketTrend')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Map className="h-4 w-4 text-primary" />
                  <Label htmlFor="show-regional-performance" className="cursor-pointer">
                    Regional Performance
                  </Label>
                </div>
                <Switch
                  id="show-regional-performance"
                  checked={config.visibleCards.regionalPerformance}
                  onCheckedChange={() => handleToggleCard('regionalPerformance')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <Label htmlFor="show-value-change" className="cursor-pointer">
                    Value Change
                  </Label>
                </div>
                <Switch
                  id="show-value-change"
                  checked={config.visibleCards.valueChange}
                  onCheckedChange={() => handleToggleCard('valueChange')}
                />
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="text-sm font-medium mb-3">Time Period</h3>
            <Select 
              value={config.timePeriod} 
              onValueChange={handleTimePeriodChange}
            >
              <SelectTrigger className="w-full" aria-label="time period">
                <SelectValue placeholder="Select time period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yearly">Yearly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};