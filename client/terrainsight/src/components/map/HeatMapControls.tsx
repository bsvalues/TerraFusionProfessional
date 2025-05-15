import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Info, BarChart, ChevronDown } from "lucide-react";
import { HeatMapSettings, MarketTrendMetric } from './HeatMapLayer';
import { Badge } from "@/components/ui/badge";

interface HeatMapControlsProps {
  settings: HeatMapSettings;
  onSettingsChange: (settings: Partial<HeatMapSettings>) => void;
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

// Predefined color gradients
const colorGradients = {
  default: { 0.4: 'blue', 0.6: 'lime', 0.8: 'yellow', 1.0: 'red' },
  valueChange: { 0: 'blue', 0.4: 'cyan', 0.5: 'lime', 0.7: 'yellow', 1.0: 'red' },
  heatOnly: { 0.4: 'yellow', 0.6: 'orange', 0.8: 'orangered', 1.0: 'red' },
  cool: { 0.4: 'cyan', 0.6: 'blue', 0.8: 'darkblue', 1.0: 'purple' }
};

export const HeatMapControls: React.FC<HeatMapControlsProps> = ({
  settings,
  onSettingsChange,
  isEnabled,
  onToggle
}) => {
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg flex items-center">
              <BarChart className="h-4 w-4 mr-2" />
              Heat Map Layer
            </CardTitle>
            <CardDescription>
              Configure heat map visualization
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="heat-map-toggle" className="text-sm">Enabled</Label>
            <Switch 
              id="heat-map-toggle" 
              checked={isEnabled}
              onCheckedChange={onToggle}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className={isEnabled ? "" : "opacity-50 pointer-events-none"}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="metric-select" className="text-sm font-medium mb-1 block">Data Metric</Label>
            <Select
              value={settings.metric}
              onValueChange={(value) => onSettingsChange({ metric: value as MarketTrendMetric })}
              disabled={!isEnabled}
            >
              <SelectTrigger id="metric-select" className="w-full">
                <SelectValue placeholder="Select metric" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="value">Property Value</SelectItem>
                <SelectItem value="pricePerSqFt">Price per Sq Ft</SelectItem>
                <SelectItem value="salesVolume">Sales Volume</SelectItem>
                <SelectItem value="valueChange">Value Change %</SelectItem>
                <SelectItem value="daysOnMarket">Days on Market</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="mt-1">
              {settings.metric === 'value' && (
                <Badge variant="outline" className="text-xs">Shows concentration of property values</Badge>
              )}
              {settings.metric === 'pricePerSqFt' && (
                <Badge variant="outline" className="text-xs">Shows price per square foot density</Badge>
              )}
              {settings.metric === 'salesVolume' && (
                <Badge variant="outline" className="text-xs">Shows areas with high sales activity</Badge>
              )}
              {settings.metric === 'valueChange' && (
                <Badge variant="outline" className="text-xs">Shows areas with increasing/decreasing values</Badge>
              )}
              {settings.metric === 'daysOnMarket' && (
                <Badge variant="outline" className="text-xs">Shows areas with quick/slow sales</Badge>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="radius-slider" className="text-sm font-medium">Heat Radius</Label>
              <span className="text-xs text-muted-foreground">{settings.radius}px</span>
            </div>
            <Slider
              id="radius-slider"
              value={[settings.radius]}
              min={10}
              max={50}
              step={1}
              onValueChange={(values) => onSettingsChange({ radius: values[0] })}
              disabled={!isEnabled}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="blur-slider" className="text-sm font-medium">Blur Amount</Label>
              <span className="text-xs text-muted-foreground">{settings.blur}px</span>
            </div>
            <Slider
              id="blur-slider"
              value={[settings.blur]}
              min={5}
              max={25}
              step={1}
              onValueChange={(values) => onSettingsChange({ blur: values[0] })}
              disabled={!isEnabled}
            />
          </div>
          
          <div>
            <Label className="text-sm font-medium mb-1 block">Color Gradient</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant={JSON.stringify(settings.gradient) === JSON.stringify(colorGradients.default) ? "default" : "outline"} 
                size="sm"
                className="justify-start"
                onClick={() => onSettingsChange({ gradient: colorGradients.default })}
                disabled={!isEnabled}
              >
                <div className="w-8 h-4 rounded-sm mr-2 bg-gradient-to-r from-blue via-lime via-yellow to-red"></div>
                Default
              </Button>
              
              <Button 
                variant={JSON.stringify(settings.gradient) === JSON.stringify(colorGradients.valueChange) ? "default" : "outline"} 
                size="sm"
                className="justify-start"
                onClick={() => onSettingsChange({ gradient: colorGradients.valueChange })}
                disabled={!isEnabled}
              >
                <div className="w-8 h-4 rounded-sm mr-2 bg-gradient-to-r from-blue via-cyan via-lime via-yellow to-red"></div>
                Value Change
              </Button>
              
              <Button 
                variant={JSON.stringify(settings.gradient) === JSON.stringify(colorGradients.heatOnly) ? "default" : "outline"} 
                size="sm"
                className="justify-start"
                onClick={() => onSettingsChange({ gradient: colorGradients.heatOnly })}
                disabled={!isEnabled}
              >
                <div className="w-8 h-4 rounded-sm mr-2 bg-gradient-to-r from-yellow via-orange via-orange-600 to-red"></div>
                Heat Only
              </Button>
              
              <Button 
                variant={JSON.stringify(settings.gradient) === JSON.stringify(colorGradients.cool) ? "default" : "outline"} 
                size="sm"
                className="justify-start"
                onClick={() => onSettingsChange({ gradient: colorGradients.cool })}
                disabled={!isEnabled}
              >
                <div className="w-8 h-4 rounded-sm mr-2 bg-gradient-to-r from-cyan via-blue via-indigo to-purple-800"></div>
                Cool
              </Button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 pt-2">
            <Switch
              id="show-legend"
              checked={settings.showLegend}
              onCheckedChange={(checked) => onSettingsChange({ showLegend: checked })}
              disabled={!isEnabled}
            />
            <div>
              <Label htmlFor="show-legend" className="text-sm font-medium">Show Legend</Label>
              <p className="text-xs text-muted-foreground">Display color scale on map</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HeatMapControls;