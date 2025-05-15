import React, { createContext, ReactNode, useContext, useState, useEffect } from 'react';
import { screenReaderAnnouncer } from '../services/accessibility/screenReaderService';

/**
 * Map accessibility context props
 */
export interface MapAccessibilityContextProps {
  /** Enable or disable high contrast mode */
  highContrastMode: boolean;
  /** Toggle high contrast mode */
  toggleHighContrastMode: () => void;
  
  /** Enable or disable keyboard navigation */
  keyboardNavigation: boolean;
  /** Toggle keyboard navigation */
  toggleKeyboardNavigation: () => void;
  
  /** Enable or disable screen reader announcements */
  screenReaderAnnouncements: boolean;
  /** Toggle screen reader announcements */
  toggleScreenReaderAnnouncements: () => void;
  
  /** Current font size scaling factor */
  fontSizeScale: number;
  /** Increase font size */
  increaseFontSize: () => void;
  /** Decrease font size */
  decreaseFontSize: () => void;
  /** Reset font size to default */
  resetFontSize: () => void;
  
  /** Enable or disable reduced motion */
  reducedMotion: boolean;
  /** Toggle reduced motion */
  toggleReducedMotion: () => void;
  
  /** Announce a message to screen readers */
  announceToScreenReader: (message: string) => void;
}

// Create context with default values
const MapAccessibilityContext = createContext<MapAccessibilityContextProps>({
  highContrastMode: false,
  toggleHighContrastMode: () => {},
  
  keyboardNavigation: false,
  toggleKeyboardNavigation: () => {},
  
  screenReaderAnnouncements: true,
  toggleScreenReaderAnnouncements: () => {},
  
  fontSizeScale: 1,
  increaseFontSize: () => {},
  decreaseFontSize: () => {},
  resetFontSize: () => {},
  
  reducedMotion: false,
  toggleReducedMotion: () => {},
  
  announceToScreenReader: () => {}
});

// Local storage key for saving preferences
const STORAGE_KEY = 'map_accessibility_preferences';

/**
 * Provider component for map accessibility settings
 */
export const MapAccessibilityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State for accessibility preferences
  const [highContrastMode, setHighContrastMode] = useState(false);
  const [keyboardNavigation, setKeyboardNavigation] = useState(false);
  const [screenReaderAnnouncements, setScreenReaderAnnouncements] = useState(true);
  const [fontSizeScale, setFontSizeScale] = useState(1);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Load preferences from local storage on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem(STORAGE_KEY);
    
    if (savedPreferences) {
      try {
        const preferences = JSON.parse(savedPreferences);
        
        setHighContrastMode(preferences.highContrastMode || false);
        setKeyboardNavigation(preferences.keyboardNavigation || false);
        setScreenReaderAnnouncements(preferences.screenReaderAnnouncements !== false); // Default to true
        setFontSizeScale(preferences.fontSizeScale || 1);
        setReducedMotion(preferences.reducedMotion || false);
      } catch (e) {
        console.error('Failed to parse accessibility preferences', e);
      }
    }
  }, []);

  // Save preferences when they change
  useEffect(() => {
    const preferences = {
      highContrastMode,
      keyboardNavigation,
      screenReaderAnnouncements,
      fontSizeScale,
      reducedMotion
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    
    // Apply reduced motion preference to CSS
    if (reducedMotion) {
      document.documentElement.style.setProperty('--reduced-motion', 'reduce');
    } else {
      document.documentElement.style.setProperty('--reduced-motion', 'no-preference');
    }
    
    // Apply high contrast mode to body class
    if (highContrastMode) {
      document.body.classList.add('high-contrast-mode');
    } else {
      document.body.classList.remove('high-contrast-mode');
    }
    
    // Apply font size scale to CSS variable
    document.documentElement.style.setProperty('--font-size-scale', fontSizeScale.toString());
  }, [highContrastMode, keyboardNavigation, screenReaderAnnouncements, fontSizeScale, reducedMotion]);

  // Toggle functions
  const toggleHighContrastMode = () => setHighContrastMode(prev => !prev);
  const toggleKeyboardNavigation = () => setKeyboardNavigation(prev => !prev);
  const toggleScreenReaderAnnouncements = () => setScreenReaderAnnouncements(prev => !prev);
  const toggleReducedMotion = () => setReducedMotion(prev => !prev);

  // Font size functions
  const increaseFontSize = () => setFontSizeScale(prev => Math.min(prev + 0.1, 1.5));
  const decreaseFontSize = () => setFontSizeScale(prev => Math.max(prev - 0.1, 0.8));
  const resetFontSize = () => setFontSizeScale(1);

  // Screen reader announcement function
  const announceToScreenReader = (message: string) => {
    if (screenReaderAnnouncements) {
      screenReaderAnnouncer.announce(message);
    }
  };

  const contextValue: MapAccessibilityContextProps = {
    highContrastMode,
    toggleHighContrastMode,
    
    keyboardNavigation,
    toggleKeyboardNavigation,
    
    screenReaderAnnouncements,
    toggleScreenReaderAnnouncements,
    
    fontSizeScale,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    
    reducedMotion,
    toggleReducedMotion,
    
    announceToScreenReader
  };

  return (
    <MapAccessibilityContext.Provider value={contextValue}>
      {children}
    </MapAccessibilityContext.Provider>
  );
};

/**
 * Hook to use map accessibility settings
 */
export const useMapAccessibility = (): MapAccessibilityContextProps => {
  return useContext(MapAccessibilityContext);
};