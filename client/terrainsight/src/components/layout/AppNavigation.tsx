import React from 'react';
import { useLocation } from 'wouter';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Home, Map, Database, BarChart2, Settings } from 'lucide-react';

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ href, icon, label, active }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href={href}>
            <div className={cn(
              "flex flex-col items-center justify-center p-2 rounded-md",
              active 
                ? "text-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}>
              <div>{icon}</div>
              <span className="text-xs mt-1">{label}</span>
            </div>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const AppNavigation: React.FC = () => {
  const [location] = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-background border-t flex justify-around items-center h-16 px-2">
      <NavItem 
        href="/" 
        icon={<Home className="h-5 w-5" />} 
        label="Home" 
        active={location === "/"} 
      />
      <NavItem 
        href="/properties" 
        icon={<Database className="h-5 w-5" />} 
        label="Properties" 
        active={location === "/properties"} 
      />
      <NavItem 
        href="/map" 
        icon={<Map className="h-5 w-5" />} 
        label="Map" 
        active={location === "/map"} 
      />
      <NavItem 
        href="/analysis" 
        icon={<BarChart2 className="h-5 w-5" />} 
        label="Analysis" 
        active={location === "/analysis"} 
      />
      <NavItem 
        href="/settings" 
        icon={<Settings className="h-5 w-5" />} 
        label="Settings" 
        active={location === "/settings"} 
      />
    </div>
  );
};

export default AppNavigation;