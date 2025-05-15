// Using a browser-compatible mock for FTP client
// The actual implementation would need a server-side proxy to work with FTP
// since browsers can't directly connect to FTP servers

// Mock types to match basic-ftp
interface FileInfo {
  name: string;
  isDirectory: boolean;
  size: number;
  rawModifiedAt?: string;
}

// Mock FTP client for browser compatibility
class Client {
  ftp = { verbose: false };
  closed = false;
  
  async access(_config: any): Promise<void> {
    // Mock implementation
    console.log('Mock FTP client connected');
    return Promise.resolve();
  }
  
  close(): void {
    this.closed = true;
    console.log('Mock FTP client closed');
  }
  
  async list(_path?: string): Promise<FileInfo[]> {
    // Return mock data
    return Promise.resolve([
      { name: 'properties.csv', isDirectory: false, size: 1024, rawModifiedAt: new Date().toISOString() },
      { name: 'images', isDirectory: true, size: 0, rawModifiedAt: new Date().toISOString() },
      { name: 'tax_data.csv', isDirectory: false, size: 2048, rawModifiedAt: new Date().toISOString() }
    ]);
  }
  
  async cd(_path: string): Promise<void> {
    // Mock implementation
    return Promise.resolve();
  }
  
  async downloadTo(writable: any, _remotePath: string): Promise<void> {
    // Create mock CSV data
    const mockData = `id,address,city,state,zipCode,price,bedrooms,bathrooms,sqft
1,123 Main St,Springfield,IL,62701,250000,3,2,1800
2,456 Elm St,Springfield,IL,62702,180000,2,1,1200
3,789 Oak St,Springfield,IL,62703,320000,4,3,2400
4,101 Pine St,Springfield,IL,62704,210000,3,2,1600
5,202 Maple St,Springfield,IL,62705,275000,3,2.5,2000`;
    
    // Convert string to UTF-8 encoded Uint8Array
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(mockData);
    
    // Write to the writable stream
    writable.write(uint8Array);
    
    return Promise.resolve();
  }
  
  async pwd(): Promise<string> {
    return Promise.resolve('/data');
  }
}

export interface FTPConnectionConfig {
  host: string;
  port?: number;
  user?: string;
  password?: string;
  secure?: boolean;
}

export interface FTPDirectoryItem {
  name: string;
  isDirectory: boolean;
  size: number;
  rawModifiedAt?: string;
}

/**
 * FTPDataConnector - A service for connecting to and interacting with FTP servers
 * specifically designed for ETL data migration tasks in the SpatialEst application.
 */
export class FTPDataConnector {
  private client: Client;
  private config: FTPConnectionConfig | null = null;
  private isConnected: boolean = false;

  constructor() {
    this.client = new Client();
    this.client.ftp.verbose = true; // Enable for debugging
  }

  /**
   * Connect to an FTP server
   * @param config FTP connection configuration
   * @returns Promise resolving to true if connection is successful
   */
  async connect(config: FTPConnectionConfig): Promise<boolean> {
    try {
      this.config = config;
      await this.client.access({
        host: config.host,
        port: config.port || 21,
        user: config.user || 'anonymous',
        password: config.password || 'anonymous@',
        secure: config.secure || false
      });
      
      this.isConnected = true;
      return true;
    } catch (error) {
      console.error('FTP connection error:', error);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Check if currently connected to FTP server
   */
  isConnectionActive(): boolean {
    return this.isConnected && !this.client.closed;
  }

  /**
   * Close the FTP connection
   */
  async disconnect(): Promise<void> {
    this.client.close();
    this.isConnected = false;
  }

  /**
   * List files and directories in the current directory
   * @returns Promise resolving to an array of FTPDirectoryItem objects
   */
  async listCurrentDirectory(): Promise<FTPDirectoryItem[]> {
    if (!this.isConnectionActive()) {
      throw new Error('Not connected to FTP server');
    }

    try {
      const list = await this.client.list();
      return list.map(item => this.convertToDirectoryItem(item));
    } catch (error) {
      console.error('Error listing directory:', error);
      throw error;
    }
  }

  /**
   * List files and directories in a specific directory
   * @param path Directory path to list
   * @returns Promise resolving to an array of FTPDirectoryItem objects
   */
  async listDirectory(path: string): Promise<FTPDirectoryItem[]> {
    if (!this.isConnectionActive()) {
      throw new Error('Not connected to FTP server');
    }

    try {
      const list = await this.client.list(path);
      return list.map(item => this.convertToDirectoryItem(item));
    } catch (error) {
      console.error(`Error listing directory ${path}:`, error);
      throw error;
    }
  }

  /**
   * Change the current directory
   * @param path Directory path to navigate to
   */
  async changeDirectory(path: string): Promise<void> {
    if (!this.isConnectionActive()) {
      throw new Error('Not connected to FTP server');
    }

    try {
      await this.client.cd(path);
    } catch (error) {
      console.error(`Error changing directory to ${path}:`, error);
      throw error;
    }
  }

  /**
   * Download a file from the FTP server
   * @param remotePath Path to the file on the FTP server
   * @param localPath Local path where the file will be saved
   */
  async downloadFile(remotePath: string): Promise<ArrayBuffer> {
    if (!this.isConnectionActive()) {
      throw new Error('Not connected to FTP server');
    }

    try {
      const chunks: Uint8Array[] = [];
      
      // Create a writable stream implementation
      const writable = {
        write(chunk: Uint8Array) {
          chunks.push(chunk);
          return true;
        }
      };
      
      await this.client.downloadTo(writable, remotePath);
      
      // Combine all chunks into a single ArrayBuffer
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }
      
      return result.buffer;
    } catch (error) {
      console.error(`Error downloading file ${remotePath}:`, error);
      throw error;
    }
  }

  /**
   * Parse and process data from a downloaded file
   * @param buffer ArrayBuffer containing the file data
   * @param fileType The type of file ('csv', 'json', etc.)
   * @returns Parsed data
   */
  async parseFileData(buffer: ArrayBuffer, fileType: string): Promise<any> {
    const textDecoder = new TextDecoder('utf-8');
    const text = textDecoder.decode(buffer);
    
    switch (fileType.toLowerCase()) {
      case 'csv':
        return this.parseCSV(text);
      case 'json':
        return JSON.parse(text);
      case 'xml':
        // Would need an XML parser here
        throw new Error('XML parsing not implemented yet');
      default:
        // Return raw text for unknown file types
        return text;
    }
  }

  /**
   * Simple CSV parser
   * @param text CSV text content
   * @returns Parsed CSV as array of objects
   */
  private parseCSV(text: string): any[] {
    const lines = text.split('\n');
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(',').map(h => h.trim());
    const result = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue; // Skip empty lines
      
      const values = lines[i].split(',').map(v => v.trim());
      const entry: Record<string, string> = {};
      
      headers.forEach((header, index) => {
        entry[header] = values[index] || '';
      });
      
      result.push(entry);
    }
    
    return result;
  }

  /**
   * Helper method to convert FileInfo to FTPDirectoryItem
   */
  private convertToDirectoryItem(fileInfo: FileInfo): FTPDirectoryItem {
    return {
      name: fileInfo.name,
      isDirectory: fileInfo.isDirectory,
      size: fileInfo.size,
      rawModifiedAt: fileInfo.rawModifiedAt
    };
  }

  /**
   * Get current working directory
   */
  async getCurrentDirectory(): Promise<string> {
    if (!this.isConnectionActive()) {
      throw new Error('Not connected to FTP server');
    }

    return this.client.pwd();
  }
}

// Create a singleton instance
export const ftpDataConnector = new FTPDataConnector();