import { useEffect, useState, useCallback } from 'react';
import introJs from 'intro.js';
import 'intro.js/introjs.css';
import { useToast } from '@/hooks/use-toast';

// Define tour configuration types
export type TourStep = {
  element: string;
  intro: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  title?: string;
};

export type TourOptions = {
  showStepNumbers?: boolean;
  showBullets?: boolean;
  showProgress?: boolean;
  nextLabel?: string;
  prevLabel?: string;
  skipLabel?: string;
  doneLabel?: string;
  hidePrev?: boolean;
  hideNext?: boolean;
  exitOnOverlayClick?: boolean;
  exitOnEsc?: boolean;
  tooltipClass?: string;
  highlightClass?: string;
  disableInteraction?: boolean;
};

// localStorage key for tracking if tour has been completed
const TOUR_COMPLETED_KEY = 'spatialest-tour-completed';

/**
 * A hook that manages application guided tours using IntroJS
 */
export function useGuidedTour(tourId: string, steps: TourStep[], options?: TourOptions) {
  const [isTourActive, setIsTourActive] = useState<boolean>(false);
  const [hasCompletedTour, setHasCompletedTour] = useState<boolean>(false);
  const { toast } = useToast();
  
  // Check localStorage on mount to see if tour has been completed
  useEffect(() => {
    const completedTours = localStorage.getItem(TOUR_COMPLETED_KEY);
    if (completedTours) {
      try {
        const parsed = JSON.parse(completedTours);
        setHasCompletedTour(parsed.includes(tourId));
      } catch (error) {
        console.error('Error parsing completed tours from localStorage', error);
      }
    }
  }, [tourId]);
  
  // Start the tour with the given steps and options
  const startTour = useCallback(() => {
    const intro = introJs();
    
    // Convert our steps to IntroJS format
    const introSteps = steps.map(step => ({
      element: step.element,
      intro: step.intro,
      position: step.position || 'bottom',
      title: step.title
    }));
    
    intro.setOptions({
      steps: introSteps,
      showStepNumbers: options?.showStepNumbers ?? true,
      showBullets: options?.showBullets ?? true,
      showProgress: options?.showProgress ?? true,
      nextLabel: options?.nextLabel ?? 'Next →',
      prevLabel: options?.prevLabel ?? '← Back',
      skipLabel: options?.skipLabel ?? 'Skip',
      doneLabel: options?.doneLabel ?? 'Done',
      hidePrev: options?.hidePrev ?? false,
      hideNext: options?.hideNext ?? false,
      exitOnOverlayClick: options?.exitOnOverlayClick ?? false,
      exitOnEsc: options?.exitOnEsc ?? true,
      tooltipClass: options?.tooltipClass ?? 'spatialest-tour-tooltip',
      highlightClass: options?.highlightClass ?? 'spatialest-tour-highlight',
      disableInteraction: options?.disableInteraction ?? false,
    });
    
    // Set up event handlers
    intro.onbeforechange(function() {
      // Before changing step
      return true; // Always allow steps to change
    });
    
    intro.onchange(function(targetElement) {
      // On step change
      console.log('Changed to step for element:', targetElement);
    });
    
    intro.oncomplete(() => {
      setIsTourActive(false);
      setHasCompletedTour(true);
      
      // Save completion state to localStorage
      const completedTours = localStorage.getItem(TOUR_COMPLETED_KEY);
      let tours = [];
      
      if (completedTours) {
        try {
          tours = JSON.parse(completedTours);
        } catch (error) {
          console.error('Error parsing completed tours from localStorage', error);
        }
      }
      
      if (!tours.includes(tourId)) {
        tours.push(tourId);
        localStorage.setItem(TOUR_COMPLETED_KEY, JSON.stringify(tours));
      }
      
      toast({
        title: 'Tour Completed',
        description: 'You can restart the tour anytime from the help menu.',
        duration: 5000,
      });
    });
    
    intro.onexit(() => {
      setIsTourActive(false);
    });
    
    setIsTourActive(true);
    intro.start();
    
    // Store intro instance
    const introInstance = intro;
    
    // Return cleanup function
    return () => {
      // Make sure to call exit with proper arguments if needed by Intro.js
      try {
        introInstance.exit(true);
      } catch (error) {
        console.error('Error exiting intro:', error);
      }
    };
  }, [steps, options, tourId, toast]);
  
  // Reset the tour completion status
  const resetTourState = useCallback(() => {
    const completedTours = localStorage.getItem(TOUR_COMPLETED_KEY);
    
    if (completedTours) {
      try {
        let tours = JSON.parse(completedTours);
        tours = tours.filter((id: string) => id !== tourId);
        localStorage.setItem(TOUR_COMPLETED_KEY, JSON.stringify(tours));
        setHasCompletedTour(false);
      } catch (error) {
        console.error('Error parsing completed tours from localStorage', error);
      }
    }
  }, [tourId]);
  
  return {
    isTourActive,
    hasCompletedTour,
    startTour,
    resetTourState
  };
}

export default useGuidedTour;