import React from 'react';
import { RegressionModel } from '@/services/regressionService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Info, Check, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ModelDiagnosticsProps {
  model: RegressionModel;
}

export function ModelDiagnostics({ model }: ModelDiagnosticsProps) {
  // Helper function to generate residual histogram data
  const generateHistogramData = () => {
    const residuals = model.residuals;
    const min = Math.min(...residuals);
    const max = Math.max(...residuals);
    const range = max - min;
    const binWidth = range / 15; // 15 bins
    
    const bins = Array(15).fill(0);
    
    residuals.forEach(residual => {
      const binIndex = Math.min(14, Math.floor((residual - min) / binWidth));
      bins[binIndex]++;
    });
    
    // Normalize bin heights
    const maxBinHeight = Math.max(...bins);
    const normalizedBins = bins.map(count => count / maxBinHeight * 100);
    
    return {
      bins: normalizedBins,
      binLabels: Array(15).fill(0).map((_, i) => (min + binWidth * i).toFixed(0)),
      min,
      max
    };
  };
  
  const histogramData = generateHistogramData();
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Model Fit</CardTitle>
            <CardDescription>
              Goodness of fit diagnostics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">R²</span>
                  <span className="text-sm font-medium">{model.rSquared.toFixed(4)}</span>
                </div>
                <Progress value={model.rSquared * 100} className="h-2" />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">Adjusted R²</span>
                  <span className="text-sm font-medium">{model.adjustedRSquared.toFixed(4)}</span>
                </div>
                <Progress value={model.adjustedRSquared * 100} className="h-2" />
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm">F-statistic</span>
                <span className="text-sm font-medium">{model.fStatistic.toFixed(2)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">p-value</span>
                <span className="text-sm font-medium">
                  {model.pValue < 0.001 
                    ? '< 0.001' 
                    : model.pValue.toFixed(4)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Collinearity</CardTitle>
            <CardDescription>
              Variance inflation factors
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[150px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Variable</TableHead>
                    <TableHead>VIF</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(model.diagnostics.vif).map(([variable, vif]) => (
                    <TableRow key={variable}>
                      <TableCell className="py-1">{variable}</TableCell>
                      <TableCell className="py-1">{typeof vif === 'number' ? vif.toFixed(2) : '∞'}</TableCell>
                      <TableCell className="py-1 text-right">
                        {vif < 5 ? (
                          <span className="text-green-500 flex items-center justify-end">
                            <Check className="h-4 w-4 mr-1" /> Good
                          </span>
                        ) : vif < 10 ? (
                          <span className="text-amber-500 flex items-center justify-end">
                            <AlertTriangle className="h-4 w-4 mr-1" /> Moderate
                          </span>
                        ) : (
                          <span className="text-red-500 flex items-center justify-end">
                            <X className="h-4 w-4 mr-1" /> High
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Model Diagnostics</CardTitle>
            <CardDescription>
              Potential issues with the model
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Multicollinearity</span>
                {model.diagnostics.collinearity ? (
                  <span className="text-red-500 flex items-center">
                    <X className="h-4 w-4 mr-1" /> Detected
                  </span>
                ) : (
                  <span className="text-green-500 flex items-center">
                    <Check className="h-4 w-4 mr-1" /> OK
                  </span>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <span>Heteroskedasticity</span>
                {model.diagnostics.heteroskedasticity ? (
                  <span className="text-red-500 flex items-center">
                    <X className="h-4 w-4 mr-1" /> Detected
                  </span>
                ) : (
                  <span className="text-green-500 flex items-center">
                    <Check className="h-4 w-4 mr-1" /> OK
                  </span>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <span>Spatial Autocorrelation</span>
                {model.diagnostics.spatialAutocorrelation ? (
                  <span className="text-red-500 flex items-center">
                    <X className="h-4 w-4 mr-1" /> Detected
                  </span>
                ) : (
                  <span className="text-green-500 flex items-center">
                    <Check className="h-4 w-4 mr-1" /> OK
                  </span>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <span>Missing Values</span>
                {model.diagnostics.missingValueCount > 0 ? (
                  <span className="text-amber-500 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" /> {model.diagnostics.missingValueCount} missing
                  </span>
                ) : (
                  <span className="text-green-500 flex items-center">
                    <Check className="h-4 w-4 mr-1" /> None
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Residuals Analysis */}
      <div>
        <h3 className="text-lg font-medium mb-4">Residual Analysis</h3>
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Residuals Distribution</CardTitle>
              <CardDescription>
                Histogram of model residuals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-end justify-between">
                {histogramData.bins.map((height, i) => (
                  <div 
                    key={i} 
                    className="w-full bg-primary/70 mx-0.5"
                    style={{ height: `${height}%` }}
                  ></div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>{histogramData.min.toFixed(0)}</span>
                <span>Residual Value</span>
                <span>{histogramData.max.toFixed(0)}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Residual Statistics</CardTitle>
              <CardDescription>
                Summary statistics for model residuals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Min</div>
                  <div className="text-xl font-medium">{Math.min(...model.residuals).toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Max</div>
                  <div className="text-xl font-medium">{Math.max(...model.residuals).toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Mean</div>
                  <div className="text-xl font-medium">
                    {(model.residuals.reduce((a, b) => a + b, 0) / model.residuals.length).toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Std Dev</div>
                  <div className="text-xl font-medium">
                    {Math.sqrt(model.residuals.reduce((a, b) => a + b * b, 0) / model.residuals.length).toFixed(2)}
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Residual Pattern</h4>
                {Math.abs(model.residuals.reduce((a, b) => a + b, 0) / model.residuals.length) < 0.01 ? (
                  <div className="text-green-500 flex items-center text-sm">
                    <Check className="h-4 w-4 mr-1" /> 
                    Mean near zero, suggesting unbiased predictions
                  </div>
                ) : (
                  <div className="text-amber-500 flex items-center text-sm">
                    <AlertTriangle className="h-4 w-4 mr-1" /> 
                    Non-zero mean, suggesting potential bias
                  </div>
                )}
                
                {histogramData.bins.length > 0 && Math.max(...histogramData.bins) > 1.5 * histogramData.bins.reduce((a, b) => a + b, 0) / histogramData.bins.length ? (
                  <div className="text-amber-500 flex items-center text-sm mt-1">
                    <AlertTriangle className="h-4 w-4 mr-1" /> 
                    Non-normal distribution detected
                  </div>
                ) : (
                  <div className="text-green-500 flex items-center text-sm mt-1">
                    <Check className="h-4 w-4 mr-1" /> 
                    Distribution appears approximately normal
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Detailed Diagnostic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Diagnostic Interpretation
          </CardTitle>
          <CardDescription>
            What the diagnostics mean for your model
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="text-sm font-medium">Model Fit</h4>
              <p className="mt-1">
                The model explains {(model.rSquared * 100).toFixed(1)}% of the variation in {model.targetVariable}.
                {model.rSquared < 0.3 ? (
                  " This indicates a weak fit, suggesting that the selected variables don't adequately explain the target variable."
                ) : model.rSquared < 0.7 ? (
                  " This indicates a moderate fit, typical for many real estate valuation models."
                ) : (
                  " This indicates a strong fit, suggesting the model captures most factors affecting the target variable."
                )}
              </p>
            </div>
            
            {model.diagnostics.collinearity && (
              <div>
                <h4 className="text-sm font-medium">Multicollinearity</h4>
                <p className="mt-1">
                  Some variables show high correlation, which can make coefficient interpretation difficult 
                  and potentially reduce model stability. Consider removing one of these variables with high VIF:
                </p>
                <ul className="list-disc pl-5 mt-1">
                  {Object.entries(model.diagnostics.vif)
                    .filter(([_, vif]) => vif > 10)
                    .map(([variable, vif]) => (
                      <li key={variable}>{variable} (VIF: {typeof vif === 'number' ? vif.toFixed(2) : '∞'})</li>
                    ))
                  }
                </ul>
              </div>
            )}
            
            {model.diagnostics.heteroskedasticity && (
              <div>
                <h4 className="text-sm font-medium">Heteroskedasticity</h4>
                <p className="mt-1">
                  The model shows non-constant error variance, which can affect the reliability of p-values and confidence intervals.
                  Consider these remedies:
                </p>
                <ul className="list-disc pl-5 mt-1">
                  <li>Transform the target variable (e.g., log transformation)</li>
                  <li>Use weighted regression</li>
                  <li>Add variables that might explain the changing variance</li>
                </ul>
              </div>
            )}
            
            {model.diagnostics.spatialAutocorrelation && (
              <div>
                <h4 className="text-sm font-medium">Spatial Autocorrelation</h4>
                <p className="mt-1">
                  There is spatial pattern in the residuals, indicating that location effects are not fully captured.
                  Consider these approaches:
                </p>
                <ul className="list-disc pl-5 mt-1">
                  <li>Switch to Geographic Weighted Regression (GWR)</li>
                  <li>Add neighborhood variables or location-based factors</li>
                  <li>Include distance-based measures to key amenities</li>
                </ul>
              </div>
            )}
            
            {model.diagnostics.noSignificantVariables && (
              <div>
                <h4 className="text-sm font-medium">Lack of Significant Variables</h4>
                <p className="mt-1">
                  None of the variables show statistical significance (p &lt; 0.05). This suggests the model may
                  not be capturing the true drivers of {model.targetVariable}. Try:
                </p>
                <ul className="list-disc pl-5 mt-1">
                  <li>Including different variables</li>
                  <li>Transforming existing variables (log, square, etc.)</li>
                  <li>Adding interaction terms between variables</li>
                  <li>Considering non-linear relationships</li>
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}