/**
 * Browser Compatibility Polyfills
 * 
 * This file contains polyfills for Node.js-specific APIs that are not available in browsers.
 * Import this file at the entry point of the application (main.tsx) to ensure compatibility.
 */

// Buffer polyfill using Uint8Array
class BufferPolyfill {
  static from(data: string | ArrayBuffer | ArrayBufferView, encoding?: string): Uint8Array {
    if (typeof data === 'string') {
      const encoder = new TextEncoder();
      return encoder.encode(data);
    }
    
    if (data instanceof ArrayBuffer) {
      return new Uint8Array(data);
    }
    
    if (ArrayBuffer.isView(data)) {
      return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    }
    
    throw new Error('Unsupported data type for Buffer.from');
  }

  static isBuffer(obj: any): boolean {
    return obj instanceof Uint8Array;
  }

  static alloc(size: number, fill?: number): Uint8Array {
    const buffer = new Uint8Array(size);
    if (fill !== undefined) {
      buffer.fill(fill);
    }
    return buffer;
  }
}

// EventEmitter polyfill for node:events
class EventEmitterPolyfill {
  private events: Record<string, Array<(...args: any[]) => void>> = {};

  constructor() {
    this.events = {};
  }

  // Add event listener
  on(event: string, listener: (...args: any[]) => void): this {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    return this;
  }

  // Add one-time event listener
  once(event: string, listener: (...args: any[]) => void): this {
    const onceWrapper = (...args: any[]) => {
      listener(...args);
      this.removeListener(event, onceWrapper);
    };
    return this.on(event, onceWrapper);
  }

  // Remove event listener
  removeListener(event: string, listener: (...args: any[]) => void): this {
    if (this.events[event]) {
      const idx = this.events[event].indexOf(listener);
      if (idx !== -1) {
        this.events[event].splice(idx, 1);
      }
    }
    return this;
  }

  // Remove all listeners for an event
  removeAllListeners(event?: string): this {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
    return this;
  }

  // Emit an event
  emit(event: string, ...args: any[]): boolean {
    if (!this.events[event]) {
      return false;
    }
    
    this.events[event].forEach(listener => {
      listener(...args);
    });
    
    return true;
  }

  // List listeners for an event
  listeners(event: string): Array<(...args: any[]) => void> {
    return this.events[event] || [];
  }
}

// Create a mock for the node:events module
class NodeEventsPolyfill {
  // Create a static import/require handler for node:events
  static EventEmitter = EventEmitterPolyfill;
  
  // Static method to get the module
  static getModule() {
    return { EventEmitter: EventEmitterPolyfill };
  }
}

// Add polyfills to the global scope
if (typeof window !== 'undefined') {
  // Add Buffer polyfill
  if (!window.Buffer) {
    (window as any).Buffer = BufferPolyfill;
  }
  
  // Add EventEmitter polyfill
  (window as any).EventEmitter = EventEmitterPolyfill;
  
  // Add the node:events module to the window object
  (window as any).NodeEvents = NodeEventsPolyfill;
  
  // Monkey patch specific external modules that use node:events
  // This directly handles modules that import the EventEmitter class
  try {
    // Create a fake exports object to mock the node:events module
    const mockExports = { EventEmitter: EventEmitterPolyfill };
    
    // Attach it to window for modules to find
    (window as any).mockNodeModules = {
      'node:events': mockExports,
      'events': mockExports
    };
  } catch (error) {
    console.error('Error setting up node:events mock:', error);
  }
}

console.log('Browser compatibility polyfills loaded');