/**
 * App mode configuration and initialization utilities
 */

// Constants
const APP_MODE_KEY = 'app_mode';
const MODE_STANDALONE = 'standalone';
const MODE_INTEGRATED = 'integrated';

/**
 * Initialize the application mode based on URL parameters or localStorage
 * This is called when the application starts
 */
export function initAppMode(): string {
  // Check URL parameters first (for iframe embedding scenarios)
  const urlParams = new URLSearchParams(window.location.search);
  const modeParam = urlParams.get('mode');
  
  // Get saved mode from localStorage if exists
  const savedMode = localStorage.getItem(APP_MODE_KEY);
  
  // Determine which mode to use
  let mode = MODE_STANDALONE; // Default mode
  
  if (modeParam === MODE_INTEGRATED) {
    // URL parameter overrides saved settings
    mode = MODE_INTEGRATED;
    localStorage.setItem(APP_MODE_KEY, mode);
  } else if (savedMode) {
    // Use saved mode if available
    mode = savedMode;
  }
  
  // Apply mode-specific configurations
  applyAppMode(mode);
  
  return mode;
}

/**
 * Set the app mode and apply related configurations
 */
export function setAppMode(mode: string): void {
  localStorage.setItem(APP_MODE_KEY, mode);
  applyAppMode(mode);
}

/**
 * Toggle between standalone and integrated modes
 */
export function toggleAppMode(): string {
  const currentMode = localStorage.getItem(APP_MODE_KEY) || MODE_STANDALONE;
  const newMode = currentMode === MODE_STANDALONE ? MODE_INTEGRATED : MODE_STANDALONE;
  
  setAppMode(newMode);
  return newMode;
}

/**
 * Get the current app mode
 */
export function getAppMode(): string {
  return localStorage.getItem(APP_MODE_KEY) || MODE_STANDALONE;
}

/**
 * Check if the app is in standalone mode
 */
export function isStandaloneMode(): boolean {
  return getAppMode() === MODE_STANDALONE;
}

/**
 * Apply mode-specific configurations
 */
function applyAppMode(mode: string): void {
  if (mode === MODE_INTEGRATED) {
    // Apply integrated mode settings
    document.body.classList.add('integrated-mode');
    document.body.classList.remove('standalone-mode');
  } else {
    // Apply standalone mode settings
    document.body.classList.add('standalone-mode');
    document.body.classList.remove('integrated-mode');
  }
}