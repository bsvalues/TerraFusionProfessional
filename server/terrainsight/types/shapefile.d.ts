declare module 'shapefile' {
  import { Feature, Geometry } from 'geojson';
  
  interface Source {
    /**
     * Read the next feature from the shapefile
     */
    read(): Promise<{ done: boolean, value: Feature }>;
    
    /**
     * Close the source
     */
    close(): void;
  }
  
  /**
   * Open a shapefile and return a source object for reading
   * @param shpPath Path to the .shp file
   * @param dbfPath Path to the .dbf file
   */
  function open(shpPath: string, dbfPath: string): Promise<Source>;
  
  export { open, Source };
}