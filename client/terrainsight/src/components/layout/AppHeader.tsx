import React, { useState } from 'react';
import { Link } from 'wouter';
import { 
  Bell, 
  HelpCircle, 
  Menu, 
  Search, 
  Settings, 
  X,
  ChevronDown,
  MapPin,
  LayoutDashboard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { TourButton } from '@/components/TourButton';
import { useTour } from '@/contexts/TourContext';
import { AppModeIndicator } from '@/components/ui/app-mode-indicator';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

interface AppHeaderProps {
  onToggleSidebar?: () => void;
  className?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ 
  onToggleSidebar,
  className
}) => {
  const [showSearch, setShowSearch] = useState(false);
  const { hasSeenTour } = useTour();
  const taxYears = ['2023', '2024', '2025'];
  const [selectedYear, setSelectedYear] = useState('2025');

  return (
    <header 
      className={cn(
        "h-14 fixed top-0 left-0 right-0 z-50 flex items-center px-4 border-b bg-background shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center">
          {/* Mobile Sidebar Toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2 lg:hidden"
            onClick={onToggleSidebar}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
          
          {/* Logo & Brand */}
          <Link href="/">
            <div className="flex items-center mr-6 cursor-pointer">
              <div className="relative mr-3">
                <div className="relative p-2 bg-primary rounded-md">
                  <MapPin className="h-5 w-5 text-primary-foreground" />
                </div>
              </div>
              <div className="flex flex-col">
                <h1 className="text-base font-medium">
                  TerraInsight
                </h1>
                <span className="text-xs text-muted-foreground">Benton County Assessor</span>
              </div>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link href="/dashboard">
              <div className="px-3 py-2 text-sm text-foreground/70 hover:text-foreground hover:bg-accent rounded-md transition-colors cursor-pointer">
                Dashboard
              </div>
            </Link>
            <Link href="/properties">
              <div className="px-3 py-2 text-sm text-foreground/70 hover:text-foreground hover:bg-accent rounded-md transition-colors cursor-pointer">
                Properties
              </div>
            </Link>
            <Link href="/map">
              <div className="px-3 py-2 text-sm text-foreground/70 hover:text-foreground hover:bg-accent rounded-md transition-colors cursor-pointer">
                Map
              </div>
            </Link>
            <Link href="/analysis">
              <div className="px-3 py-2 text-sm text-foreground/70 hover:text-foreground hover:bg-accent rounded-md transition-colors cursor-pointer">
                Analysis
              </div>
            </Link>
          </nav>
        </div>
        
        <div className="flex items-center space-x-1">
          {/* Tax Year Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 mr-2 hidden md:flex gap-1 text-xs font-normal"
              >
                <span className="text-muted-foreground">Tax Year:</span>
                <span className="font-medium">{selectedYear}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Select Tax Year</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {taxYears.map(year => (
                <DropdownMenuItem 
                  key={year}
                  className={cn(
                    "cursor-pointer",
                    year === selectedYear && "bg-primary/10 text-primary font-medium"
                  )}
                  onClick={() => setSelectedYear(year)}
                >
                  {year}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Search toggler */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowSearch(!showSearch)}
          >
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>
          
          {/* Tour Button */}
          <TourButton 
            variant="ghost"
            size="icon"
            showTooltip={true}
            tooltipContent={hasSeenTour ? 'Restart tour' : 'Start tour'}
          />
          
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
                <span className="sr-only">Notifications</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[300px]">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="py-2 px-3 text-sm text-center text-muted-foreground">
                No new notifications
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User profile - Desktop */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="hidden md:flex items-center gap-2 pl-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium">
                  BC
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">Assessor</p>
                  <p className="text-xs text-muted-foreground">Staff</p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Help & Support</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* User profile - Mobile */}
          <Button variant="ghost" size="icon" className="md:hidden">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium">
              BC
            </div>
          </Button>
        </div>
      </div>
      
      {/* Search overlay - only shown when search is active */}
      {showSearch && (
        <div className="absolute top-full left-0 right-0 bg-background border-b shadow-md p-4 flex items-center z-50">
          <div className="flex-1 relative">
            <Search className="h-5 w-5 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search properties, parcels, or addresses..."
              className="w-full pl-10 pr-4 py-2 rounded-md border bg-background focus-visible:ring-1 focus-visible:ring-ring"
              autoFocus
            />
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="ml-2" 
            onClick={() => setShowSearch(false)}
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close search</span>
          </Button>
        </div>
      )}
    </header>
  );
};