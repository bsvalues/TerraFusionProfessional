import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { PageLayout, ContentSection } from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppMode } from '@/contexts/AppModeContext';
import { AppMode, AppModeConfig } from '@/config/appMode';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HomeIcon, Layers, Settings, ArrowLeft, ExternalLink, Save } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AnimatedBadge } from '@/components/ui/design-system';

/**
 * Settings page for controlling application configuration
 * Includes app mode settings, integration options, and display preferences
 */
export default function SettingsPage() {
  const { config, setMode, updateConfig } = useAppMode();
  const [localConfig, setLocalConfig] = useState<AppModeConfig>({ ...config });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  
  // Keep local config in sync with global config
  useEffect(() => {
    setLocalConfig({ ...config });
  }, [config]);
  
  // Handle mode change
  const handleModeChange = (mode: AppMode) => {
    setLocalConfig(prev => ({ ...prev, mode }));
  };
  
  // Handle toggle change
  const handleToggleChange = (key: keyof AppModeConfig, value: boolean) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }));
  };
  
  // Handle theme change
  const handleThemeChange = (theme: 'default' | 'parent' | 'custom') => {
    setLocalConfig(prev => ({ ...prev, theme }));
  };
  
  // Save settings
  const saveSettings = () => {
    try {
      setMode(localConfig.mode, localConfig);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };
  
  // Get URL with app mode for sharing
  const getAppModeURL = (mode: AppMode) => {
    const url = new URL(window.location.href);
    url.searchParams.set('appMode', mode);
    return url.toString();
  };
  
  return (
    <PageLayout
      title="Settings"
      description="Configure application behavior and integration options"
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Settings' },
      ]}
      actions={
        <Button onClick={saveSettings} disabled={saveStatus === 'saved'}>
          {saveStatus === 'saved' ? (
            <>Saved</>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      }
    >
      <Tabs defaultValue="app-mode" className="w-full space-y-6">
        <TabsList className="mb-6 grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="app-mode">App Mode</TabsTrigger>
          <TabsTrigger value="display">Display & UI</TabsTrigger>
        </TabsList>
        
        <TabsContent value="app-mode" className="space-y-6">
          {/* Mode Selection */}
          <ContentSection title="Application Mode" description="Control how the application operates">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card 
                className={`border cursor-pointer ${localConfig.mode === 'standalone' ? 'border-primary ring-2 ring-primary/10' : 'border-border'}`}
                onClick={() => handleModeChange('standalone')}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Standalone Mode</CardTitle>
                    {localConfig.mode === 'standalone' && <AnimatedBadge text="Active" color="primary" />}
                  </div>
                  <CardDescription>Run as an independent application</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li className="flex items-start">
                      <span className="mr-2">✓</span>
                      <span>Full navigation and UI elements</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">✓</span>
                      <span>Complete application functionality</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">✓</span>
                      <span>Independent data management</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card 
                className={`border cursor-pointer ${localConfig.mode === 'integrated' ? 'border-primary ring-2 ring-primary/10' : 'border-border'}`}
                onClick={() => handleModeChange('integrated')}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Integrated Mode</CardTitle>
                    {localConfig.mode === 'integrated' && <AnimatedBadge text="Active" color="primary" />}
                  </div>
                  <CardDescription>Embed within another application</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li className="flex items-start">
                      <span className="mr-2">✓</span>
                      <span>Streamlined UI for embedding</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">✓</span>
                      <span>Parent/child communication API</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">✓</span>
                      <span>API proxy capabilities</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
            
            <div className="mt-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Note</AlertTitle>
                <AlertDescription>
                  You can quickly switch modes by adding <code className="px-1.5 py-0.5 bg-muted rounded text-xs">?appMode=integrated</code> or <code className="px-1.5 py-0.5 bg-muted rounded text-xs">?appMode=standalone</code> to the URL.
                </AlertDescription>
              </Alert>
            </div>
          </ContentSection>
          
          {/* Integrated Mode Settings */}
          {localConfig.mode === 'integrated' && (
            <ContentSection title="Integration Settings" description="Configure how the application behaves when embedded">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-header" className="font-medium">Show Header</Label>
                    <Switch 
                      id="show-header" 
                      checked={localConfig.showHeader}
                      onCheckedChange={(value) => handleToggleChange('showHeader', value)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">Display the application header when embedded</p>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-footer" className="font-medium">Show Footer</Label>
                    <Switch 
                      id="show-footer" 
                      checked={localConfig.showFooter}
                      onCheckedChange={(value) => handleToggleChange('showFooter', value)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">Display the application footer when embedded</p>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-nav" className="font-medium">Show Navigation</Label>
                    <Switch 
                      id="show-nav" 
                      checked={localConfig.showNavigation}
                      onCheckedChange={(value) => handleToggleChange('showNavigation', value)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">Display navigation elements when embedded</p>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="allow-full-navigation" className="font-medium">Allow Full Page Navigation</Label>
                    <Switch 
                      id="allow-full-navigation" 
                      checked={localConfig.allowFullPageNavigation}
                      onCheckedChange={(value) => handleToggleChange('allowFullPageNavigation', value)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">Enable full page navigation or restrict to in-view updates</p>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label className="font-medium">Theme Inheritance</Label>
                  <Select 
                    value={localConfig.theme}
                    onValueChange={(value) => handleThemeChange(value as 'default' | 'parent' | 'custom')}
                  >
                    <SelectTrigger className="w-full md:w-[200px]">
                      <SelectValue placeholder="Select theme option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default Theme</SelectItem>
                      <SelectItem value="parent">Parent Theme</SelectItem>
                      <SelectItem value="custom">Custom Theme</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">Control how theming is applied when embedded</p>
                </div>
              </div>
            </ContentSection>
          )}
          
          {/* Quick Mode Links */}
          <ContentSection title="Quick Mode Links" description="Share or test different modes with direct links">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/?appMode=standalone">
                    <HomeIcon className="mr-2 h-4 w-4" />
                    Standalone Mode
                  </Link>
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(getAppModeURL('standalone'));
                  }}
                  title="Copy standalone mode URL"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/?appMode=integrated">
                    <Layers className="mr-2 h-4 w-4" />
                    Integrated Mode
                  </Link>
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(getAppModeURL('integrated'));
                  }}
                  title="Copy integrated mode URL"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </ContentSection>
        </TabsContent>
        
        <TabsContent value="display" className="space-y-6">
          <ContentSection title="UI Preferences" description="Customize appearance and behavior">
            <div className="grid gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="animations" className="font-medium">Enable Animations</Label>
                  <Switch 
                    id="animations" 
                    defaultChecked={true}
                  />
                </div>
                <p className="text-sm text-muted-foreground">Toggle UI animations and transitions</p>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="compact-mode" className="font-medium">Compact Mode</Label>
                  <Switch 
                    id="compact-mode" 
                    defaultChecked={false}
                  />
                </div>
                <p className="text-sm text-muted-foreground">Use more compact spacing throughout the UI</p>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="advanced-features" className="font-medium">Show Advanced Features</Label>
                  <Switch 
                    id="advanced-features" 
                    defaultChecked={true}
                  />
                </div>
                <p className="text-sm text-muted-foreground">Display advanced options and tools in the interface</p>
              </div>
            </div>
          </ContentSection>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-start mt-8">
        <Button variant="outline" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    </PageLayout>
  );
}