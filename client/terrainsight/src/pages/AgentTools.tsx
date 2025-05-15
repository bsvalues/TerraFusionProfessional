import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PropertyValidationTool } from "@/components/agent/PropertyValidationTool";
import { PropertyValuationTool } from "@/components/agent/PropertyValuationTool";
import { PageHeader } from "@/components/PageHeader";
import { Cpu, ShieldCheck, Calculator, FileCheck } from "lucide-react";

export const AgentTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState("validation");

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="AI Agent Tools"
        description="Access specialized AI agents for Benton County property assessment tasks"
        icon={<Cpu className="h-8 w-8" />}
      />

      <div className="flex flex-col md:flex-row md:items-start gap-6">
        <div className="md:w-64 w-full">
          <div className="bg-card border rounded-lg p-4 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Available Agents</h3>
            <ul className="space-y-2">
              <li
                className={`flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-muted transition-colors ${
                  activeTab === "validation" ? "bg-muted font-medium" : ""
                }`}
                onClick={() => setActiveTab("validation")}
              >
                <FileCheck className="h-5 w-5 text-primary" />
                <span>Data Validation</span>
              </li>
              <li
                className={`flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-muted transition-colors ${
                  activeTab === "valuation" ? "bg-muted font-medium" : ""
                }`}
                onClick={() => setActiveTab("valuation")}
              >
                <Calculator className="h-5 w-5 text-primary" />
                <span>Property Valuation</span>
              </li>
              <li className="flex items-center gap-3 p-2 rounded-md text-muted-foreground">
                <ShieldCheck className="h-5 w-5" />
                <span>Legal Compliance (Coming Soon)</span>
              </li>
            </ul>
            
            <div className="mt-6 p-3 bg-muted rounded-md">
              <h4 className="text-sm font-semibold mb-2">Agent Information</h4>
              <p className="text-xs text-muted-foreground">
                These AI agents are designed to assist Benton County assessors with property data validation, valuation,
                and legal compliance in accordance with Washington State regulations.
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex-1">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="validation">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-4 w-4" />
                  <span>Data Validation</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="valuation">
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  <span>Property Valuation</span>
                </div>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="validation">
              <PropertyValidationTool />
            </TabsContent>
            <TabsContent value="valuation">
              <PropertyValuationTool />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};