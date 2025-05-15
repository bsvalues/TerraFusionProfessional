
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { ScrollArea } from './scroll-area';

interface VideoTour {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
}

const videoTours: VideoTour[] = [
  {
    id: 'overview',
    title: 'Application Overview',
    description: 'Learn about the main features and navigation',
    videoUrl: '/videos/overview.mp4'
  },
  {
    id: 'property-comparison',
    title: 'Property Comparison',
    description: 'How to compare multiple properties and analyze differences',
    videoUrl: '/videos/comparison.mp4'
  },
  {
    id: 'spatial-analysis',
    title: 'Spatial Analysis Tools',
    description: 'Using heat maps and proximity analysis tools',
    videoUrl: '/videos/spatial.mp4'
  },
  {
    id: 'reporting',
    title: 'Generating Reports',
    description: 'Create and export professional property reports',
    videoUrl: '/videos/reporting.mp4'
  }
];

interface VideoTourDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VideoTourDialog({ open, onOpenChange }: VideoTourDialogProps) {
  const [selectedTour, setSelectedTour] = React.useState<VideoTour | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            {selectedTour ? selectedTour.title : 'Video Demonstrations'}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-full pr-4">
          {!selectedTour ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              {videoTours.map((tour) => (
                <div
                  key={tour.id}
                  className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelectedTour(tour)}
                >
                  <h3 className="font-semibold">{tour.title}</h3>
                  <p className="text-sm text-gray-600">{tour.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4">
              <button
                className="mb-4 text-sm text-blue-600 hover:underline"
                onClick={() => setSelectedTour(null)}
              >
                ← Back to all videos
              </button>
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  src={selectedTour.videoUrl}
                  controls
                  className="w-full h-full"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
              <h3 className="font-semibold mt-4">{selectedTour.title}</h3>
              <p className="text-sm text-gray-600">{selectedTour.description}</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
