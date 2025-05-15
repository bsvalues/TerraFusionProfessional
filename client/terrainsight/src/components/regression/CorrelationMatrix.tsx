import React, { useState } from 'react';
import { Property } from '@shared/schema';
import { generateCorrelationMatrix, chartTheme } from '@/services/chartService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface CorrelationMatrixProps {
  properties: Property[];
  availableVariables: string[];
  className?: string;
}

export function CorrelationMatrix({ properties, availableVariables, className }: CorrelationMatrixProps) {
  const [selectedVariables, setSelectedVariables] = useState<string[]>(
    availableVariables.slice(0, Math.min(7, availableVariables.length))
  );
  
  // Calculate correlation matrix data
  const correlationData = generateCorrelationMatrix(properties, selectedVariables);
  
  // Get the correlation value between two variables
  const getCorrelation = (xVar: string, yVar: string) => {
    const cell = correlationData.find(
      cell => cell.xVariable === xVar && cell.yVariable === yVar
    );
    return cell ? cell.correlation : 0;
  };
  
  // Get color for correlation value
  const getCorrelationColor = (correlation: number) => {
    // Use a diverging color scale: blue for negative, red for positive
    if (correlation === 0) return '#f5f5f5'; // Light gray for no correlation
    
    const absCorrelation = Math.abs(correlation);
    const intensity = Math.min(255, Math.round(absCorrelation * 255));
    
    if (correlation > 0) {
      // Positive correlation: blue scale
      return `rgb(${255 - intensity}, ${255 - intensity}, 255)`;
    } else {
      // Negative correlation: red scale
      return `rgb(255, ${255 - intensity}, ${255 - intensity})`;
    }
  };
  
  const handleVariableToggle = (variable: string) => {
    if (selectedVariables.includes(variable)) {
      setSelectedVariables(selectedVariables.filter(v => v !== variable));
    } else {
      setSelectedVariables([...selectedVariables, variable]);
    }
  };
  
  // Sort variables alphabetically
  const sortedVariables = [...selectedVariables].sort();
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-base">Correlation Matrix</CardTitle>
            <CardDescription>
              Shows relationships between variables
            </CardDescription>
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <button className="text-sm font-medium underline">
                Select Variables ({selectedVariables.length})
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <Label className="font-medium mb-2">Variables to include:</Label>
              <ScrollArea className="h-80 pr-4">
                <div className="space-y-2">
                  {availableVariables.map(variable => (
                    <div key={variable} className="flex items-center space-x-2">
                      <Checkbox
                        id={`var-${variable}`}
                        checked={selectedVariables.includes(variable)}
                        onCheckedChange={() => handleVariableToggle(variable)}
                      />
                      <Label htmlFor={`var-${variable}`}>{variable}</Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      
      <CardContent>
        {selectedVariables.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-center text-muted-foreground">
            <p>Select at least one variable to display the correlation matrix</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: `80px repeat(${sortedVariables.length}, minmax(60px, 1fr))`,
                minWidth: `${80 + sortedVariables.length * 60}px`
              }}
            >
              {/* Empty corner cell */}
              <div className="p-2 font-medium text-right"></div>
              
              {/* Column headers */}
              {sortedVariables.map(variable => (
                <div 
                  key={`col-${variable}`} 
                  className="p-2 text-center font-medium"
                  style={{ maxWidth: '120px' }}
                >
                  {variable}
                </div>
              ))}
              
              {/* Rows */}
              {sortedVariables.map(yVariable => (
                <React.Fragment key={`row-${yVariable}`}>
                  {/* Row header */}
                  <div 
                    className="p-2 font-medium text-right"
                    style={{ maxWidth: '80px' }}
                  >
                    {yVariable}
                  </div>
                  
                  {/* Cells */}
                  {sortedVariables.map(xVariable => {
                    const correlation = getCorrelation(xVariable, yVariable);
                    return (
                      <div 
                        key={`${xVariable}-${yVariable}`}
                        className="p-2 text-center correlation-cell"
                        title={`${xVariable} vs ${yVariable}: ${correlation.toFixed(3)}`}
                        style={{
                          backgroundColor: getCorrelationColor(correlation),
                          color: Math.abs(correlation) > 0.6 ? 'white' : 'black',
                          cursor: 'help'
                        }}
                      >
                        {correlation.toFixed(2)}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
            
            {/* Legend */}
            <div className="mt-4 flex justify-center items-center color-legend">
              <div className="flex items-center space-x-1">
                <div style={{ 
                  width: '20px', 
                  height: '20px', 
                  backgroundColor: getCorrelationColor(-1) 
                }}></div>
                <span className="text-xs">-1.0</span>
              </div>
              
              <div className="w-40 h-4 mx-2" style={{ 
                background: 'linear-gradient(to right, rgb(255, 0, 0), rgb(245, 245, 245), rgb(0, 0, 255))' 
              }}></div>
              
              <div className="flex items-center space-x-1">
                <span className="text-xs">+1.0</span>
                <div style={{ 
                  width: '20px', 
                  height: '20px', 
                  backgroundColor: getCorrelationColor(1) 
                }}></div>
              </div>
            </div>
            
            <div className="mt-2 text-sm text-muted-foreground text-center">
              <p>
                Correlation ranges from -1 (perfect negative) to +1 (perfect positive).
                Values close to 0 indicate little to no linear relationship.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}