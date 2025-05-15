import React from 'react';
import { Link } from 'wouter';
import { Menu, Search, Settings, HelpCircle, Info, Map, Database, ChevronDown } from 'lucide-react';
import TerraInsightLogo from './TerraInsightLogo';

interface TerraInsightHeaderProps {
  onMenuToggle?: () => void;
  className?: string;
}

const TerraInsightHeader: React.FC<TerraInsightHeaderProps> = ({
  onMenuToggle,
  className = '',
}) => {
  return (
    <header 
      className={`w-full shadow-md z-50 relative ${className}`}
      style={{ 
        background: 'linear-gradient(to right, #05959A, #0080A7)',
        boxShadow: '0 4px 12px rgba(0, 104, 144, 0.15), 0 0 1px rgba(0, 0, 0, 0.1)'
      }}
    >
      {/* Glowing bottom border */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[1px]"
        style={{ 
          background: 'linear-gradient(to right, #14F0E6, #20D7D0)',
          boxShadow: '0 0 8px rgba(20, 240, 230, 0.6)'
        }}
      />
      
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center">
            {/* Mobile menu toggle */}
            <button
              onClick={onMenuToggle}
              className="mr-3 lg:hidden p-2 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="text-white w-[22px] h-[22px]" />
            </button>
            
            {/* Logo */}
            <Link to="/" className="flex items-center">
                <TerraInsightLogo size="small" variant="standard" />
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex ml-8 space-x-1">
              <NavItem icon={<Map className="w-4 h-4" />} label="Property Map" href="/map" />
              <NavItem icon={<Database className="w-4 h-4" />} label="Assessment Data" href="/data" hasDropdown />
              <NavItem icon={<Info className="w-4 h-4" />} label="Analytics" href="/analytics" hasDropdown />
            </nav>
          </div>
          
          <div className="flex items-center space-x-1">
            {/* Search */}
            <button 
              className="p-2 text-white rounded-full hover:bg-white/10 transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
            
            {/* Help */}
            <button 
              className="p-2 text-white rounded-full hover:bg-white/10 transition-colors"
              aria-label="Help"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            
            {/* Settings */}
            <button 
              className="p-2 text-white rounded-full hover:bg-white/10 transition-colors"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            
            {/* User profile - placeholder */}
            <div className="ml-2 flex items-center">
              <div 
                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-medium"
                style={{ 
                  boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.3)',
                }}
              >
                BC
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

interface NavItemProps {
  icon?: React.ReactNode;
  label: string;
  href: string;
  hasDropdown?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, href, hasDropdown }) => {
  return (
    <Link to={href} className="flex items-center px-3 py-2 text-white hover:bg-white/10 rounded-md transition-colors">
      {icon && <span className="mr-1.5">{icon}</span>}
      <span>{label}</span>
      {hasDropdown && <ChevronDown className="w-3.5 h-3.5 ml-1" />}
    </Link>
  );
};

export default TerraInsightHeader;