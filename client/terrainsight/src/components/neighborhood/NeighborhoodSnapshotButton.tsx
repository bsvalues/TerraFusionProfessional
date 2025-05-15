import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Property } from '@shared/schema';
import { NeighborhoodTimeline } from '../../services/neighborhoodComparisonReportService';
import { Camera, Loader2 } from 'lucide-react';
import { neighborhoodSnapshotGenerator, SnapshotSection } from '../../services/neighborhoodSnapshotGenerator';
import { toast } from '@/hooks/use-toast';

interface NeighborhoodSnapshotButtonProps {
  neighborhoods: NeighborhoodTimeline[];
  selectedNeighborhoods: string[];
  properties: Property[];
  selectedYear: string;
  containerRef: React.RefObject<HTMLDivElement>;
}

export const NeighborhoodSnapshotButton: React.FC<NeighborhoodSnapshotButtonProps> = ({
  neighborhoods,
  selectedNeighborhoods,
  properties,
  selectedYear,
  containerRef,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSections, setSelectedSections] = useState<string[]>([
    'summary', 'valueComparison', 'growthTrends', 'marketActivity'
  ]);
  
  // Handle section selection
  const toggleSection = (sectionId: string) => {
    if (selectedSections.includes(sectionId)) {
      setSelectedSections(selectedSections.filter(id => id !== sectionId));
    } else {
      setSelectedSections([...selectedSections, sectionId]);
    }
  };
  
  // Generate the snapshot
  const generateSnapshot = async () => {
    if (selectedNeighborhoods.length === 0) {
      toast({
        title: "No neighborhoods selected",
        description: "Please select at least one neighborhood to generate a snapshot.",
        variant: "destructive"
      });
      return;
    }
    
    setIsGenerating(true);
    
    try {
      await neighborhoodSnapshotGenerator.generateSnapshot(
        containerRef,
        {
          neighborhoods,
          selectedNeighborhoods,
          properties,
          selectedYear,
          includeHeatmap: selectedSections.includes('summary'),
          includeTimeline: selectedSections.includes('growthTrends'),
          includeProfile: selectedSections.includes('valueComparison'),
          includeTrends: selectedSections.includes('marketActivity'),
          includeScorecard: selectedSections.includes('scorecard')
        }
      );
      
      toast({
        title: "Snapshot generated",
        description: "Your neighborhood comparison snapshot has been generated and downloaded.",
      });
      
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error generating snapshot:', error);
      toast({
        title: "Error generating snapshot",
        description: "An error occurred while generating the snapshot. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  // For quick one-click snapshot without configuration
  const quickSnapshot = async () => {
    if (selectedNeighborhoods.length === 0) {
      toast({
        title: "No neighborhoods selected",
        description: "Please select at least one neighborhood to generate a snapshot.",
        variant: "destructive"
      });
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Just capture the current view as an image
      const imageUrl = await neighborhoodSnapshotGenerator.captureAsImage(containerRef);
      
      if (imageUrl) {
        toast({
          title: "Snapshot captured",
          description: "Your neighborhood comparison snapshot has been captured and downloaded.",
        });
      } else {
        throw new Error('Failed to capture snapshot');
      }
    } catch (error) {
      console.error('Error capturing snapshot:', error);
      toast({
        title: "Error capturing snapshot",
        description: "An error occurred while capturing the snapshot. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <>
      <Button
        variant="default"
        size="sm"
        onClick={quickSnapshot}
        className="flex items-center gap-2"
        disabled={isGenerating}
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Generating...</span>
          </>
        ) : (
          <>
            <Camera className="h-4 w-4" />
            <span>Snapshot</span>
          </>
        )}
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 ml-2"
        disabled={isGenerating}
      >
        <Camera className="h-4 w-4" />
        <span>Advanced</span>
      </Button>
      
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Generate Neighborhood Comparison Snapshot</DialogTitle>
            <DialogDescription>
              Create a comprehensive snapshot of your neighborhood comparison.
              Select which sections to include in the snapshot.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <h3 className="text-sm font-medium mb-3">Include in snapshot:</h3>
            <div className="space-y-4">
              {neighborhoodSnapshotGenerator.availableSections.map((section) => (
                <div key={section.id} className="flex items-start space-x-2">
                  <Checkbox
                    id={section.id}
                    checked={selectedSections.includes(section.id)}
                    onCheckedChange={() => toggleSection(section.id)}
                  />
                  <div className="grid gap-1.5">
                    <Label
                      htmlFor={section.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {section.title}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {section.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="border-t my-4 pt-4">
            <div className="text-sm">
              <p className="font-medium mb-1">Selected neighborhoods:</p>
              <ul className="list-disc pl-5 text-muted-foreground">
                {neighborhoods
                  .filter(n => selectedNeighborhoods.includes(n.id))
                  .map(neighborhood => (
                    <li key={neighborhood.id}>{neighborhood.name}</li>
                  ))
                }
                {selectedNeighborhoods.length === 0 && (
                  <li className="text-destructive">No neighborhoods selected</li>
                )}
              </ul>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={generateSnapshot}
              disabled={isGenerating || selectedNeighborhoods.length === 0}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating
                </>
              ) : (
                'Generate Snapshot'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NeighborhoodSnapshotButton;