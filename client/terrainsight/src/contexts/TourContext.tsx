import React, { createContext, useContext, useState, useEffect } from 'react';

interface TourContextProps {
  isActive: boolean;
  hasSeenTour: boolean;
  startTour: () => void;
  endTour: () => void;
  goToStep: (step: number) => void;
  currentStep: number;
}

const TourContext = createContext<TourContextProps>({
  isActive: false,
  hasSeenTour: false,
  startTour: () => {},
  endTour: () => {},
  goToStep: () => {},
  currentStep: 0,
});

export const useTour = () => useContext(TourContext);

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [hasSeenTour, setHasSeenTour] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Check if the user has seen the tour before
  useEffect(() => {
    const seenTour = localStorage.getItem('hasSeenTour');
    
    if (seenTour) {
      setHasSeenTour(true);
    }
  }, []);

  const startTour = () => {
    setIsActive(true);
    setCurrentStep(0);
  };

  const endTour = () => {
    setIsActive(false);
    // Mark that the user has seen the tour
    localStorage.setItem('hasSeenTour', 'true');
    setHasSeenTour(true);
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
  };

  return (
    <TourContext.Provider 
      value={{ 
        isActive, 
        hasSeenTour, 
        startTour, 
        endTour, 
        goToStep, 
        currentStep 
      }}
    >
      {children}
    </TourContext.Provider>
  );
};