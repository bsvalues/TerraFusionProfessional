/**
 * DCFAnalyzer.tsx
 * 
 * Component for performing Discounted Cash Flow analysis on income properties
 * Supports detailed projection of future cash flows and property valuations
 */

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { toast } from '@/hooks/use-toast';
import { 
  Calculator, 
  RefreshCw
} from 'lucide-react';

import { 
  IncomeProperty, 
  DCFAnalysis
} from '../../services/income/IncomeApproachTypes';
import { incomeApproachService } from '../../services/income/IncomeApproachService';

interface DCFAnalyzerProps {
  property?: IncomeProperty;
  onAnalysisComplete?: (analysis: DCFAnalysis) => void;
}

export const DCFAnalyzer: React.FC<DCFAnalyzerProps> = ({ 
  property,
  onAnalysisComplete
}) => {
  // Analysis parameters
  const [analysisPeriod, setAnalysisPeriod] = useState(10);
  const [discountRate, setDiscountRate] = useState(0.10);
  const [terminalCapRate, setTerminalCapRate] = useState(0.08);
  const [incomeGrowthRate, setIncomeGrowthRate] = useState(0.02);
  const [expenseGrowthRate, setExpenseGrowthRate] = useState(0.03);
  
  // Analysis results
  const [analysis, setAnalysis] = useState<DCFAnalysis | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  
  // Reset analysis when property changes
  useEffect(() => {
    setAnalysis(null);
  }, [property]);
  
  // Format currency values
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Format percentage values
  const formatPercent = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  const handleRunAnalysis = () => {
    if (!property) {
      toast({
        title: "No property selected",
        description: "Please select a property to analyze",
        variant: "destructive",
      });
      return;
    }
    
    setIsCalculating(true);
    
    try {
      const dcfAnalysis = incomeApproachService.performDCFAnalysis(
        property,
        analysisPeriod,
        discountRate,
        terminalCapRate,
        incomeGrowthRate,
        expenseGrowthRate
      );
      
      setAnalysis(dcfAnalysis);
      
      if (onAnalysisComplete) {
        onAnalysisComplete(dcfAnalysis);
      }
      
      toast({
        title: "Analysis complete",
        description: "DCF analysis has been calculated successfully",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error performing analysis",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calculator className="mr-2 h-5 w-5" />
          Discounted Cash Flow Analysis
        </CardTitle>
        <CardDescription>
          Project future cash flows and determine property value
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!property ? (
          <div className="text-center py-8 text-muted-foreground">
            Select a property to perform DCF analysis
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Analysis Parameters</h3>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="analysisPeriod">Analysis Period (Years): {analysisPeriod}</Label>
                    <span className="text-sm text-muted-foreground">{analysisPeriod} years</span>
                  </div>
                  <Slider
                    id="analysisPeriod"
                    min={5}
                    max={30}
                    step={1}
                    value={[analysisPeriod]}
                    onValueChange={(value) => setAnalysisPeriod(value[0])}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="discountRate">Discount Rate: {formatPercent(discountRate)}</Label>
                    <span className="text-sm text-muted-foreground">{formatPercent(discountRate)}</span>
                  </div>
                  <Slider
                    id="discountRate"
                    min={0.05}
                    max={0.25}
                    step={0.005}
                    value={[discountRate]}
                    onValueChange={(value) => setDiscountRate(value[0])}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="terminalCapRate">Terminal Cap Rate: {formatPercent(terminalCapRate)}</Label>
                    <span className="text-sm text-muted-foreground">{formatPercent(terminalCapRate)}</span>
                  </div>
                  <Slider
                    id="terminalCapRate"
                    min={0.04}
                    max={0.12}
                    step={0.0025}
                    value={[terminalCapRate]}
                    onValueChange={(value) => setTerminalCapRate(value[0])}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="incomeGrowthRate">Income Growth Rate: {formatPercent(incomeGrowthRate)}</Label>
                    <span className="text-sm text-muted-foreground">{formatPercent(incomeGrowthRate)}</span>
                  </div>
                  <Slider
                    id="incomeGrowthRate"
                    min={0}
                    max={0.1}
                    step={0.0025}
                    value={[incomeGrowthRate]}
                    onValueChange={(value) => setIncomeGrowthRate(value[0])}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="expenseGrowthRate">Expense Growth Rate: {formatPercent(expenseGrowthRate)}</Label>
                    <span className="text-sm text-muted-foreground">{formatPercent(expenseGrowthRate)}</span>
                  </div>
                  <Slider
                    id="expenseGrowthRate"
                    min={0}
                    max={0.1}
                    step={0.0025}
                    value={[expenseGrowthRate]}
                    onValueChange={(value) => setExpenseGrowthRate(value[0])}
                  />
                </div>
                
                <Button 
                  className="w-full mt-4" 
                  onClick={handleRunAnalysis}
                  disabled={isCalculating}
                >
                  {isCalculating ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <Calculator className="mr-2 h-4 w-4" />
                      Run DCF Analysis
                    </>
                  )}
                </Button>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Analysis Results</h3>
                
                {analysis ? (
                  <>
                    <div>
                      <Table>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">Net Present Value</TableCell>
                            <TableCell className="text-right font-bold">
                              {formatCurrency(analysis.netPresentValue)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Present Value of Cash Flows</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(analysis.presentValueOfCashFlows)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Present Value of Terminal Value</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(analysis.presentValueOfTerminalValue)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Terminal Value</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(analysis.terminalValue)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Internal Rate of Return</TableCell>
                            <TableCell className="text-right">
                              {analysis.internalRateOfReturn 
                                ? formatPercent(analysis.internalRateOfReturn) 
                                : 'N/A'}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                    
                    <div>
                      <h4 className="text-md font-medium mb-2">Annual Cash Flows</h4>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Year</TableHead>
                              <TableHead className="text-right">Cash Flow</TableHead>
                              <TableHead className="text-right">Present Value</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {analysis.cashFlows.map((cashFlow, index) => (
                              <TableRow key={index}>
                                <TableCell>Year {index + 1}</TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(cashFlow)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(cashFlow / Math.pow(1 + analysis.discountRate, index + 1))}
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow>
                              <TableCell className="font-medium">Terminal</TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(analysis.terminalValue)}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(analysis.presentValueOfTerminalValue)}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-16 text-muted-foreground">
                    Run the analysis to see detailed projections
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DCFAnalyzer;