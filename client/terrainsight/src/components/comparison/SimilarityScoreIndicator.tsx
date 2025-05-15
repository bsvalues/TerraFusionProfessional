import React from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface SimilarityScoreIndicatorProps {
  score: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Component to visualize a similarity score between properties
 */
export const SimilarityScoreIndicator: React.FC<SimilarityScoreIndicatorProps> = ({
  score,
  showLabel = true,
  size = 'md',
  className
}) => {
  // Determine color based on score
  const getScoreColor = (value: number) => {
    if (value >= 80) return 'text-green-600';
    if (value >= 60) return 'text-amber-500';
    if (value >= 40) return 'text-orange-500';
    return 'text-red-500';
  };
  
  // Get progress color
  const getProgressColor = (value: number) => {
    if (value >= 80) return 'bg-green-500';
    if (value >= 60) return 'bg-amber-500';
    if (value >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };
  
  // Determine size-based classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'text-xs',
          score: 'text-lg',
          progress: 'h-1',
        };
      case 'lg':
        return {
          container: 'text-sm',
          score: 'text-3xl',
          progress: 'h-3',
        };
      case 'md':
      default:
        return {
          container: 'text-xs',
          score: 'text-2xl',
          progress: 'h-2',
        };
    }
  };
  
  const sizeClasses = getSizeClasses();
  
  return (
    <div className={cn('flex flex-col items-center space-y-1', className)}>
      {showLabel && (
        <span className={cn('text-gray-500 font-medium', sizeClasses.container)}>
          Similarity Score
        </span>
      )}
      <span className={cn('font-bold', getScoreColor(score), sizeClasses.score)}>
        {Math.round(score)}
      </span>
      <Progress 
        value={score} 
        className={cn('w-full', sizeClasses.progress, getProgressColor(score))}
      />
    </div>
  );
};