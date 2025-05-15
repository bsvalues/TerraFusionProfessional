import React, { useState, useEffect } from 'react';
import { Play, Save, Terminal, AlertTriangle, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import Editor from '@monaco-editor/react';

interface ScriptEditorProps {
  initialCode?: string;
  onRun?: (code: string) => void;
  onSave?: (code: string) => void;
  scriptName?: string;
  readOnly?: boolean;
}

const ScriptEditor: React.FC<ScriptEditorProps> = ({
  initialCode = '// Write your property valuation script here\n\n// Example: calculate values based on square footage\nproperties.forEach(property => {\n  const valuePerSqFt = 150;\n  results[property.id] = property.squareFeet * valuePerSqFt;\n});\n',
  onRun,
  onSave,
  scriptName = 'Script Editor',
  readOnly = false
}) => {
  const [code, setCode] = useState(initialCode);
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    setCode(initialCode);
    setHasUnsavedChanges(false);
  }, [initialCode]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
      setHasUnsavedChanges(value !== initialCode);
    }
  };

  const handleRun = () => {
    if (onRun) {
      onRun(code);
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(code);
      setHasUnsavedChanges(false);
    }
  };

  const handleThemeToggle = () => {
    setIsDarkTheme(!isDarkTheme);
  };

  return (
    <div className="h-full flex flex-col border border-gray-300 rounded-md overflow-hidden shadow-sm">
      <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center">
          <Code size={18} className="mr-2 text-blue-500" />
          <h3 className="font-medium text-gray-800">{scriptName}</h3>
          {hasUnsavedChanges && (
            <div className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
              Unsaved
            </div>
          )}
        </div>
        <div className="flex space-x-2">
          <Toggle
            aria-label="Toggle theme"
            pressed={isDarkTheme}
            onPressedChange={handleThemeToggle}
            className="px-2 h-8 bg-white border border-gray-200"
          >
            {isDarkTheme ? "Dark" : "Light"}
          </Toggle>
          <Button 
            variant="outline" 
            size="sm"
            className="h-8 bg-white"
            onClick={handleSave}
            disabled={readOnly || !hasUnsavedChanges}
          >
            <Save size={14} className="mr-1" /> Save
          </Button>
          <Button 
            variant="default" 
            size="sm"
            className="h-8"
            onClick={handleRun}
          >
            <Play size={14} className="mr-1" /> Run
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden bg-white">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          value={code}
          onChange={handleEditorChange}
          theme={isDarkTheme ? 'vs-dark' : 'light'}
          options={{
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            fontSize: 14,
            readOnly: readOnly,
            automaticLayout: true,
            lineNumbers: 'on',
            renderLineHighlight: 'all',
            scrollbar: {
              useShadows: false,
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10,
              verticalHasArrows: false,
              horizontalHasArrows: false,
              vertical: 'visible',
              horizontal: 'visible',
            }
          }}
        />
      </div>
      
      <div className="bg-gray-100 border-t border-gray-200 px-4 py-3 flex items-center">
        <Terminal size={14} className="text-gray-600 mr-2" />
        <span className="text-xs text-gray-600">Script context includes: properties (array of Property objects), results (output object)</span>
        
        {/* Info note */}
        <div className="ml-auto flex items-center text-xs text-gray-600">
          <AlertTriangle size={14} className="text-amber-500 mr-1" />
          <span>Scripts run in a controlled environment with access limited to property data</span>
        </div>
      </div>
    </div>
  );
};

export default ScriptEditor;