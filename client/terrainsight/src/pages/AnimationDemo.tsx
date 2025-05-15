import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { LoadingAnimation, AnimationType } from '@/components/ui/loading-animation';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { TransformationProgress } from '@/components/etl/TransformationProgress';
import { TransformationAnimation } from '@/components/etl/TransformationAnimation';
import { TransformationType } from '@/services/etl/ETLTypes';

export default function AnimationDemo() {
  // For LoadingAnimation demo
  const [animationType, setAnimationType] = useState<AnimationType>('default');
  const [animationSize, setAnimationSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [showText, setShowText] = useState(true);
  const [customText, setCustomText] = useState('');
  
  // For LoadingOverlay demo
  const [isOverlayActive, setIsOverlayActive] = useState(false);
  const [blurOverlay, setBlurOverlay] = useState(true);
  
  // Define an interface matching the Step type in TransformationProgress
  interface Step {
    id: number;
    type: TransformationType;
    name: string;
    status: 'waiting' | 'in-progress' | 'completed' | 'failed';
    startTime?: Date;
    endTime?: Date;
    progress?: number;
    recordsProcessed?: number;
    totalRecords?: number;
    message?: string;
  }
  
  // For TransformationProgress demo
  const [progressSteps, setProgressSteps] = useState<Step[]>([
    { 
      id: 1, 
      type: TransformationType.FILTER, 
      name: 'Filter Records', 
      status: 'completed',
      recordsProcessed: 1250,
      totalRecords: 1250
    },
    { 
      id: 2, 
      type: TransformationType.MAP, 
      name: 'Transform Fields', 
      status: 'in-progress',
      recordsProcessed: 523,
      totalRecords: 1250,
      progress: 42
    },
    { 
      id: 3, 
      type: TransformationType.VALIDATION, 
      name: 'Validate Data', 
      status: 'waiting'
    },
    { 
      id: 4, 
      type: TransformationType.AGGREGATE, 
      name: 'Aggregate Results', 
      status: 'waiting'
    }
  ]);
  
  // For TransformationAnimation demo
  const [transformationType, setTransformationType] = useState<TransformationType>(TransformationType.FILTER);
  const [isAnimationActive, setIsAnimationActive] = useState(true);
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);
  
  const progressDemo = (action: 'advance' | 'reset' | 'complete' | 'fail') => {
    if (action === 'reset') {
      setProgressSteps([
        { 
          id: 1, 
          type: TransformationType.FILTER, 
          name: 'Filter Records', 
          status: 'waiting'
        },
        { 
          id: 2, 
          type: TransformationType.MAP, 
          name: 'Transform Fields', 
          status: 'waiting'
        },
        { 
          id: 3, 
          type: TransformationType.VALIDATION, 
          name: 'Validate Data', 
          status: 'waiting'
        },
        { 
          id: 4, 
          type: TransformationType.AGGREGATE, 
          name: 'Aggregate Results', 
          status: 'waiting'
        }
      ]);
      return;
    }
    
    if (action === 'advance') {
      const currentInProgressIndex = progressSteps.findIndex(step => step.status === 'in-progress');
      const nextWaitingIndex = progressSteps.findIndex(step => step.status === 'waiting');
      
      if (currentInProgressIndex !== -1 && nextWaitingIndex !== -1) {
        const newSteps = [...progressSteps];
        newSteps[currentInProgressIndex] = {
          ...newSteps[currentInProgressIndex],
          status: 'completed',
          recordsProcessed: 1250,
          totalRecords: 1250,
          progress: 100
        };
        
        newSteps[nextWaitingIndex] = {
          ...newSteps[nextWaitingIndex],
          status: 'in-progress',
          recordsProcessed: 0,
          totalRecords: 1250,
          progress: 0
        };
        
        setProgressSteps(newSteps);
      } else if (currentInProgressIndex !== -1) {
        const newSteps = [...progressSteps];
        newSteps[currentInProgressIndex] = {
          ...newSteps[currentInProgressIndex],
          status: 'completed',
          recordsProcessed: 1250,
          totalRecords: 1250,
          progress: 100
        };
        setProgressSteps(newSteps);
      } else if (nextWaitingIndex !== -1) {
        const newSteps = [...progressSteps];
        newSteps[nextWaitingIndex] = {
          ...newSteps[nextWaitingIndex],
          status: 'in-progress',
          recordsProcessed: 0,
          totalRecords: 1250,
          progress: 0
        };
        setProgressSteps(newSteps);
      }
    }
    
    if (action === 'complete') {
      setProgressSteps(progressSteps.map(step => ({
        ...step,
        status: 'completed',
        recordsProcessed: 1250,
        totalRecords: 1250,
        progress: 100
      })));
    }
    
    if (action === 'fail') {
      const currentInProgressIndex = progressSteps.findIndex(step => step.status === 'in-progress');
      
      if (currentInProgressIndex !== -1) {
        const newSteps = [...progressSteps];
        newSteps[currentInProgressIndex] = {
          ...newSteps[currentInProgressIndex],
          status: 'failed',
          message: 'Transformation failed: invalid data format'
        };
        setProgressSteps(newSteps);
      }
    }
  };
  
  const simulateProgress = () => {
    const currentProgress = progressSteps.find(step => step.status === 'in-progress');
    
    if (currentProgress && currentProgress.progress !== undefined && currentProgress.progress < 100) {
      const newProgress = Math.min(100, currentProgress.progress + 10);
      const recordsProcessed = Math.floor((newProgress / 100) * (currentProgress.totalRecords || 1250));
      
      setProgressSteps(progressSteps.map(step => 
        step.id === currentProgress.id ? 
        {
          ...step,
          progress: newProgress,
          recordsProcessed
        } : step
      ));
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">ETL Animation Components</h1>
      
      <Tabs defaultValue="loading">
        <TabsList className="mb-4">
          <TabsTrigger value="loading">Loading Animation</TabsTrigger>
          <TabsTrigger value="overlay">Loading Overlay</TabsTrigger>
          <TabsTrigger value="progress">Transformation Progress</TabsTrigger>
          <TabsTrigger value="transformation">Transformation Animation</TabsTrigger>
        </TabsList>
        
        <TabsContent value="loading">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Loading Animation Controls</CardTitle>
                <CardDescription>Customize the animation parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Animation Type</Label>
                  <Select value={animationType} onValueChange={(v) => setAnimationType(v as AnimationType)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select animation type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default (Spinner)</SelectItem>
                      <SelectItem value="data-loading">Data Loading</SelectItem>
                      <SelectItem value="extracting">Extracting</SelectItem>
                      <SelectItem value="transforming">Transforming</SelectItem>
                      <SelectItem value="filtering">Filtering</SelectItem>
                      <SelectItem value="analyzing">Analyzing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Size</Label>
                  <Select value={animationSize} onValueChange={(v) => setAnimationSize(v as 'sm' | 'md' | 'lg')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sm">Small</SelectItem>
                      <SelectItem value="md">Medium</SelectItem>
                      <SelectItem value="lg">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch id="show-text" checked={showText} onCheckedChange={setShowText} />
                  <Label htmlFor="show-text">Show Text</Label>
                </div>
                
                {showText && (
                  <div className="space-y-2">
                    <Label>Custom Text (optional)</Label>
                    <input
                      type="text"
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      placeholder="Enter custom text..."
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>Live preview of the animation</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center min-h-[200px]">
                <LoadingAnimation
                  type={animationType}
                  size={animationSize}
                  showText={showText}
                  text={customText || undefined}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="overlay">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Loading Overlay Controls</CardTitle>
                <CardDescription>Toggle overlay visibility and settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch id="show-overlay" checked={isOverlayActive} onCheckedChange={setIsOverlayActive} />
                  <Label htmlFor="show-overlay">Show Overlay</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch id="blur-overlay" checked={blurOverlay} onCheckedChange={setBlurOverlay} />
                  <Label htmlFor="blur-overlay">Blur Background</Label>
                </div>
                
                <div className="space-y-2">
                  <Label>Animation Type</Label>
                  <Select value={animationType} onValueChange={(v) => setAnimationType(v as AnimationType)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select animation type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default (Spinner)</SelectItem>
                      <SelectItem value="data-loading">Data Loading</SelectItem>
                      <SelectItem value="extracting">Extracting</SelectItem>
                      <SelectItem value="transforming">Transforming</SelectItem>
                      <SelectItem value="filtering">Filtering</SelectItem>
                      <SelectItem value="analyzing">Analyzing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>Live preview of the overlay</CardDescription>
              </CardHeader>
              <CardContent className="min-h-[200px]">
                <LoadingOverlay
                  isLoading={isOverlayActive}
                  type={animationType}
                  blur={blurOverlay}
                  text="Processing data..."
                >
                  <div className="border border-dashed border-muted-foreground/50 rounded-lg p-4 min-h-[200px] flex items-center justify-center">
                    <p className="text-center text-muted-foreground">
                      This is the content that will be overlaid with the loading animation.
                      <br /><br />
                      Toggle the overlay to see the effect.
                    </p>
                  </div>
                </LoadingOverlay>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="progress">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Transformation Progress Controls</CardTitle>
                <CardDescription>Simulate a multi-step ETL process</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={() => progressDemo('advance')}>
                    Advance Step
                  </Button>
                  <Button onClick={simulateProgress}>
                    Update Progress
                  </Button>
                  <Button onClick={() => progressDemo('fail')} variant="destructive">
                    Fail Current Step
                  </Button>
                  <Button onClick={() => progressDemo('complete')} variant="default">
                    Complete All
                  </Button>
                </div>
                <Button onClick={() => progressDemo('reset')} variant="outline" className="w-full">
                  Reset Demo
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>Transformation progress display</CardDescription>
              </CardHeader>
              <CardContent>
                <TransformationProgress steps={progressSteps} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="transformation">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Transformation Animation Controls</CardTitle>
                <CardDescription>Explore different data transformation visualizations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Transformation Type</Label>
                  <Select 
                    value={transformationType} 
                    onValueChange={(v) => setTransformationType(v as TransformationType)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select transformation type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TransformationType.FILTER}>Filter</SelectItem>
                      <SelectItem value={TransformationType.MAP}>Map</SelectItem>
                      <SelectItem value={TransformationType.AGGREGATE}>Aggregate</SelectItem>
                      <SelectItem value={TransformationType.JOIN}>Join</SelectItem>
                      <SelectItem value={TransformationType.VALIDATION}>Validation</SelectItem>
                      <SelectItem value={TransformationType.ENRICHMENT}>Enrichment</SelectItem>
                      <SelectItem value={TransformationType.CUSTOM}>Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Size</Label>
                  <Select value={animationSize} onValueChange={(v) => setAnimationSize(v as 'sm' | 'md' | 'lg')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sm">Small</SelectItem>
                      <SelectItem value="md">Medium</SelectItem>
                      <SelectItem value="lg">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="is-active" 
                    checked={isAnimationActive} 
                    onCheckedChange={setIsAnimationActive} 
                  />
                  <Label htmlFor="is-active">Animation Active</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="is-complete" 
                    checked={isAnimationComplete} 
                    onCheckedChange={setIsAnimationComplete} 
                  />
                  <Label htmlFor="is-complete">Animation Complete</Label>
                </div>
                
                <Button 
                  onClick={() => {
                    setIsAnimationActive(true);
                    setIsAnimationComplete(false);
                    setTimeout(() => {
                      setIsAnimationComplete(true);
                    }, 3000);
                  }} 
                  variant="default"
                  className="w-full"
                >
                  Play Full Animation
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>Visualization of the selected transformation</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center min-h-[250px]">
                <TransformationAnimation
                  type={transformationType}
                  size={animationSize}
                  isActive={isAnimationActive}
                  isComplete={isAnimationComplete}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}