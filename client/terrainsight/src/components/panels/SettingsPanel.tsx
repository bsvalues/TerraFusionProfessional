import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Accessibility, Cloud, Bell, FileDown, User } from 'lucide-react';
import { AccessibilitySettings } from '../ui/AccessibilitySettings';

/**
 * SettingsPanel component provides access to app settings including accessibility options
 */
export function SettingsPanel() {
  const [activeTab, setActiveTab] = useState('accessibility');

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="border-b p-4">
        <h2 className="text-xl font-semibold flex items-center">
          <Settings className="h-5 w-5 mr-2 text-primary" />
          Settings
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Configure application preferences and accessibility options
        </p>
      </div>
      
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="flex-grow flex flex-col"
      >
        <div className="border-b px-4">
          <TabsList className="mt-2">
            <TabsTrigger 
              value="accessibility"
              className="flex items-center"
              aria-label="Accessibility settings"
            >
              <Accessibility className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Accessibility</span>
            </TabsTrigger>
            <TabsTrigger 
              value="appearance"
              className="flex items-center"
              aria-label="Appearance settings"
            >
              <User className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
            <TabsTrigger 
              value="notifications"
              className="flex items-center"
              aria-label="Notification settings"
            >
              <Bell className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger 
              value="exports"
              className="flex items-center"
              aria-label="Export settings"
            >
              <FileDown className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Exports</span>
            </TabsTrigger>
            <TabsTrigger 
              value="sync"
              className="flex items-center"
              aria-label="Sync settings"
            >
              <Cloud className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Sync</span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <div className="flex-grow overflow-y-auto p-4">
          <TabsContent value="accessibility" className="h-full m-0 p-0">
            <AccessibilitySettings />
          </TabsContent>
          
          <TabsContent value="appearance" className="h-full m-0 p-0">
            <div className="bg-white shadow-md rounded-lg border border-gray-200 p-4">
              <h3 className="text-lg font-semibold mb-4">Appearance Settings</h3>
              <p className="text-gray-500">
                Customize the visual appearance of the application.
              </p>
              <div className="text-sm text-gray-500 mt-4 italic">
                Appearance settings coming soon.
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="notifications" className="h-full m-0 p-0">
            <div className="bg-white shadow-md rounded-lg border border-gray-200 p-4">
              <h3 className="text-lg font-semibold mb-4">Notification Settings</h3>
              <p className="text-gray-500">
                Configure when and how you receive notifications.
              </p>
              <div className="text-sm text-gray-500 mt-4 italic">
                Notification settings coming soon.
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="exports" className="h-full m-0 p-0">
            <div className="bg-white shadow-md rounded-lg border border-gray-200 p-4">
              <h3 className="text-lg font-semibold mb-4">Export Settings</h3>
              <p className="text-gray-500">
                Configure default export formats and templates.
              </p>
              <div className="text-sm text-gray-500 mt-4 italic">
                Export settings coming soon.
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="sync" className="h-full m-0 p-0">
            <div className="bg-white shadow-md rounded-lg border border-gray-200 p-4">
              <h3 className="text-lg font-semibold mb-4">Sync Settings</h3>
              <p className="text-gray-500">
                Configure data synchronization options.
              </p>
              <div className="text-sm text-gray-500 mt-4 italic">
                Sync settings coming soon.
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}