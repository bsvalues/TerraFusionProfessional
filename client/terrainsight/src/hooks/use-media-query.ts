import { useState, useEffect } from 'react';

/**
 * Hook to detect if a media query matches
 * @param query The media query to check
 * @returns boolean True if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Check if window is available (for SSR)
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia(query);
      
      // Set initial value
      setMatches(mediaQuery.matches);
      
      // Create handler function
      const handler = (event: MediaQueryListEvent) => {
        setMatches(event.matches);
      };
      
      // Add event listener
      mediaQuery.addEventListener('change', handler);
      
      // Clean up
      return () => {
        mediaQuery.removeEventListener('change', handler);
      };
    }
  }, [query]);

  return matches;
}