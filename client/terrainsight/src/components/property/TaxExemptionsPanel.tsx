import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { AlertTriangle, InfoIcon } from 'lucide-react';
import { TaxEstimateOptions } from './PropertyTaxEstimator';
import { formatCurrency } from '@/lib/utils';

// Example exemption data (would come from a real source in production)
const EXEMPTION_INFO = {
  homestead: {
    title: 'Homestead Exemption',
    description: 'Applicable to primary residences. Reduces the taxable value of your home.',
    defaultAmount: 50000,
    maxAmount: 100000
  },
  senior: {
    title: 'Senior Citizens Exemption',
    description: 'For property owners aged 65 or older who meet income requirements.',
    defaultAmount: 40000,
    maxAmount: 75000
  },
  disability: {
    title: 'Disability Exemption',
    description: 'Available to property owners with qualifying disabilities.',
    defaultAmount: 40000,
    maxAmount: 75000
  },
  veteran: {
    title: 'Veterans Exemption',
    description: 'For qualifying veterans and their surviving spouses.',
    defaultAmount: 30000,
    maxAmount: 60000
  },
  historic: {
    title: 'Historic Property Exemption',
    description: 'For properties designated as historic landmarks with qualified restoration.',
    defaultAmount: 25000,
    maxAmount: 50000
  },
  agricultural: {
    title: 'Agricultural Exemption',
    description: 'For qualifying agricultural properties actively used for farming.',
    defaultAmount: 75000,
    maxAmount: 150000
  }
};

interface TaxExemptionsPanelProps {
  options: TaxEstimateOptions;
  onOptionChange: (key: keyof TaxEstimateOptions, value: any) => void;
}

const TaxExemptionsPanel: React.FC<TaxExemptionsPanelProps> = ({ options, onOptionChange }) => {
  // Local state for exemption amounts
  const [exemptionAmounts, setExemptionAmounts] = useState({
    homestead: EXEMPTION_INFO.homestead.defaultAmount,
    senior: EXEMPTION_INFO.senior.defaultAmount,
    disability: EXEMPTION_INFO.disability.defaultAmount,
    veteran: EXEMPTION_INFO.veteran.defaultAmount,
    historic: EXEMPTION_INFO.historic.defaultAmount,
    agricultural: EXEMPTION_INFO.agricultural.defaultAmount
  });

  // Calculate total exemption amount
  const calculateTotalExemption = () => {
    let total = 0;
    
    if (options.homesteadExemption) {
      total += exemptionAmounts.homestead;
    }
    
    if (options.seniorExemption) {
      total += exemptionAmounts.senior;
    }
    
    if (options.disabilityExemption) {
      total += exemptionAmounts.disability;
    }
    
    if (options.veteranExemption) {
      total += exemptionAmounts.veteran;
    }
    
    if (options.historicPropertyExemption) {
      total += exemptionAmounts.historic;
    }
    
    if (options.agriculturalExemption) {
      total += exemptionAmounts.agricultural;
    }
    
    return total;
  };

  // Handle toggling an exemption
  const handleToggleExemption = (key: string, checked: boolean) => {
    const optionKey = `${key}Exemption` as keyof TaxEstimateOptions;
    onOptionChange(optionKey, checked);
    
    // Update total exemption amount
    const total = calculateTotalExemption();
    onOptionChange('exemptionAmount', total);
  };

  // Handle changing an exemption amount
  const handleExemptionAmountChange = (key: keyof typeof exemptionAmounts, value: string) => {
    // Parse value as number
    const numValue = parseFloat(value);
    
    if (!isNaN(numValue) && numValue >= 0) {
      // Update local state
      setExemptionAmounts(prev => ({
        ...prev,
        [key]: numValue
      }));
      
      // Recalculate total and update parent
      setTimeout(() => {
        const total = calculateTotalExemption();
        onOptionChange('exemptionAmount', total);
      }, 0);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Tax Exemptions</CardTitle>
        <CardDescription>
          Apply tax exemptions that may reduce your property's assessed value or tax liability.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Homestead Exemption */}
        <div className="p-4 border rounded-md">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-sm font-medium">{EXEMPTION_INFO.homestead.title}</h3>
              <p className="text-xs text-muted-foreground">{EXEMPTION_INFO.homestead.description}</p>
            </div>
            <Switch 
              checked={options.homesteadExemption}
              onCheckedChange={(checked) => handleToggleExemption('homestead', checked)}
            />
          </div>
          
          {options.homesteadExemption && (
            <div className="mt-4">
              <div className="flex justify-between items-center">
                <Label htmlFor="homestead-amount" className="text-xs">Exemption Amount</Label>
                <Input
                  id="homestead-amount"
                  type="text"
                  value={exemptionAmounts.homestead}
                  onChange={(e) => handleExemptionAmountChange('homestead', e.target.value)}
                  className="w-24 h-8 text-xs"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Maximum: {formatCurrency(EXEMPTION_INFO.homestead.maxAmount)}
              </p>
            </div>
          )}
        </div>
        
        {/* Senior Citizen Exemption */}
        <div className="p-4 border rounded-md">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-sm font-medium">{EXEMPTION_INFO.senior.title}</h3>
              <p className="text-xs text-muted-foreground">{EXEMPTION_INFO.senior.description}</p>
            </div>
            <Switch 
              checked={options.seniorExemption}
              onCheckedChange={(checked) => handleToggleExemption('senior', checked)}
            />
          </div>
          
          {options.seniorExemption && (
            <div className="mt-4">
              <div className="flex justify-between items-center">
                <Label htmlFor="senior-amount" className="text-xs">Exemption Amount</Label>
                <Input
                  id="senior-amount"
                  type="text"
                  value={exemptionAmounts.senior}
                  onChange={(e) => handleExemptionAmountChange('senior', e.target.value)}
                  className="w-24 h-8 text-xs"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Maximum: {formatCurrency(EXEMPTION_INFO.senior.maxAmount)}
              </p>
            </div>
          )}
        </div>
        
        {/* Veteran Exemption */}
        <div className="p-4 border rounded-md">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-sm font-medium">{EXEMPTION_INFO.veteran.title}</h3>
              <p className="text-xs text-muted-foreground">{EXEMPTION_INFO.veteran.description}</p>
            </div>
            <Switch 
              checked={options.veteranExemption}
              onCheckedChange={(checked) => handleToggleExemption('veteran', checked)}
            />
          </div>
          
          {options.veteranExemption && (
            <div className="mt-4">
              <div className="flex justify-between items-center">
                <Label htmlFor="veteran-amount" className="text-xs">Exemption Amount</Label>
                <Input
                  id="veteran-amount"
                  type="text"
                  value={exemptionAmounts.veteran}
                  onChange={(e) => handleExemptionAmountChange('veteran', e.target.value)}
                  className="w-24 h-8 text-xs"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Maximum: {formatCurrency(EXEMPTION_INFO.veteran.maxAmount)}
              </p>
            </div>
          )}
        </div>
        
        {/* Disclaimer */}
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-700">
            Exemption eligibility requirements vary. Contact the county assessor's office for
            official information about property tax exemptions in your area.
          </AlertDescription>
        </Alert>
        
        {/* Summary */}
        <div className="p-4 border rounded-md bg-muted">
          <h3 className="text-sm font-medium mb-2">Exemption Summary</h3>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Active Exemptions:</span>
              <span>
                {(options.homesteadExemption ? 1 : 0) +
                  (options.seniorExemption ? 1 : 0) +
                  (options.disabilityExemption ? 1 : 0) +
                  (options.veteranExemption ? 1 : 0) +
                  (options.historicPropertyExemption ? 1 : 0) +
                  (options.agriculturalExemption ? 1 : 0)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-medium">
              <span>Total Exemption Amount:</span>
              <span>{formatCurrency(calculateTotalExemption())}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaxExemptionsPanel;