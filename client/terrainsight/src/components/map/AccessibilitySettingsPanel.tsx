import React from 'react';
import { Settings, ZoomIn, ZoomOut, ArrowLeftRight, Moon, SunMoon, Volume2, VolumeX, Type } from 'lucide-react';
import { useMapAccessibility } from '@/contexts/MapAccessibilityContext';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface AccessibilitySettingsPanelProps {
  className?: string;
}

export const AccessibilitySettingsPanel: React.FC<AccessibilitySettingsPanelProps> = ({
  className
}) => {
  const {
    highContrastMode,
    toggleHighContrastMode,
    keyboardNavigation,
    toggleKeyboardNavigation,
    screenReaderAnnouncements,
    toggleScreenReaderAnnouncements,
    fontSizeScale,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    reducedMotion,
    toggleReducedMotion,
    announceToScreenReader
  } = useMapAccessibility();
  
  // Handle toggle changes with announcements
  const handleHighContrastToggle = () => {
    toggleHighContrastMode();
    announceToScreenReader(highContrastMode ? 'High contrast mode disabled' : 'High contrast mode enabled');
  };
  
  const handleKeyboardNavToggle = () => {
    toggleKeyboardNavigation();
    announceToScreenReader(keyboardNavigation ? 'Keyboard navigation disabled' : 'Keyboard navigation enabled');
  };
  
  const handleScreenReaderToggle = () => {
    toggleScreenReaderAnnouncements();
    // No announcement here since it would be redundant
  };
  
  const handleReducedMotionToggle = () => {
    toggleReducedMotion();
    announceToScreenReader(reducedMotion ? 'Reduced motion disabled' : 'Reduced motion enabled');
  };
  
  // Handle font size changes
  const handleIncreaseFontSize = () => {
    increaseFontSize();
    announceToScreenReader(`Font size increased to ${Math.round(fontSizeScale * 100)}%`);
  };
  
  const handleDecreaseFontSize = () => {
    decreaseFontSize();
    announceToScreenReader(`Font size decreased to ${Math.round(fontSizeScale * 100)}%`);
  };
  
  const handleResetFontSize = () => {
    resetFontSize();
    announceToScreenReader('Font size reset to default');
  };
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline"
          size="icon"
          className={cn(
            "flex items-center justify-center h-10 w-10 bg-white rounded-md shadow-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
            className
          )}
          aria-label="Accessibility Settings"
          title="Accessibility Settings"
        >
          <Settings className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Map Accessibility Settings</DialogTitle>
          <DialogDescription>
            Customize map display and interaction options for better accessibility.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-6">
          {/* High Contrast Mode */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SunMoon className="h-5 w-5" />
              <Label htmlFor="high-contrast-mode" className="text-base">High Contrast Mode</Label>
            </div>
            <Switch
              id="high-contrast-mode"
              checked={highContrastMode}
              onCheckedChange={handleHighContrastToggle}
              aria-label="Toggle high contrast mode"
            />
          </div>
          
          {/* Keyboard Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5" />
              <Label htmlFor="keyboard-navigation" className="text-base">Keyboard Navigation</Label>
            </div>
            <Switch
              id="keyboard-navigation"
              checked={keyboardNavigation}
              onCheckedChange={handleKeyboardNavToggle}
              aria-label="Toggle keyboard navigation"
            />
          </div>
          
          {/* Screen Reader Announcements */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {screenReaderAnnouncements ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              <Label htmlFor="screen-reader" className="text-base">Screen Reader Announcements</Label>
            </div>
            <Switch
              id="screen-reader"
              checked={screenReaderAnnouncements}
              onCheckedChange={handleScreenReaderToggle}
              aria-label="Toggle screen reader announcements"
            />
          </div>
          
          {/* Reduced Motion */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Moon className="h-5 w-5" />
              <Label htmlFor="reduced-motion" className="text-base">Reduced Motion</Label>
            </div>
            <Switch
              id="reduced-motion"
              checked={reducedMotion}
              onCheckedChange={handleReducedMotionToggle}
              aria-label="Toggle reduced motion"
            />
          </div>
          
          {/* Font Size */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Type className="h-5 w-5" />
              <Label htmlFor="font-size" className="text-base">Font Size ({Math.round(fontSizeScale * 100)}%)</Label>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleDecreaseFontSize}
                aria-label="Decrease font size"
                disabled={fontSizeScale <= 0.8}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <div className="flex-1">
                <Slider
                  id="font-size"
                  value={[fontSizeScale * 100]}
                  min={80}
                  max={150}
                  step={10}
                  onValueChange={(values) => {
                    const newScale = values[0] / 100;
                    if (newScale !== fontSizeScale) {
                      // Use the hooks from context rather than setting directly
                      if (newScale > fontSizeScale) {
                        increaseFontSize();
                      } else {
                        decreaseFontSize();
                      }
                      announceToScreenReader(`Font size set to ${values[0]}%`);
                    }
                  }}
                  aria-label="Adjust font size"
                />
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleIncreaseFontSize}
                aria-label="Increase font size"
                disabled={fontSizeScale >= 1.5}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleResetFontSize}
              className="mt-1 text-xs"
              aria-label="Reset font size to default"
            >
              Reset to Default
            </Button>
          </div>
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button 
              className="w-full"
              aria-label="Close accessibility settings"
            >
              Save Settings
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};