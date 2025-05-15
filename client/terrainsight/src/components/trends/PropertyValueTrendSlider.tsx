import React, { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Calendar, DollarSign, Play, Pause, SkipBack } from 'lucide-react';
import { Property } from '@shared/schema';

interface PropertyValueTrendSliderProps {
  properties: Property[];
  years: string[];
  onYearChange: (year: string) => void;
  className?: string;
}

export const PropertyValueTrendSlider: React.FC<PropertyValueTrendSliderProps> = ({
  properties,
  years,
  onYearChange,
  className = ''
}) => {
  const [sliderValue, setSliderValue] = useState<number>(years.length - 1); // Start with most recent year
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1000); // milliseconds between frames
  
  // Convert slider value to year
  const currentYear = years[sliderValue];
  
  // Animation effect
  useEffect(() => {
    let animationInterval: NodeJS.Timeout | null = null;
    
    if (isPlaying) {
      animationInterval = setInterval(() => {
        setSliderValue(prev => {
          // If we reached the end, go back to start
          if (prev >= years.length - 1) {
            return 0;
          }
          return prev + 1;
        });
      }, playbackSpeed);
    }
    
    // Cleanup function
    return () => {
      if (animationInterval) {
        clearInterval(animationInterval);
      }
    };
  }, [isPlaying, playbackSpeed, years.length]);
  
  // Effect to call onYearChange when slider changes
  useEffect(() => {
    onYearChange(currentYear);
  }, [currentYear, onYearChange]);
  
  // Calculate average property value for the current year
  const calculateAverageValue = () => {
    if (!properties || properties.length === 0) return '0';
    
    // For demo purposes, generate a value that changes by year
    // In a real application, this would use actual property data for each year
    const baseValue = 250000;
    const yearIndex = years.indexOf(currentYear);
    const growth = 1 + (yearIndex * 0.05); // 5% growth per year
    
    return (baseValue * growth).toLocaleString('en-US', { 
      style: 'currency', 
      currency: 'USD',
      maximumFractionDigits: 0
    });
  };
  
  const handleSliderChange = (value: number[]) => {
    setSliderValue(value[0]);
  };
  
  const handlePlayToggle = () => {
    setIsPlaying(!isPlaying);
  };
  
  const handleReset = () => {
    setSliderValue(0);
    setIsPlaying(false);
  };
  
  return (
    <div className={`border border-neutral-200 rounded-lg bg-white p-4 shadow-md hover:shadow-lg transition-all duration-300 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="bg-primary/10 p-1.5 rounded-md mr-2 shadow-sm">
            <Calendar className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-base font-medium text-gray-900">Property Value Trends</h3>
        </div>
        <div className="flex items-center gap-1 text-sm font-medium bg-gray-100 px-2 py-1 rounded-full shadow-sm">
          <span className="text-gray-700">{years[0]}</span>
          <span className="text-gray-400 mx-0.5">—</span>
          <span className="text-gray-700">{years[years.length - 1]}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-4 mb-6 p-3 bg-gradient-to-br from-white to-gray-50 rounded-lg border border-gray-100 shadow-sm">
        <div className="flex items-center justify-center bg-primary/10 p-2 rounded-full shadow-sm">
          <DollarSign className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-grow">
          <p className="text-sm text-gray-600 mb-1">Average Property Value</p>
          <p className="text-2xl font-bold text-primary drop-shadow-sm">{calculateAverageValue()}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4 mb-6 p-3 rounded-lg">
        <Button 
          variant="outline" 
          size="icon"
          className="h-9 w-9 rounded-full shadow-sm hover:shadow transition-all duration-200 bg-white hover:bg-gray-50 hover:-translate-y-0.5"
          onClick={handleReset}
        >
          <SkipBack className="h-4 w-4" />
        </Button>
        
        <Button 
          variant={isPlaying ? "default" : "outline"}
          size="icon"
          className={`h-9 w-9 rounded-full shadow-sm hover:shadow transition-all duration-200 hover:-translate-y-0.5 ${isPlaying ? 'bg-primary text-white' : 'bg-white hover:bg-gray-50'}`}
          onClick={handlePlayToggle}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        
        <div className="px-4 py-1.5 bg-gray-100 rounded-full text-base font-medium text-gray-900 shadow-sm">
          {currentYear}
        </div>
      </div>
      
      <div className="px-1">
        <Slider
          value={[sliderValue]}
          min={0}
          max={years.length - 1}
          step={1}
          onValueChange={handleSliderChange}
          className="mt-2"
        />
      </div>
      
      <div className="flex justify-between mt-2">
        {years.map((year, index) => {
          // Only show a subset of years to avoid overcrowding
          if (years.length <= 5 || index === 0 || index === years.length - 1 || index % Math.ceil(years.length / 5) === 0) {
            return (
              <span 
                key={year} 
                className="text-xs text-gray-500"
                style={{ 
                  position: 'relative', 
                  left: `${(index / (years.length - 1)) * 100}%`,
                  transform: 'translateX(-50%)'
                }}
              >
                {year}
              </span>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};