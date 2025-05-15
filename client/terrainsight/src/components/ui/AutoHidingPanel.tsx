import React, { ReactNode, useEffect, useState, useCallback } from 'react';
import { useAutoHide } from '@/contexts/AutoHideContext';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { PinIcon, PinOffIcon, X, ArrowLeft, ArrowRight, MinimizeIcon, MaximizeIcon } from 'lucide-react';

export interface AutoHidingPanelProps {
  id: string;
  defaultVisible?: boolean;
  hideTimeout?: number;
  position?: 'left' | 'right' | 'top' | 'bottom';
  title?: string;
  width?: string;
  height?: string;
  className?: string;
  children: ReactNode;
  showPin?: boolean;
  showClose?: boolean;
  showMinimize?: boolean;
  allowKeyboardShortcut?: boolean;
  onVisibilityChange?: (visible: boolean) => void;
}

export const AutoHidingPanel: React.FC<AutoHidingPanelProps> = ({
  id,
  defaultVisible = true,
  hideTimeout = 5000,
  position = 'left',
  title,
  width = '320px',
  height = 'auto',
  className = '',
  children,
  showPin = true,
  showClose = true,
  showMinimize = true,
  allowKeyboardShortcut = true,
  onVisibilityChange,
}) => {
  const { visible, pinned, setVisible, togglePin, resetTimer } = useAutoHide(id, defaultVisible, hideTimeout);
  const [minimized, setMinimized] = useState(false);
  
  // Notify parent component of visibility changes
  useEffect(() => {
    if (onVisibilityChange) {
      onVisibilityChange(visible);
    }
  }, [visible, onVisibilityChange]);
  
  // Handle keyboard shortcuts
  useEffect(() => {
    if (!allowKeyboardShortcut) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift + first letter of ID toggles panel visibility
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === id.charAt(0).toLowerCase()) {
        setVisible(!visible);
        e.preventDefault();
      }
      
      // Ctrl+Alt + first letter of ID toggles pin state
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === id.charAt(0).toLowerCase()) {
        togglePin();
        e.preventDefault();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [id, allowKeyboardShortcut, visible, setVisible, togglePin]);
  
  // Define styles based on position
  const getPositionalStyles = useCallback(() => {
    const baseStyles = {
      position: 'absolute',
      zIndex: 10,
      backgroundColor: 'white',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      borderRadius: '0.375rem',
      transition: 'all 0.3s ease-in-out',
      opacity: visible ? 1 : 0,
      pointerEvents: visible ? 'auto' : 'none',
    };
    
    switch(position) {
      case 'left':
        return {
          ...baseStyles,
          left: visible ? '1rem' : '-320px',
          top: '5rem',
          height,
          width: minimized ? '40px' : width,
        };
      case 'right':
        return {
          ...baseStyles,
          right: visible ? '1rem' : '-320px',
          top: '5rem',
          height,
          width: minimized ? '40px' : width,
        };
      case 'top':
        return {
          ...baseStyles,
          left: '50%',
          transform: `translateX(-50%) translateY(${visible ? 0 : '-100%'})`,
          top: '1rem',
          width,
          height: minimized ? '40px' : height,
        };
      case 'bottom':
        return {
          ...baseStyles,
          left: '50%',
          transform: `translateX(-50%) translateY(${visible ? 0 : '100%'})`,
          bottom: '1rem',
          width,
          height: minimized ? '40px' : height,
        };
      default:
        return baseStyles;
    }
  }, [visible, position, width, height, minimized]);
  
  const toggleMinimize = () => {
    setMinimized(!minimized);
    resetTimer();
  };
  
  const handleClose = () => {
    setVisible(false);
  };
  
  const handlePinToggle = () => {
    togglePin();
    resetTimer();
  };
  
  // Create interaction handlers to reset the timer
  const handleMouseMove = () => resetTimer();
  const handleClick = () => resetTimer();
  
  return (
    <div 
      className={cn(
        'auto-hiding-panel',
        className,
        {
          'pinned': pinned,
          'minimized': minimized,
          [`position-${position}`]: true,
        }
      )}
      style={getPositionalStyles() as React.CSSProperties}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      data-testid={`panel-${id}`}
      aria-hidden={!visible}
    >
      <div className="panel-header flex items-center justify-between p-2 bg-slate-100 rounded-t-md">
        {title && (
          <h3 className="text-sm font-medium truncate flex-1">{title}</h3>
        )}
        
        <div className="flex space-x-1">
          {showMinimize && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7" 
              onClick={toggleMinimize}
              aria-label={minimized ? 'Maximize panel' : 'Minimize panel'}
            >
              {minimized ? <MaximizeIcon size={14} /> : <MinimizeIcon size={14} />}
            </Button>
          )}
          
          {showPin && (
            <Button 
              variant={pinned ? "default" : "ghost"} 
              size="icon" 
              className="h-7 w-7" 
              onClick={handlePinToggle}
              aria-label={pinned ? 'Unpin panel' : 'Pin panel'}
              aria-pressed={pinned}
            >
              {pinned ? <PinIcon size={14} /> : <PinOffIcon size={14} />}
            </Button>
          )}
          
          {showClose && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7" 
              onClick={handleClose}
              aria-label="Close panel"
            >
              <X size={14} />
            </Button>
          )}
        </div>
      </div>
      
      {!minimized && (
        <div className="panel-content p-3 overflow-auto">
          {children}
        </div>
      )}
      
      {minimized && (
        <div className="minimized-indicator flex items-center justify-center h-full">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleMinimize}
            aria-label="Expand panel"
          >
            {position === 'left' ? <ArrowRight size={16} /> : 
             position === 'right' ? <ArrowLeft size={16} /> :
             <MaximizeIcon size={16} />}
          </Button>
        </div>
      )}
    </div>
  );
};

export default AutoHidingPanel;