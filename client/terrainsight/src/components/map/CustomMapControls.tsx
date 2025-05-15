import React, { useState } from 'react';
import { useMap } from 'react-leaflet';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Minimize,
  Home, 
  Compass, 
  RotateCcw, 
  Locate, 
  Search,
  Keyboard,
  BarChart3
} from 'lucide-react';
import { LatLngExpression } from 'leaflet';
import { Tooltip } from '@/components/ui/custom-tooltip';
import { Button } from '@/components/ui/button';
import DemographicOverlayControl from './DemographicOverlayControl';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CustomMapControlsProps {
  defaultCenter: LatLngExpression;
  defaultZoom: number;
  onResetView?: () => void;
}

const ZOOM_MIN = 3;
const ZOOM_MAX = 18;

const CustomMapControls: React.FC<CustomMapControlsProps> = ({
  defaultCenter,
  defaultZoom,
  onResetView
}) => {
  const map = useMap();
  const [coordinatesDialogOpen, setCoordinatesDialogOpen] = useState(false);
  const [latitudeInput, setLatitudeInput] = useState('');
  const [longitudeInput, setLongitudeInput] = useState('');
  const [keyboardShortcutsOpen, setKeyboardShortcutsOpen] = useState(false);
  const [demographicOverlayOpen, setDemographicOverlayOpen] = useState(false);

  // Zoom controls
  const handleZoomIn = () => {
    const currentZoom = map.getZoom();
    if (currentZoom < ZOOM_MAX) {
      map.setZoom(currentZoom + 1);
    }
  };

  const handleZoomOut = () => {
    const currentZoom = map.getZoom();
    if (currentZoom > ZOOM_MIN) {
      map.setZoom(currentZoom - 1);
    }
  };

  // Orientation controls
  const handleResetNorth = () => {
    // In leaflet, reset north just means keep current center but ensure no rotation
    const center = map.getCenter();
    map.setView(center, map.getZoom());
  };

  // Location controls
  const handleResetView = () => {
    if (onResetView) {
      onResetView();
    } else {
      map.setView(defaultCenter, defaultZoom);
    }
  };

  const handleFullExtent = () => {
    // For demonstration, we'll set to a wider view of Benton County WA
    map.setView([46.25, -119.25], 10);
  };

  const handleLocateMe = () => {
    // Get user's location and center map on it
    map.locate({ setView: true, maxZoom: 16 });
  };

  // Go to coordinates
  const handleGoToCoordinates = () => {
    try {
      const lat = parseFloat(latitudeInput);
      const lng = parseFloat(longitudeInput);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        map.setView([lat, lng], map.getZoom());
        setCoordinatesDialogOpen(false);
      }
    } catch (e) {
      console.error('Invalid coordinates', e);
    }
  };

  // Set up keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard shortcuts if a form element isn't focused
      if (document.activeElement instanceof HTMLInputElement || 
          document.activeElement instanceof HTMLTextAreaElement || 
          document.activeElement instanceof HTMLSelectElement) {
        return;
      }

      switch (e.key) {
        case '+':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        case 'h':
          handleResetView();
          break;
        case 'f':
          handleFullExtent();
          break;
        case 'n':
          handleResetNorth();
          break;
        case 'l':
          handleLocateMe();
          break;
        case 'g':
          setCoordinatesDialogOpen(true);
          break;
        case 'd':
          setDemographicOverlayOpen(prevState => !prevState);
          break;
        case '?':
          setKeyboardShortcutsOpen(true);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [map]);

  return (
    <>
      {/* Main Control Panel */}
      <div className="absolute left-3 top-3 z-[1000] flex flex-col space-y-1">
        <ControlGroup label="Zoom Controls">
          <MapButton
            onClick={handleZoomIn}
            icon={<ZoomIn size={16} />}
            tooltip="Zoom In"
            ariaLabel="Zoom in"
            shortcut="+"
          />
          <MapButton
            onClick={handleZoomOut}
            icon={<ZoomOut size={16} />}
            tooltip="Zoom Out"
            ariaLabel="Zoom out"
            shortcut="-"
          />
        </ControlGroup>

        <ControlGroup label="View Controls">
          <MapButton
            onClick={handleResetView}
            icon={<Home size={16} />}
            tooltip="Reset View"
            ariaLabel="Reset to default view"
            shortcut="h"
          />
          <MapButton
            onClick={handleFullExtent}
            icon={<Maximize size={16} />}
            tooltip="Full Extent"
            ariaLabel="Show full extent"
            shortcut="f"
          />
        </ControlGroup>

        <ControlGroup label="Orientation">
          <MapButton
            onClick={handleResetNorth}
            icon={<Compass size={16} />}
            tooltip="Reset North"
            ariaLabel="Reset north orientation"
            shortcut="n"
          />
          <MapButton
            onClick={handleLocateMe}
            icon={<Locate size={16} />}
            tooltip="Locate Me"
            ariaLabel="Find my location"
            shortcut="l"
          />
        </ControlGroup>

        <ControlGroup label="Analysis">
          <div className="w-full">
            <DemographicOverlayControl 
              className="w-full rounded-lg bg-white bg-opacity-90 shadow-md border border-gray-300 p-2 hover:bg-opacity-100 transition-all flex items-center justify-center"
              isVisible={demographicOverlayOpen}
              onToggle={() => setDemographicOverlayOpen(prev => !prev)}
            />
          </div>
        </ControlGroup>

        <ControlGroup label="Tools">
          <Dialog open={coordinatesDialogOpen} onOpenChange={setCoordinatesDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="secondary" 
                className="w-full rounded-lg bg-white bg-opacity-90 shadow-md border border-gray-300 p-2 hover:bg-opacity-100 transition-all flex items-center justify-center"
                aria-label="Go to coordinates"
              >
                <Search size={16} className="text-gray-700" />
                <span className="sr-only">Go to Coordinates</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Go to Coordinates</DialogTitle>
                <DialogDescription>
                  Enter latitude and longitude to navigate to a specific location
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input 
                      id="latitude" 
                      value={latitudeInput} 
                      onChange={(e) => setLatitudeInput(e.target.value)} 
                      placeholder="e.g. 46.2804"
                    />
                  </div>
                  <div>
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input 
                      id="longitude" 
                      value={longitudeInput} 
                      onChange={(e) => setLongitudeInput(e.target.value)} 
                      placeholder="e.g. -119.2752"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="sm:justify-end">
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="button" onClick={handleGoToCoordinates}>
                  Go
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={keyboardShortcutsOpen} onOpenChange={setKeyboardShortcutsOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="secondary" 
                className="w-full rounded-lg bg-white bg-opacity-90 shadow-md border border-gray-300 p-2 hover:bg-opacity-100 transition-all flex items-center justify-center"
                aria-label="Keyboard shortcuts"
              >
                <Keyboard size={16} className="text-gray-700" />
                <span className="sr-only">Keyboard Shortcuts</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Keyboard Shortcuts</DialogTitle>
                <DialogDescription>
                  The following keyboard shortcuts are available when the map is focused
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-1 py-2">
                <ShortcutRow key="+" shortcut="+" description="Zoom in" />
                <ShortcutRow key="-" shortcut="-" description="Zoom out" />
                <ShortcutRow key="h" shortcut="h" description="Reset to default view" />
                <ShortcutRow key="f" shortcut="f" description="Show full extent" />
                <ShortcutRow key="n" shortcut="n" description="Reset north orientation" />
                <ShortcutRow key="l" shortcut="l" description="Find my location" />
                <ShortcutRow key="g" shortcut="g" description="Go to coordinates" />
                <ShortcutRow key="d" shortcut="d" description="Toggle demographic overlay" />
                <ShortcutRow key="?" shortcut="?" description="Show keyboard shortcuts" />
              </div>
              <DialogFooter className="sm:justify-end">
                <DialogClose asChild>
                  <Button type="button">Close</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </ControlGroup>
      </div>

      {/* Scale information - could be implemented for better accessibility */}
      <div className="absolute left-3 bottom-6 z-[1000] bg-white bg-opacity-75 px-2 py-1 rounded text-xs text-gray-700">
        <div role="status" aria-live="polite">
          Current Zoom: {map.getZoom()}
        </div>
      </div>

      {/* Attribution badge with enhanced contrast */}
      <div className="absolute right-1 bottom-1 z-[1000] bg-white bg-opacity-90 px-2 py-1 rounded text-xs text-gray-800">
        <span>
          <a 
            href="https://www.openstreetmap.org/copyright" 
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-700 hover:text-blue-900"
          >
            OpenStreetMap
          </a>
          {' | '}
          <a 
            href="https://www.esri.com" 
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-700 hover:text-blue-900"
          >
            Esri
          </a>
        </span>
      </div>
    </>
  );
};

// Helper components
interface ControlGroupProps {
  children: React.ReactNode;
  label: string;
}

const ControlGroup: React.FC<ControlGroupProps> = ({ children, label }) => (
  <div className="rounded-lg overflow-hidden shadow-lg" role="group" aria-label={label}>
    <div className="flex flex-col">{children}</div>
  </div>
);

interface MapButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  tooltip: string;
  ariaLabel: string;
  shortcut?: string;
}

const MapButton: React.FC<MapButtonProps> = ({ 
  onClick, 
  icon, 
  tooltip, 
  ariaLabel,
  shortcut
}) => (
  <Button
    onClick={onClick}
    variant="secondary"
    className="rounded-none border-b border-gray-300 last:border-b-0 bg-white bg-opacity-90 hover:bg-opacity-100 flex items-center justify-center w-10 h-10"
    aria-label={ariaLabel}
    data-shortcut={shortcut}
  >
    <span className="text-gray-700">{icon}</span>
    <span className="sr-only">{tooltip}</span>
  </Button>
);

interface ShortcutRowProps {
  shortcut: string;
  description: string;
}

const ShortcutRow: React.FC<ShortcutRowProps> = ({ shortcut, description }) => (
  <div className="flex justify-between items-center py-1 border-b border-gray-200 last:border-none">
    <div className="font-mono bg-gray-100 px-2 py-0.5 rounded">{shortcut}</div>
    <div className="text-sm text-gray-600">{description}</div>
  </div>
);

export default CustomMapControls;