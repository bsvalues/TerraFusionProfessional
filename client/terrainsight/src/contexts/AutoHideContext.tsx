import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode, useMemo } from 'react';

interface AutoHideState {
  [key: string]: {
    visible: boolean;
    pinned: boolean;
    lastInteraction: number;
    timeout: number;
  };
}

interface AutoHideContextType {
  state: AutoHideState;
  setVisible: (id: string, visible: boolean) => void;
  setPinned: (id: string, pinned: boolean) => void;
  registerPanel: (id: string, defaultVisible: boolean, timeout: number) => void;
  resetTimer: (id: string) => void;
}

// Create context with default values
const AutoHideContext = createContext<AutoHideContextType>({
  state: {},
  setVisible: () => {},
  setPinned: () => {},
  registerPanel: () => {},
  resetTimer: () => {},
});

interface AutoHideProviderProps {
  children: ReactNode;
}

export const AutoHideProvider: React.FC<AutoHideProviderProps> = ({ children }) => {
  const [state, setState] = useState<AutoHideState>({});
  const [timeouts, setTimeouts] = useState<{[key: string]: NodeJS.Timeout}>({});

  // Register a new panel with the context
  const registerPanel = useCallback((id: string, defaultVisible = true, timeout = 5000) => {
    setState(prevState => {
      // Only initialize if it doesn't already exist
      if (!prevState[id]) {
        return {
          ...prevState,
          [id]: {
            visible: defaultVisible,
            pinned: false,
            lastInteraction: Date.now(),
            timeout,
          },
        };
      }
      return prevState;
    });
  }, []);

  // Set panel visibility
  const setVisible = useCallback((id: string, visible: boolean) => {
    setState(prevState => {
      if (!prevState[id]) return prevState;
      
      return {
        ...prevState,
        [id]: {
          ...prevState[id],
          visible,
          lastInteraction: Date.now(),
        },
      };
    });
  }, []);

  // Set panel pinned state
  const setPinned = useCallback((id: string, pinned: boolean) => {
    setState(prevState => {
      if (!prevState[id]) return prevState;
      
      return {
        ...prevState,
        [id]: {
          ...prevState[id],
          pinned,
          lastInteraction: Date.now(),
        },
      };
    });
  }, []);

  // Reset interaction timer
  const resetTimer = useCallback((id: string) => {
    setState(prevState => {
      if (!prevState[id]) return prevState;
      
      return {
        ...prevState,
        [id]: {
          ...prevState[id],
          lastInteraction: Date.now(),
        },
      };
    });
  }, []);

  // Setup auto-hide timers for each panel
  useEffect(() => {
    // Clear any existing timeouts first
    Object.values(timeouts).forEach(timeout => clearTimeout(timeout));
    const newTimeouts: {[key: string]: NodeJS.Timeout} = {};
    
    // Setup new timeouts for each panel
    Object.entries(state).forEach(([id, panelState]) => {
      // Only setup timeout if panel is visible and not pinned
      if (panelState.visible && !panelState.pinned) {
        const timeSinceLastInteraction = Date.now() - panelState.lastInteraction;
        const remainingTime = Math.max(0, panelState.timeout - timeSinceLastInteraction);
        
        newTimeouts[id] = setTimeout(() => {
          setState(prevState => ({
            ...prevState,
            [id]: {
              ...prevState[id],
              visible: false,
            },
          }));
        }, remainingTime);
      }
    });
    
    setTimeouts(newTimeouts);
    
    // Cleanup timeouts on unmount
    return () => {
      Object.values(newTimeouts).forEach(timeout => clearTimeout(timeout));
    };
  }, [state]);

  const contextValue = useMemo(() => ({
    state,
    setVisible,
    setPinned,
    registerPanel,
    resetTimer,
  }), [state, setVisible, setPinned, registerPanel, resetTimer]);

  return (
    <AutoHideContext.Provider value={contextValue}>
      {children}
    </AutoHideContext.Provider>
  );
};

// Custom hook for components to use the auto-hide functionality
export function useAutoHide(id: string, defaultVisible = true, timeout = 5000) {
  const { state, setVisible, setPinned, registerPanel, resetTimer } = useContext(AutoHideContext);
  
  // Register this panel with the context if it's not already registered
  useEffect(() => {
    registerPanel(id, defaultVisible, timeout);
  }, [id, defaultVisible, registerPanel, timeout]);
  
  // Get current state for this panel
  const panelState = state[id] || {
    visible: defaultVisible,
    pinned: false,
    lastInteraction: Date.now(),
    timeout,
  };
  
  // Create a handler to toggle the pinned state
  const togglePin = useCallback(() => {
    setPinned(id, !panelState.pinned);
  }, [id, panelState.pinned, setPinned]);
  
  // Wrap setVisible to reset timer
  const setVisibleWithReset = useCallback((visible: boolean) => {
    setVisible(id, visible);
  }, [id, setVisible]);
  
  // Reset the timer when component interacts
  const handleInteraction = useCallback(() => {
    resetTimer(id);
  }, [id, resetTimer]);
  
  return {
    visible: panelState.visible,
    pinned: panelState.pinned,
    setVisible: setVisibleWithReset,
    togglePin,
    resetTimer: handleInteraction,
  };
}

export default AutoHideContext;