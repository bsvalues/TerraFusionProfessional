import { Property } from '@shared/schema';
import { advancedRegressionService } from './advancedRegressionService';
import { apiRequest } from '@/lib/queryClient';

export interface ContextualPredictionRequest {
  property: Property;
  context: string;
  comparableProperties?: Property[];
  includeExplanation?: boolean;
  confidenceLevel?: number;
}

export interface ContextualPredictionResponse {
  predictedValue: number;
  aiPredictedValue: number;
  mlPredictedValue: number;
  confidenceInterval: {
    min: number;
    max: number;
    level: number;
  };
  adjustmentFactors: {
    factor: string;
    impact: number;
    description: string;
  }[];
  explanation: string;
  comparableProperties?: ComparableProperty[];
}

export interface ComparableProperty {
  property: Property;
  similarity: number;
  adjustedValue: number;
  keyDifferences: {
    factor: string;
    propertyValue: string | number;
    comparableValue: string | number;
    impact: number;
  }[];
}

/**
 * Service for contextual property value prediction with AI insights
 */
export class ContextualPredictionService {
  /**
   * Get a property value prediction enriched with contextual insights from AI
   * 
   * @param params Parameters for contextual prediction
   */
  public async predictPropertyValue(params: ContextualPredictionRequest): Promise<ContextualPredictionResponse> {
    const { property, context, comparableProperties = [], includeExplanation = true, confidenceLevel = 95 } = params;
    
    try {
      // Get ML-based prediction using existing regression service
      const mlPrediction = this.getMLPrediction(property, comparableProperties);
      
      // Get AI contextual analysis
      const aiContextualAnalysis = await this.getAIContextualAnalysis(
        property, 
        context, 
        mlPrediction.predictedValue,
        comparableProperties,
        includeExplanation
      );
      
      // Combine predictions with weighted average based on confidence
      const combinedValue = this.combineMLAndAIPredictions(
        mlPrediction.predictedValue,
        aiContextualAnalysis.predictedValue,
        mlPrediction.confidence,
        aiContextualAnalysis.confidence
      );
      
      // Calculate final confidence interval
      const confidenceInterval = this.calculateConfidenceInterval(
        combinedValue,
        aiContextualAnalysis.adjustmentFactors,
        confidenceLevel
      );
      
      // Return combined result
      return {
        predictedValue: combinedValue,
        aiPredictedValue: aiContextualAnalysis.predictedValue,
        mlPredictedValue: mlPrediction.predictedValue,
        confidenceInterval,
        adjustmentFactors: aiContextualAnalysis.adjustmentFactors,
        explanation: aiContextualAnalysis.explanation,
        comparableProperties: aiContextualAnalysis.comparableProperties
      };
    } catch (error) {
      console.error('Error in contextual property prediction:', error);
      throw new Error('Failed to generate contextual property prediction');
    }
  }
  
  /**
   * Get ML-based prediction using advanced regression service
   */
  private getMLPrediction(
    property: Property, 
    comparableProperties: Property[]
  ): { predictedValue: number; confidence: number } {
    // Use the existing regression service
    const prediction = advancedRegressionService.predictWithConfidence(
      property,
      comparableProperties.length > 0 ? comparableProperties : undefined
    );
    
    return {
      predictedValue: prediction.predictedValue,
      confidence: 0.7 // Base confidence for ML prediction
    };
  }
  
  /**
   * Get AI-based contextual analysis using OpenAI
   */
  private async getAIContextualAnalysis(
    property: Property,
    context: string,
    mlPrediction: number,
    comparableProperties: Property[],
    includeExplanation: boolean
  ): Promise<{
    predictedValue: number;
    confidence: number;
    adjustmentFactors: { factor: string; impact: number; description: string }[];
    explanation: string;
    comparableProperties?: ComparableProperty[];
  }> {
    try {
      // Call API endpoint for AI contextual analysis
      const response = await fetch('/api/ml/contextual-prediction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          property,
          context,
          mlPrediction,
          comparableProperties: comparableProperties.slice(0, 5), // Limit to top 5 comparable properties
          includeExplanation
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        predictedValue: data.predictedValue,
        confidence: data.confidence,
        adjustmentFactors: data.adjustmentFactors || [],
        explanation: data.explanation || "AI analysis completed successfully",
        comparableProperties: data.comparableProperties
      };
    } catch (error) {
      console.error('Error in AI contextual analysis:', error);
      
      // Fallback: Return ML prediction with minimal context if AI fails
      return {
        predictedValue: mlPrediction * 1.05, // Slightly adjusted value
        confidence: 0.6,
        adjustmentFactors: [
          { 
            factor: 'Market Trend', 
            impact: 5, 
            description: 'General market appreciation applied as fallback' 
          }
        ],
        explanation: 'AI contextual analysis failed, using ML prediction with market adjustment factor.',
        comparableProperties: comparableProperties.slice(0, 3).map(prop => ({
          property: prop,
          similarity: 0.8,
          adjustedValue: parseFloat(prop.value || '0'),
          keyDifferences: []
        }))
      };
    }
  }
  
  /**
   * Combine ML and AI predictions with weighted average
   */
  private combineMLAndAIPredictions(
    mlPrediction: number,
    aiPrediction: number,
    mlConfidence: number,
    aiConfidence: number
  ): number {
    const totalConfidence = mlConfidence + aiConfidence;
    const mlWeight = mlConfidence / totalConfidence;
    const aiWeight = aiConfidence / totalConfidence;
    
    return (mlPrediction * mlWeight) + (aiPrediction * aiWeight);
  }
  
  /**
   * Calculate confidence interval for prediction
   */
  private calculateConfidenceInterval(
    predictedValue: number,
    adjustmentFactors: { factor: string; impact: number; description: string }[],
    confidenceLevel: number
  ): { min: number; max: number; level: number } {
    // Calculate variability based on adjustment factors
    const totalImpact = adjustmentFactors.reduce((sum, factor) => sum + Math.abs(factor.impact), 0);
    const variabilityFactor = Math.max(0.05, totalImpact / 100); // At least 5% variability
    
    // Adjust for confidence level (95% = z-score of ~2)
    const zScore = confidenceLevel === 95 ? 1.96 : confidenceLevel === 90 ? 1.645 : 2.576; // 95%, 90%, or 99%
    const margin = predictedValue * variabilityFactor * zScore;
    
    return {
      min: Math.max(0, predictedValue - margin),
      max: predictedValue + margin,
      level: confidenceLevel
    };
  }
}

// Export singleton instance
export const contextualPredictionService = new ContextualPredictionService();