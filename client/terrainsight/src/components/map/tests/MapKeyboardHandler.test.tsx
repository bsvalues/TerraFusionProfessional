import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { MapKeyboardHandler } from '../MapKeyboardHandler';

// Mock the useMap hook from react-leaflet
const mockMap = {
  getContainer: jest.fn(() => {
    const container = document.createElement('div');
    container.id = 'map-container';
    return container;
  }),
  panBy: jest.fn(),
  zoomIn: jest.fn(),
  zoomOut: jest.fn(),
  setView: jest.fn(),
  getZoom: jest.fn().mockReturnValue(10)
};

jest.mock('react-leaflet', () => ({
  useMap: jest.fn(() => mockMap)
}));

describe('MapKeyboardHandler', () => {
  // Mock document.body and active element
  const originalDocumentActiveElement = Object.getOwnPropertyDescriptor(document, 'activeElement');
  
  // Helper to set mock activeElement
  const setActiveElement = (el: Element | null) => {
    Object.defineProperty(document, 'activeElement', {
      configurable: true,
      value: el
    });
  };
  
  // Setup for each test
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create map container in the document
    const mapContainer = document.createElement('div');
    mapContainer.id = 'map-container';
    document.body.appendChild(mapContainer);
    
    // Mock the map container for getContainer
    mockMap.getContainer.mockReturnValue(mapContainer);
    
    // Make body the active element by default
    setActiveElement(document.body);
  });
  
  // Cleanup after each test
  afterEach(() => {
    const mapContainer = document.getElementById('map-container');
    if (mapContainer) {
      document.body.removeChild(mapContainer);
    }
    
    // Remove any skip nav links or announcements
    const skipNav = document.getElementById('map-skip-nav');
    if (skipNav) {
      skipNav.remove();
    }
    
    const announcements = document.getElementById('map-announcements');
    if (announcements) {
      announcements.remove();
    }
    
    // Restore original activeElement property
    if (originalDocumentActiveElement) {
      Object.defineProperty(document, 'activeElement', originalDocumentActiveElement);
    }
  });
  
  test('creates skip navigation link when skipNavigation is true', () => {
    render(<MapKeyboardHandler skipNavigation={true} />);
    
    const skipNavLink = document.getElementById('map-skip-nav');
    expect(skipNavLink).toBeInTheDocument();
    expect(skipNavLink?.textContent).toBe('Skip map navigation');
  });
  
  test('does not create skip navigation link when skipNavigation is false', () => {
    render(<MapKeyboardHandler skipNavigation={false} />);
    
    const skipNavLink = document.getElementById('map-skip-nav');
    expect(skipNavLink).not.toBeInTheDocument();
  });
  
  test('creates screen reader announcement element when announceChanges is true', () => {
    render(<MapKeyboardHandler announceChanges={true} />);
    
    const announcements = document.getElementById('map-announcements');
    expect(announcements).toBeInTheDocument();
    expect(announcements?.getAttribute('aria-live')).toBe('polite');
  });
  
  test('does not create screen reader announcement element when announceChanges is false', () => {
    render(<MapKeyboardHandler announceChanges={false} />);
    
    const announcements = document.getElementById('map-announcements');
    expect(announcements).not.toBeInTheDocument();
  });
  
  test('handles arrow keys for map panning when body is focused', () => {
    render(<MapKeyboardHandler />);
    
    // Set active element to body
    setActiveElement(document.body);
    
    // Simulate arrow key presses
    fireEvent.keyDown(document, { code: 'ArrowUp', key: 'ArrowUp' });
    expect(mockMap.panBy).toHaveBeenCalledWith([0, -50]);
    
    fireEvent.keyDown(document, { code: 'ArrowDown', key: 'ArrowDown' });
    expect(mockMap.panBy).toHaveBeenCalledWith([0, 50]);
    
    fireEvent.keyDown(document, { code: 'ArrowLeft', key: 'ArrowLeft' });
    expect(mockMap.panBy).toHaveBeenCalledWith([-50, 0]);
    
    fireEvent.keyDown(document, { code: 'ArrowRight', key: 'ArrowRight' });
    expect(mockMap.panBy).toHaveBeenCalledWith([50, 0]);
  });
  
  test('handles zoom keys when body is focused', () => {
    render(<MapKeyboardHandler />);
    
    // Set active element to body
    setActiveElement(document.body);
    
    // Simulate zoom in key press
    fireEvent.keyDown(document, { code: 'Equal', key: '+' });
    expect(mockMap.zoomIn).toHaveBeenCalled();
    
    // Simulate zoom out key press
    fireEvent.keyDown(document, { code: 'Minus', key: '-' });
    expect(mockMap.zoomOut).toHaveBeenCalled();
  });
  
  test('handles home key to reset view when body is focused', () => {
    render(<MapKeyboardHandler />);
    
    // Set active element to body
    setActiveElement(document.body);
    
    // Simulate home key press
    fireEvent.keyDown(document, { code: 'Home', key: 'Home' });
    expect(mockMap.setView).toHaveBeenCalled();
  });
  
  test('does not handle keypress when map is not focused and element is not body', () => {
    render(<MapKeyboardHandler />);
    
    // Create a non-map element and set it as active
    const otherElement = document.createElement('button');
    document.body.appendChild(otherElement);
    setActiveElement(otherElement);
    
    // Simulate arrow key press
    fireEvent.keyDown(document, { code: 'ArrowUp', key: 'ArrowUp' });
    expect(mockMap.panBy).not.toHaveBeenCalled();
    
    // Clean up
    document.body.removeChild(otherElement);
  });
  
  test('handles key events when map element is focused', () => {
    render(<MapKeyboardHandler />);
    
    // Set active element to map container
    setActiveElement(mockMap.getContainer());
    
    // Simulate arrow key press
    fireEvent.keyDown(document, { code: 'ArrowUp', key: 'ArrowUp' });
    expect(mockMap.panBy).toHaveBeenCalled();
  });
  
  test('does not override browser functionality for Ctrl+F', () => {
    render(<MapKeyboardHandler />);
    
    // Simulate Ctrl+F key press
    const event = new KeyboardEvent('keydown', { 
      code: 'KeyF',
      key: 'f',
      ctrlKey: true,
      bubbles: true,
      cancelable: true
    });
    
    const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
    document.dispatchEvent(event);
    
    // Should not prevent default browser behavior
    expect(preventDefaultSpy).not.toHaveBeenCalled();
  });
});