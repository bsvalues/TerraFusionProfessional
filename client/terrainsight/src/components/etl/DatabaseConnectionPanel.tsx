import React, { useState, useEffect } from 'react';
import { SQLServerConnector } from '../../services/etl/SQLServerConnector';
import { ODBCConnector } from '../../services/etl/ODBCConnector';
import { DataSourceType } from '../../services/etl/ETLTypes';

interface DatabaseConnectionPanelProps {
  onConnectionSuccess: (connector: SQLServerConnector | ODBCConnector, tables: string[]) => void;
  onConnectionError: (error: Error) => void;
}

const DatabaseConnectionPanel: React.FC<DatabaseConnectionPanelProps> = ({
  onConnectionSuccess,
  onConnectionError,
}) => {
  // Connection type state
  const [connectionType, setConnectionType] = useState<'sqlserver' | 'odbc'>('sqlserver');
  
  // SQL Server specific state
  const [server, setServer] = useState('');
  const [port, setPort] = useState(1433);
  const [database, setDatabase] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [domain, setDomain] = useState('');
  const [useWindowsAuth, setUseWindowsAuth] = useState(false);
  const [trustServerCertificate, setTrustServerCertificate] = useState(true);
  
  // ODBC specific state
  const [connectionString, setConnectionString] = useState('');
  const [odbcUsername, setOdbcUsername] = useState('');
  const [odbcPassword, setOdbcPassword] = useState('');
  const [driver, setDriver] = useState('');
  
  // Shared state
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionTimeout, setConnectionTimeout] = useState(15000);
  const [requestTimeout, setRequestTimeout] = useState(15000);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  const handleConnectClick = async () => {
    setIsConnecting(true);
    setConnectionStatus('connecting');
    setErrorMessage('');
    
    try {
      let connector;
      let connected = false;
      
      if (connectionType === 'sqlserver') {
        connector = new SQLServerConnector({
          server,
          port,
          database,
          user: username,
          password,
          domain,
          useWindowsAuth,
          trustServerCertificate,
          connectionTimeout,
          requestTimeout,
        });
        
        connected = await connector.connect();
      } else {
        connector = new ODBCConnector({
          connectionString,
          username: odbcUsername,
          password: odbcPassword,
          driver,
          connectionTimeout,
          requestTimeout,
        });
        
        connected = await connector.connect();
      }
      
      if (connected) {
        setConnectionStatus('connected');
        const tables = await connector.listTables();
        onConnectionSuccess(connector, tables);
      } else {
        const error = connector.getConnectionError();
        setConnectionStatus('error');
        setErrorMessage(error ? error.message : 'Unknown connection error');
        onConnectionError(error || new Error('Failed to connect to database'));
      }
    } catch (err) {
      setConnectionStatus('error');
      const error = err as Error;
      setErrorMessage(error.message);
      onConnectionError(error);
    } finally {
      setIsConnecting(false);
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Database Connection</h2>
      
      <div className="mb-6">
        <label className="block text-gray-700 font-semibold mb-2">Connection Type</label>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              className="mr-2"
              checked={connectionType === 'sqlserver'}
              onChange={() => setConnectionType('sqlserver')}
            />
            SQL Server
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              className="mr-2"
              checked={connectionType === 'odbc'}
              onChange={() => setConnectionType('odbc')}
            />
            ODBC
          </label>
        </div>
      </div>
      
      {connectionType === 'sqlserver' ? (
        <>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Server</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded"
                value={server}
                onChange={(e) => setServer(e.target.value)}
                placeholder="e.g., localhost or 192.168.1.100"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Port</label>
              <input
                type="number"
                className="w-full p-2 border border-gray-300 rounded"
                value={port}
                onChange={(e) => setPort(parseInt(e.target.value))}
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Database</label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded"
              value={database}
              onChange={(e) => setDatabase(e.target.value)}
              placeholder="e.g., BentonCountyProperties"
            />
          </div>
          
          <div className="mb-4">
            <label className="flex items-center text-gray-700 font-semibold">
              <input
                type="checkbox"
                className="mr-2"
                checked={useWindowsAuth}
                onChange={(e) => setUseWindowsAuth(e.target.checked)}
              />
              Use Windows Authentication
            </label>
          </div>
          
          {useWindowsAuth ? (
            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">Domain</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="e.g., BENTON"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Username</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Password</label>
                <input
                  type="password"
                  className="w-full p-2 border border-gray-300 rounded"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          )}
          
          <div className="mb-4">
            <label className="flex items-center text-gray-700 font-semibold">
              <input
                type="checkbox"
                className="mr-2"
                checked={trustServerCertificate}
                onChange={(e) => setTrustServerCertificate(e.target.checked)}
              />
              Trust Server Certificate
            </label>
          </div>
        </>
      ) : (
        <>
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Connection String</label>
            <textarea
              className="w-full p-2 border border-gray-300 rounded font-mono text-sm h-24"
              value={connectionString}
              onChange={(e) => setConnectionString(e.target.value)}
              placeholder="e.g., Driver={ODBC Driver 17 for SQL Server};Server=myServerAddress;Database=myDataBase;Trusted_Connection=yes;"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Driver</label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded"
              value={driver}
              onChange={(e) => setDriver(e.target.value)}
              placeholder="e.g., ODBC Driver 17 for SQL Server"
            />
            <p className="text-sm text-gray-500 mt-1">Leave blank to use default driver</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Username (Optional)</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded"
                value={odbcUsername}
                onChange={(e) => setOdbcUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Password (Optional)</label>
              <input
                type="password"
                className="w-full p-2 border border-gray-300 rounded"
                value={odbcPassword}
                onChange={(e) => setOdbcPassword(e.target.value)}
              />
            </div>
          </div>
        </>
      )}
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-gray-700 font-semibold mb-2">Connection Timeout (ms)</label>
          <input
            type="number"
            className="w-full p-2 border border-gray-300 rounded"
            value={connectionTimeout}
            onChange={(e) => setConnectionTimeout(parseInt(e.target.value))}
          />
        </div>
        <div>
          <label className="block text-gray-700 font-semibold mb-2">Request Timeout (ms)</label>
          <input
            type="number"
            className="w-full p-2 border border-gray-300 rounded"
            value={requestTimeout}
            onChange={(e) => setRequestTimeout(parseInt(e.target.value))}
          />
        </div>
      </div>
      
      {connectionStatus === 'error' && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <p className="font-bold">Connection Error:</p>
          <p>{errorMessage}</p>
        </div>
      )}
      
      {connectionStatus === 'connected' && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          <p className="font-bold">Connection Successful!</p>
        </div>
      )}
      
      <div className="flex justify-center">
        <button
          className={`px-6 py-2 rounded-md text-white font-semibold ${
            isConnecting ? 'bg-gray-500' : 'bg-blue-600 hover:bg-blue-700'
          }`}
          onClick={handleConnectClick}
          disabled={isConnecting}
        >
          {isConnecting ? 'Connecting...' : 'Connect to Database'}
        </button>
      </div>
    </div>
  );
};

export default DatabaseConnectionPanel;