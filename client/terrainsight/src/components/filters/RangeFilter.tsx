import React, { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { debounce } from '@/lib/utils';
import { Label } from '@/components/ui/label';

interface RangeFilterProps {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (range: [number, number]) => void;
  formatValue?: (value: number) => string;
  disabled?: boolean;
  debounceMs?: number;
}

export const RangeFilter: React.FC<RangeFilterProps> = ({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
  formatValue = (val) => val.toString(),
  disabled = false,
  debounceMs = 300
}) => {
  // Local state for UI updates
  const [localValue, setLocalValue] = useState<[number, number]>(value);
  const [minInput, setMinInput] = useState<string>(formatValue(value[0]));
  const [maxInput, setMaxInput] = useState<string>(formatValue(value[1]));
  
  // Create debounced onChange handler
  const debouncedOnChange = React.useMemo(
    () => debounce(onChange, debounceMs),
    [onChange, debounceMs]
  );
  
  // Update local state when props change
  useEffect(() => {
    setLocalValue(value);
    setMinInput(formatValue(value[0]));
    setMaxInput(formatValue(value[1]));
  }, [value, formatValue]);
  
  // Handle slider change
  const handleSliderChange = (newValue: number[]) => {
    const range: [number, number] = [newValue[0], newValue[1]];
    setLocalValue(range);
    setMinInput(formatValue(range[0]));
    setMaxInput(formatValue(range[1]));
    debouncedOnChange(range);
  };
  
  // Handle min input change
  const handleMinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setMinInput(inputValue);
    
    const numValue = parseFloat(inputValue.replace(/[^0-9.]/g, ''));
    if (!isNaN(numValue)) {
      const clampedValue = Math.max(min, Math.min(numValue, localValue[1]));
      const newRange: [number, number] = [clampedValue, localValue[1]];
      setLocalValue(newRange);
      debouncedOnChange(newRange);
    }
  };
  
  // Handle max input change
  const handleMaxInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setMaxInput(inputValue);
    
    const numValue = parseFloat(inputValue.replace(/[^0-9.]/g, ''));
    if (!isNaN(numValue)) {
      const clampedValue = Math.min(max, Math.max(numValue, localValue[0]));
      const newRange: [number, number] = [localValue[0], clampedValue];
      setLocalValue(newRange);
      debouncedOnChange(newRange);
    }
  };
  
  // Handle input blur to format and validate
  const handleInputBlur = (type: 'min' | 'max') => {
    if (type === 'min') {
      const numValue = parseFloat(minInput.replace(/[^0-9.]/g, ''));
      if (isNaN(numValue)) {
        setMinInput(formatValue(localValue[0]));
      } else {
        const clampedValue = Math.max(min, Math.min(numValue, localValue[1]));
        setMinInput(formatValue(clampedValue));
        
        if (clampedValue !== localValue[0]) {
          const newRange: [number, number] = [clampedValue, localValue[1]];
          setLocalValue(newRange);
          onChange(newRange); // Direct call on blur to ensure final value is sent
        }
      }
    } else {
      const numValue = parseFloat(maxInput.replace(/[^0-9.]/g, ''));
      if (isNaN(numValue)) {
        setMaxInput(formatValue(localValue[1]));
      } else {
        const clampedValue = Math.min(max, Math.max(numValue, localValue[0]));
        setMaxInput(formatValue(clampedValue));
        
        if (clampedValue !== localValue[1]) {
          const newRange: [number, number] = [localValue[0], clampedValue];
          setLocalValue(newRange);
          onChange(newRange); // Direct call on blur to ensure final value is sent
        }
      }
    }
  };
  
  return (
    <div className="space-y-4" data-testid="range-filter">
      <div className="flex justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="text-xs text-gray-500">
          {formatValue(min)} - {formatValue(max)}
        </div>
      </div>
      
      <Slider
        defaultValue={[min, max]}
        min={min}
        max={max}
        step={step}
        value={localValue}
        onValueChange={handleSliderChange}
        disabled={disabled}
        aria-label={`${label} range slider`}
      />
      
      <div className="flex items-center gap-3">
        <div className="grow">
          <Input
            type="text"
            value={minInput}
            onChange={handleMinInputChange}
            onBlur={() => handleInputBlur('min')}
            disabled={disabled}
            aria-label={`Minimum ${label}`}
          />
        </div>
        <div className="text-gray-500">-</div>
        <div className="grow">
          <Input
            type="text"
            value={maxInput}
            onChange={handleMaxInputChange}
            onBlur={() => handleInputBlur('max')}
            disabled={disabled}
            aria-label={`Maximum ${label}`}
          />
        </div>
      </div>
    </div>
  );
};

export default RangeFilter;