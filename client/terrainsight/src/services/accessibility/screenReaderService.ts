/**
 * Service for making announcements to screen readers
 */
export class ScreenReaderAnnouncer {
  private announcer: HTMLElement | null = null;
  private announcerPoliteness: 'polite' | 'assertive' = 'polite';

  constructor() {
    // Initialize the announcer element when service is created
    this.initialize();
  }

  /**
   * Initialize the screen reader announcer DOM element
   */
  private initialize(): void {
    // Only initialize if we're in a browser environment
    if (typeof document === 'undefined') return;

    // Create the announcer element if it doesn't exist
    if (!this.announcer) {
      this.announcer = document.createElement('div');
      this.announcer.setAttribute('id', 'screen-reader-announcer');
      this.announcer.setAttribute('aria-live', this.announcerPoliteness);
      this.announcer.setAttribute('aria-atomic', 'true');
      this.announcer.setAttribute('role', 'status');
      
      // Make it invisible but still available to screen readers
      this.announcer.style.position = 'absolute';
      this.announcer.style.width = '1px';
      this.announcer.style.height = '1px';
      this.announcer.style.margin = '-1px';
      this.announcer.style.padding = '0';
      this.announcer.style.overflow = 'hidden';
      this.announcer.style.clip = 'rect(0, 0, 0, 0)';
      this.announcer.style.border = '0';
      
      // Add to DOM
      document.body.appendChild(this.announcer);
    }
  }

  /**
   * Set the politeness level of the announcer
   * @param politeness 'polite' for non-interrupting or 'assertive' for immediate announcement
   */
  setPoliteness(politeness: 'polite' | 'assertive'): void {
    this.announcerPoliteness = politeness;
    
    if (this.announcer) {
      this.announcer.setAttribute('aria-live', politeness);
    }
  }

  /**
   * Announce a message to screen readers
   * @param message The message to announce
   */
  announce(message: string): void {
    if (!this.announcer) {
      this.initialize();
    }
    
    if (this.announcer) {
      // Clear existing content first to ensure announcement
      this.announcer.textContent = '';
      
      // Use setTimeout to ensure DOM update and announcement
      setTimeout(() => {
        if (this.announcer) {
          this.announcer.textContent = message;
        }
      }, 50);
    }
  }

  /**
   * Announce a map update to screen readers
   * @param properties Array of properties on the map
   */
  announceMapUpdate(properties: any[]): void {
    if (properties.length === 0) {
      this.announce('Map updated. No properties are currently displayed.');
    } else {
      this.announce(`Map updated. ${properties.length} ${properties.length === 1 ? 'property' : 'properties'} displayed.`);
    }
  }

  /**
   * Announce property selection to screen readers
   * @param property The selected property
   */
  announcePropertySelection(property: any): void {
    if (!property) {
      this.announce('Property selection cleared.');
    } else {
      this.announce(`Selected property: ${property.address}. Value: ${property.value || 'unknown'}.`);
    }
  }

  /**
   * Announce filter changes to screen readers
   * @param filterCount Number of active filters
   */
  announceFilterChange(filterCount: number): void {
    if (filterCount === 0) {
      this.announce('All filters cleared. Showing all properties.');
    } else {
      this.announce(`Filters applied. ${filterCount} ${filterCount === 1 ? 'filter' : 'filters'} active.`);
    }
  }

  /**
   * Announce report generation to screen readers
   * @param reportType Type of report being generated
   */
  announceReportGeneration(reportType: string): void {
    this.announce(`Generating ${reportType} report. This may take a moment.`);
  }

  /**
   * Announce successful report generation to screen readers
   * @param reportType Type of report that was generated
   */
  announceReportComplete(reportType: string): void {
    this.announce(`${reportType} report generation complete. Download is starting.`);
  }
}

// Create a singleton instance
export const screenReaderAnnouncer = new ScreenReaderAnnouncer();