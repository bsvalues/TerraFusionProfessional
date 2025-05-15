import React, { useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Home, 
  Map, 
  Database, 
  BarChart2, 
  FileText, 
  Settings,
  Layers,
  BrainCog,
  Activity,
  Search,
  X,
  ChevronRight,
  Sparkles,
  Bell,
  HelpCircle,
  Check,
  List,
  ClipboardCheck
} from 'lucide-react';

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  indented?: boolean;
  onClick?: () => void;
}

const NavItem = ({ href, icon, label, active, indented, onClick }: NavItemProps) => (
  <Link href={href}>
    <div
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors cursor-pointer",
        active 
          ? "bg-primary/10 text-primary font-medium" 
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        indented && "ml-4"
      )}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </div>
  </Link>
);

interface NavGroupProps {
  title: string;
  children: React.ReactNode;
}

const NavGroup = ({ title, children }: NavGroupProps) => (
  <div className="mb-4">
    <div className="px-4 py-2">
      <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
        {title}
      </h3>
    </div>
    <div className="space-y-1">{children}</div>
  </div>
);

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export const Sidebar = ({ open, onClose }: SidebarProps) => {
  const [location] = useLocation();

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (open) {
      onClose();
    }
  }, [location, open, onClose]);

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-14 bottom-0 z-40 w-64 border-r bg-background transition-transform duration-300 ease-in-out lg:translate-x-0 lg:border-r lg:shadow-none",
          open ? "translate-x-0 shadow-lg" : "-translate-x-full"
        )}
      >
        {/* Mobile close button */}
        <div className="lg:hidden absolute right-2 top-2">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="h-full pb-10">
          <div className="px-2 py-4">
            {/* Quick search */}
            <div className="px-2 mb-6">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Quick search..."
                  className="w-full rounded-md bg-muted py-2 pl-8 pr-3 text-sm"
                />
              </div>
            </div>

            {/* Main navigation */}
            <NavGroup title="Overview">
              <NavItem 
                href="/" 
                icon={<Home className="h-4 w-4" />} 
                label="Home" 
                active={location === "/"} 
                onClick={onClose}
              />
              <NavItem 
                href="/dashboard" 
                icon={<BarChart2 className="h-4 w-4" />} 
                label="Dashboard" 
                active={location === "/dashboard"} 
                onClick={onClose}
              />
            </NavGroup>

            <NavGroup title="Properties">
              <NavItem 
                href="/properties" 
                icon={<Database className="h-4 w-4" />} 
                label="Property Explorer" 
                active={location === "/properties"} 
                onClick={onClose}
              />
              <NavItem 
                href="/map" 
                icon={<Map className="h-4 w-4" />} 
                label="Interactive Map" 
                active={location === "/map"} 
                onClick={onClose}
              />
              <NavItem 
                href="/layers" 
                icon={<Layers className="h-4 w-4" />} 
                label="Map Layers" 
                active={location === "/layers"} 
                onClick={onClose}
              />
            </NavGroup>

            <NavGroup title="Analysis">
              <NavItem 
                href="/analysis" 
                icon={<BarChart2 className="h-4 w-4" />} 
                label="Analysis" 
                active={location === "/analysis"} 
                onClick={onClose}
              />
              <NavItem 
                href="/income-approach" 
                icon={<BrainCog className="h-4 w-4" />} 
                label="Income Approach" 
                active={location === "/income-approach"} 
                onClick={onClose}
              />
              <NavItem 
                href="/scripting" 
                icon={<Sparkles className="h-4 w-4" />} 
                label="AI Playground" 
                active={location === "/scripting"} 
                onClick={onClose}
              />
            </NavGroup>

            <NavGroup title="Workflow">
              <NavItem 
                href="/workflows" 
                icon={<ClipboardCheck className="h-4 w-4" />} 
                label="Workflow Management" 
                active={location === "/workflows"} 
                onClick={onClose}
              />
              <NavItem 
                href="/updates" 
                icon={<Bell className="h-4 w-4" />} 
                label="Updates" 
                active={location === "/updates"} 
                onClick={onClose}
              />
              <NavItem 
                href="/activity" 
                icon={<Activity className="h-4 w-4" />} 
                label="Activity" 
                active={location === "/activity"} 
                onClick={onClose}
              />
              <NavItem 
                href="/tasks" 
                icon={<List className="h-4 w-4" />} 
                label="Tasks" 
                active={location === "/tasks"} 
                onClick={onClose}
              />
              <NavItem 
                href="/accuracy" 
                icon={<Check className="h-4 w-4" />} 
                label="Accuracy" 
                active={location === "/accuracy"} 
                onClick={onClose}
              />
            </NavGroup>

            <NavGroup title="System">
              <NavItem 
                href="/reports" 
                icon={<FileText className="h-4 w-4" />} 
                label="Reports" 
                active={location === "/reports"} 
                onClick={onClose}
              />
              <NavItem 
                href="/data" 
                icon={<Database className="h-4 w-4" />} 
                label="Data Management" 
                active={location === "/data"} 
                onClick={onClose}
              />
              <NavItem 
                href="/settings" 
                icon={<Settings className="h-4 w-4" />} 
                label="Settings" 
                active={location === "/settings"} 
                onClick={onClose}
              />
              <NavItem 
                href="/help" 
                icon={<HelpCircle className="h-4 w-4" />} 
                label="Help & Support" 
                active={location === "/help"} 
                onClick={onClose}
              />
            </NavGroup>
          </div>
        </ScrollArea>
      </div>
    </>
  );
};