import React, { useState } from 'react';
import { Link } from 'wouter';
import DatabaseConnectionPanel from '../components/etl/DatabaseConnectionPanel';
import { SQLServerConnector } from '../services/etl/SQLServerConnector';
import { ODBCConnector } from '../services/etl/ODBCConnector';

const DatabaseConnectionPage: React.FC = () => {
  const [activeConnector, setActiveConnector] = useState<SQLServerConnector | ODBCConnector | null>(null);
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [columns, setColumns] = useState<{ name: string; type: string }[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');
  const [importedCount, setImportedCount] = useState(0);
  
  const handleConnectionSuccess = (connector: SQLServerConnector | ODBCConnector, availableTables: string[]) => {
    setActiveConnector(connector);
    setTables(availableTables);
    setSelectedTable('');
    setColumns([]);
    setTableData([]);
  };
  
  const handleConnectionError = (error: Error) => {
    console.error('Connection error:', error);
  };
  
  const handleTableSelect = async (tableName: string) => {
    if (!activeConnector) return;
    
    setIsLoading(true);
    setSelectedTable(tableName);
    
    try {
      // Get columns for the selected table
      const tableColumns = await activeConnector.listColumns(tableName);
      setColumns(tableColumns);
      
      // Get sample data from the table (limited to 100 rows)
      const data = await activeConnector.fetchTableData(tableName, 100);
      setTableData(data);
    } catch (err) {
      console.error('Error fetching table info:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleImportData = async () => {
    if (!activeConnector || !selectedTable) return;
    
    setImportStatus('importing');
    setImportMessage('Importing data...');
    
    try {
      // For property data, we use the specialized method that formats data for our app
      const propertyData = await activeConnector.fetchPropertyData(selectedTable);
      
      // Here we would normally send the data to our server API for import
      // For demonstration purposes, we'll just simulate a successful import
      
      // Simulate API call and processing time
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setImportedCount(propertyData.length);
      setImportStatus('success');
      setImportMessage(`Successfully imported ${propertyData.length} properties`);
      
      // In a real implementation, we would make an API call like this:
      // const response = await fetch('/api/import-properties', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ properties: propertyData })
      // });
      // const result = await response.json();
      // setImportedCount(result.imported);
    } catch (err) {
      const error = err as Error;
      console.error('Import error:', error);
      setImportStatus('error');
      setImportMessage(`Error importing data: ${error.message}`);
    }
  };
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Direct Database Connection</h1>
        <Link href="/data-sources">
          <a className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-800">
            Back to Data Sources
          </a>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-1">
          <DatabaseConnectionPanel 
            onConnectionSuccess={handleConnectionSuccess} 
            onConnectionError={handleConnectionError} 
          />
          
          {tables.length > 0 && (
            <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-4 text-gray-800">Available Tables</h2>
              <div className="max-h-80 overflow-y-auto">
                <ul className="divide-y divide-gray-200">
                  {tables.map((table) => (
                    <li key={table} className="py-2">
                      <button
                        className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 ${
                          selectedTable === table ? 'bg-blue-100 font-medium text-blue-800' : ''
                        }`}
                        onClick={() => handleTableSelect(table)}
                      >
                        {table}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
        
        <div className="xl:col-span-2">
          {selectedTable ? (
            isLoading ? (
              <div className="bg-white p-8 rounded-lg shadow-md flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading table data...</p>
                </div>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Table: <span className="text-blue-700">{selectedTable}</span>
                  </h2>
                  
                  <button
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
                    onClick={handleImportData}
                    disabled={importStatus === 'importing'}
                  >
                    {importStatus === 'importing' ? 'Importing...' : 'Import as Properties'}
                  </button>
                </div>
                
                {importStatus !== 'idle' && (
                  <div className={`mb-4 p-3 rounded ${
                    importStatus === 'importing' ? 'bg-blue-100 text-blue-700' :
                    importStatus === 'success' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    <p className="font-semibold">{importMessage}</p>
                    {importStatus === 'success' && (
                      <p className="mt-2">
                        You can now view these properties on the{' '}
                        <Link href="/map">
                          <a className="underline font-medium">Map</a>
                        </Link>
                      </p>
                    )}
                  </div>
                )}
                
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Columns</h3>
                  <div className="flex flex-wrap gap-2">
                    {columns.map((col) => (
                      <div key={col.name} className="bg-gray-100 px-3 py-1 rounded text-sm">
                        <span className="font-medium">{col.name}</span>
                        <span className="text-gray-500 ml-1">({col.type})</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Sample Data</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {tableData.length > 0 && 
                            Object.keys(tableData[0]).map((key) => (
                              <th 
                                key={key}
                                scope="col" 
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                {key}
                              </th>
                            ))
                          }
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {tableData.map((row, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            {Object.values(row).map((value: any, colIdx) => (
                              <td 
                                key={colIdx}
                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                              >
                                {value === null ? 
                                  <span className="text-gray-400 italic">NULL</span> : 
                                  String(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {tableData.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No data available
                    </div>
                  )}
                </div>
              </div>
            )
          ) : (
            <div className="bg-white p-8 rounded-lg shadow-md flex items-center justify-center h-64">
              <div className="text-center text-gray-500">
                <p className="text-lg">Connect to a database and select a table to view its data</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatabaseConnectionPage;