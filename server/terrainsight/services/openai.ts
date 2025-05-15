import OpenAI from "openai";
import { withRetry, OPENAI_RETRY_OPTIONS } from "../utils/retry";
import { openAICache, generateDataQualityAnalysisKey } from "../utils/cache";

// Environment validation
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Lazy initialization of the OpenAI client
const getOpenAIClient = () => {
  return new OpenAI({ apiKey: OPENAI_API_KEY });
};

/**
 * Analyzes ETL data quality using AI
 * @param dataSourceName The name of the data source
 * @param dataSourceType The type of data source
 * @param dataSample A sample of the data to analyze
 * @param existingIssues Any existing issues already identified
 * @returns AI-powered insights and recommendations
 */
export async function analyzeDataQuality(
  dataSourceName: string,
  dataSourceType: string,
  dataSample: { columns: string[], rows: any[][] },
  existingIssues: { field: string, issue: string, severity: string, recommendation: string }[]
): Promise<{ enhancedSummary: string, additionalRecommendations: string[] }> {
  
  try {
    // Check if OpenAI API key is available
    if (!OPENAI_API_KEY) {
      return {
        enhancedSummary: "AI analysis unavailable. Set OPENAI_API_KEY for enhanced insights.",
        additionalRecommendations: []
      };
    }

    // Generate a cache key for this specific analysis request
    const cacheKey = generateDataQualityAnalysisKey(
      dataSourceName,
      dataSourceType,
      dataSample,
      existingIssues
    );
    
    // Check if we have a cached result
    const cachedResult = openAICache.get(cacheKey);
    if (cachedResult) {
      console.log("Using cached OpenAI analysis result");
      return cachedResult;
    }

    // Prepare the data for analysis
    const dataDescription = `
Data Source: ${dataSourceName} (${dataSourceType})
Columns: ${dataSample.columns.join(', ')}
Sample Rows (first 5):
${dataSample.rows.slice(0, 5).map(row => JSON.stringify(row)).join('\n')}

Existing Issues:
${existingIssues.map(issue => `- ${issue.field}: ${issue.issue} (${issue.severity})`).join('\n')}
`;

    // Make OpenAI API request with retry logic
    const openai = getOpenAIClient();
    
    // Define the API call as a function that can be retried
    const makeOpenAIRequest = async () => {
      console.log("Making OpenAI API request for data quality analysis...");
      return await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a data quality expert analyzing ETL data. Provide insights on data quality issues and specific actionable recommendations for data engineers."
          },
          {
            role: "user",
            content: `Analyze this data quality information and provide:
1. A comprehensive summary of the overall data quality, including potential hidden issues not explicitly mentioned
2. Strategic recommendations for improving data quality beyond the basic fixes
3. Insights on how these data quality issues might affect downstream analytics

Here's the data and current analysis:
${dataDescription}`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000
      });
    };
    
    // Execute the API call with retry logic
    console.log("No cached result found, making OpenAI API request with retry logic");
    const response = await withRetry(makeOpenAIRequest, OPENAI_RETRY_OPTIONS);

    // Parse the response
    const content = response.choices[0].message.content || '{}';
    const result = JSON.parse(content);
    
    // Prepare the result
    const analysisResult = {
      enhancedSummary: result.summary || "AI analysis completed successfully.",
      additionalRecommendations: result.recommendations || []
    };
    
    // Cache the result for future use (24 hours by default)
    openAICache.set(cacheKey, analysisResult);
    console.log("OpenAI analysis result cached for future use");
    
    return analysisResult;
  } catch (error: any) {
    console.error("Error in AI data quality analysis:", error);
    
    // Check for rate limit or quota errors
    if (error.status === 429 || (error.error && error.error.type === 'insufficient_quota')) {
      return {
        enhancedSummary: "OpenAI API rate limit exceeded. Please try again later or check your API key quota.",
        additionalRecommendations: ["Upgrade your OpenAI API plan for higher quotas", 
                                   "Implement a retry mechanism with exponential backoff", 
                                   "Cache analysis results to reduce API calls"]
      };
    }
    
    // Check for other common OpenAI errors
    if (error.status === 400) {
      return {
        enhancedSummary: "Bad request to OpenAI API. The request parameters may be invalid.",
        additionalRecommendations: ["Review data format sent to OpenAI", 
                                   "Ensure data sample is properly formatted"]
      };
    }
    
    if (error.status === 401) {
      return {
        enhancedSummary: "Invalid OpenAI API key. Please check your API key configuration.",
        additionalRecommendations: ["Verify your OPENAI_API_KEY environment variable",
                                   "Check if your OpenAI API key has been revoked"]
      };
    }
    
    // Generic error handling
    return {
      enhancedSummary: "AI analysis encountered an error. Using standard analysis results.",
      additionalRecommendations: ["Check server logs for details", 
                                 "Verify network connectivity to OpenAI API"]
    };
  }
}

/**
 * Checks if OpenAI integration is available
 * @returns Boolean indicating if OpenAI is configured
 */
export function isOpenAIConfigured(): boolean {
  return !!OPENAI_API_KEY;
}

/**
 * Placeholder for code generation functionality
 */
export async function generateCodeFromLanguage() {
  // Only initialize OpenAI client if the function is actually called with parameters that require it
  return { code: "", message: "Function not implemented" };
}

/**
 * Placeholder for code optimization functionality
 */
export async function optimizeCode() {
  // Only initialize OpenAI client if the function is actually called with parameters that require it
  return { optimizedCode: "", message: "Function not implemented" };
}

/**
 * Placeholder for code debugging functionality
 */
export async function debugCode() {
  // Only initialize OpenAI client if the function is actually called with parameters that require it
  return { debugInfo: "", message: "Function not implemented" };
}

/**
 * Placeholder for property prediction functionality
 */
export async function generateContextualPropertyPrediction() {
  // Only initialize OpenAI client if the function is actually called with parameters that require it
  return { prediction: "", message: "Function not implemented" };
}

/**
 * Placeholder for ETL assistance functionality
 */
export async function getETLAssistance() {
  // Only initialize OpenAI client if the function is actually called with parameters that require it
  return { message: "ETL Assistant functionality not implemented" };
}

/**
 * Placeholder for ETL onboarding tips functionality
 */
export async function getETLOnboardingTips() {
  // Only initialize OpenAI client if the function is actually called with parameters that require it
  return { tips: [], message: "Function not implemented" };
}

/**
 * Placeholder for connection troubleshooting functionality
 */
export async function generateConnectionTroubleshooting() {
  // Only initialize OpenAI client if the function is actually called with parameters that require it
  return { troubleshooting: "", message: "Function not implemented" };
}