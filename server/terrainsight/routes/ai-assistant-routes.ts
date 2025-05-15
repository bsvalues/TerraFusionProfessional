/**
 * AI Assistant Routes
 * 
 * This file provides API endpoints for interacting with the AI Assistant component.
 */
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { agentManager } from '../../shared/agent';
import { z } from 'zod';

// Define a minimal interface for what we need from an agent
interface AgentLike {
  id: string;
  processRequest?: (message: any) => Promise<any>;
  handleRequest?: (request: any) => Promise<any>;
  [key: string]: any;
};

/**
 * Register AI Assistant routes
 * 
 * @param app Express application
 */
export function registerAIAssistantRoutes(app: any) {
  // Execute agent to get a response
  app.post('/api/agents/:agentId/execute', async (req: Request, res: Response) => {
    try {
      const { agentId } = req.params;
      const { input, context } = req.body;
      
      console.log(`Executing agent ${agentId} with input: ${input}`);
      
      // Input validation
      if (!input) {
        return res.status(400).json({ error: 'Input is required' });
      }
      
      // Check if we have the agent available in the agent manager
      let response;
      try {
        const agent = agentManager?.getAgent(agentId);
        
        if (agent) {
          console.log(`Found agent: ${agent.id}`);
          // Try to use the actual agent if it has the process method
          let result;
          if (typeof agent.processRequest === 'function') {
            result = await agent.processRequest({
              type: 'query',
              senderId: 'ai-assistant',
              recipientId: agent.id,
              content: {
                query: input,
                context: context?.parameters
              }
            });
          } else if (typeof agent.handleRequest === 'function') {
            result = await agent.handleRequest({
              type: 'query',
              operation: 'generate_response',
              data: {
                query: input,
                context: context?.parameters
              }
            });
          } else {
            // Fallback for agents without standard methods
            console.log('Agent does not have standard process methods, using fallback');
            throw new Error('Agent does not support the required interface');
          }
          
          response = {
            output: result?.response || result?.data?.response || "I've processed your request, but I'm not sure how to respond.",
            source: 'agent',
            agentId: agent.id
          };
        } else {
          // Agent not found, use fallback
          throw new Error(`Agent ${agentId} not found`);
        }
      } catch (agentError) {
        console.log('Error executing agent, using fallback:', agentError);
        // Provide a fallback response with simulated AI assistant behavior
        response = {
          output: generateSimulatedResponse(input, context),
          source: 'fallback',
          error: agentError instanceof Error ? agentError.message : String(agentError)
        };
      }
      
      // Add a slight delay to simulate AI thinking time
      setTimeout(() => {
        res.json(response);
      }, 500);
    } catch (error) {
      console.error('Error in AI Assistant API:', error);
      res.status(500).json({ 
        error: 'Failed to process the request',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });
}

/**
 * Generate a simulated AI assistant response when the agent is unavailable
 * 
 * @param input User input text
 * @param context Request context
 * @returns Simulated response text
 */
function generateSimulatedResponse(input: string, context: any): string {
  const lowercaseInput = input.toLowerCase();
  
  // Basic pattern matching for common property-related questions
  if (lowercaseInput.includes('property') && lowercaseInput.includes('value')) {
    return "Property values in Benton County are determined through assessment of multiple factors including location, size, property improvements, and market conditions. The Assessor's Office conducts regular appraisals to ensure accuracy.";
  }
  
  if (lowercaseInput.includes('search') || lowercaseInput.includes('find')) {
    return "You can search for properties using the Property Explorer feature. Click on 'Explore Properties' on the home page or navigate to the search page directly. You can search by address, parcel ID, or owner name.";
  }
  
  if (lowercaseInput.includes('map') || lowercaseInput.includes('gis')) {
    return "The interactive map is available through the 'Property Mapping' section. It allows you to visualize property boundaries, values, and other geospatial data layers.";
  }
  
  if (lowercaseInput.includes('data') && (lowercaseInput.includes('import') || lowercaseInput.includes('export'))) {
    return "The Data Management section provides tools for importing property data, managing property records, and exporting reports in various formats. You can access these features by clicking on 'Manage Data' on the home page.";
  }
  
  if (lowercaseInput.includes('hello') || lowercaseInput.includes('hi') || lowercaseInput.includes('hey')) {
    return "Hello! I'm the Benton County Property Assessment AI Assistant. I can help you find information about properties, assessment methods, and navigate our platform. What would you like to know?";
  }
  
  if (lowercaseInput.includes('thank')) {
    return "You're welcome! Let me know if you need any other assistance with the Benton County Property Assessment Platform.";
  }
  
  // Default response
  return "I'm here to help you with the Benton County Property Assessment Platform. You can ask me about property information, assessment methods, or how to use the various features of our system. How can I assist you today?";
}