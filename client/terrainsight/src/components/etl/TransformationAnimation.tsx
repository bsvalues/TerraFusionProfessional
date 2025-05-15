import React from "react";
import { motion } from "framer-motion";
import {
  Filter, 
  Map, 
  Share, 
  Database, 
  RefreshCw,
  ArrowRightLeft, 
  Search,
  CheckSquare, 
  Zap,
  Sparkles,
  ShieldCheck
} from "lucide-react";
import { TransformationType } from "../../services/etl/ETLTypes";

export interface TransformationAnimationProps {
  transformationType?: TransformationType;
  type?: TransformationType; // For backwards compatibility with older code
  isActive: boolean;
  isComplete?: boolean; // For backwards compatibility
  speed?: "slow" | "normal" | "fast";
  showText?: boolean;
  onComplete?: () => void;
  size?: "sm" | "md" | "lg";
}

/**
 * Animated component to visualize ETL data transformations in progress
 */
export const TransformationAnimation: React.FC<TransformationAnimationProps> = ({
  transformationType,
  type,
  isActive,
  isComplete,
  speed = "normal",
  showText = true,
  onComplete,
  size = "md"
}) => {
  // Handle backward compatibility with older code
  const actualType: TransformationType = (transformationType || type || TransformationType.TRANSFORM) as TransformationType;
  const [animationComplete, setAnimationComplete] = React.useState(false);

  // Determine animation duration based on speed
  const getDuration = (): number => {
    switch (speed) {
      case "slow": return 6;
      case "fast": return 2;
      default: return 4;
    }
  };

  // Get the icon for the transformation type
  const getIconComponent = (type: TransformationType) => {
    switch (type) {
      case TransformationType.FILTER:
        return <Filter />;
      case TransformationType.MAP:
        return <Map />;
      case TransformationType.JOIN:
        return <Share />;
      case TransformationType.AGGREGATE:
        return <Database />;
      case TransformationType.TRANSFORM:
        return <RefreshCw />;
      case TransformationType.ENRICH:
        return <Sparkles />;
      case TransformationType.ENRICHMENT:
        return <Sparkles />;
      case TransformationType.CLEAN:
        return <ArrowRightLeft />;
      case TransformationType.VALIDATE:
        return <CheckSquare />;
      case TransformationType.VALIDATION:
        return <ShieldCheck />;
      case TransformationType.GEOCODE:
        return <Search />;
      default:
        return <Zap />;
    }
  };

  // Get color scheme based on transformation type
  const getColorScheme = (type: TransformationType) => {
    switch (type) {
      case TransformationType.FILTER:
        return "text-purple-600 bg-purple-50";
      case TransformationType.MAP:
        return "text-green-600 bg-green-50";
      case TransformationType.JOIN:
        return "text-blue-600 bg-blue-50";
      case TransformationType.AGGREGATE:
        return "text-yellow-600 bg-yellow-50";
      case TransformationType.TRANSFORM:
        return "text-cyan-600 bg-cyan-50";
      case TransformationType.ENRICH:
        return "text-indigo-600 bg-indigo-50";
      case TransformationType.ENRICHMENT:
        return "text-indigo-600 bg-indigo-50";
      case TransformationType.CLEAN:
        return "text-teal-600 bg-teal-50";
      case TransformationType.VALIDATE:
        return "text-orange-600 bg-orange-50";
      case TransformationType.VALIDATION:
        return "text-orange-600 bg-orange-50";
      case TransformationType.GEOCODE:
        return "text-rose-600 bg-rose-50";
      default:
        return "text-blue-600 bg-blue-50";
    }
  };

  // Get the size of the container and icons
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return {
          container: "w-8 h-8",
          icon: "w-4 h-4",
          text: "text-xs",
          pill: "p-1 px-2"
        };
      case "lg":
        return {
          container: "w-20 h-20",
          icon: "w-10 h-10",
          text: "text-base",
          pill: "p-2 px-4"
        };
      default: // md
        return {
          container: "w-14 h-14",
          icon: "w-7 h-7",
          text: "text-sm",
          pill: "p-1.5 px-3"
        };
    }
  };

  // Get the text label for the transformation type
  const getLabel = (type: TransformationType) => {
    switch (type) {
      case TransformationType.FILTER:
        return "Filtering";
      case TransformationType.MAP:
        return "Mapping";
      case TransformationType.JOIN:
        return "Joining";
      case TransformationType.AGGREGATE:
        return "Aggregating";
      case TransformationType.TRANSFORM:
        return "Transforming";
      case TransformationType.ENRICH:
        return "Enriching";
      case TransformationType.ENRICHMENT:
        return "Enriching";
      case TransformationType.CLEAN:
        return "Cleaning";
      case TransformationType.VALIDATE:
        return "Validating";
      case TransformationType.VALIDATION:
        return "Validating";
      case TransformationType.GEOCODE:
        return "Geocoding";
      default:
        return "Processing";
    }
  };

  // Reset animation state when isActive changes or handle isComplete for backwards compatibility
  React.useEffect(() => {
    if (isActive) {
      setAnimationComplete(false);
    }
    
    // Handle isComplete prop for backward compatibility
    if (isComplete) {
      setAnimationComplete(true);
    }
  }, [isActive, isComplete]);

  // Trigger the onComplete callback
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isActive && !animationComplete) {
      timer = setTimeout(() => {
        setAnimationComplete(true);
        if (onComplete) {
          onComplete();
        }
      }, getDuration() * 1000);
    }
    return () => clearTimeout(timer);
  }, [isActive, animationComplete, onComplete, getDuration]);

  const sizeClasses = getSizeClasses();
  const colorScheme = getColorScheme(actualType);

  return (
    <div className="flex flex-col items-center">
      {/* Animation container */}
      <div className={`relative flex items-center justify-center rounded-full ${sizeClasses.container} ${colorScheme}`}>
        {/* Static icon */}
        <div className={`${sizeClasses.icon} ${isActive ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
          {getIconComponent(actualType)}
        </div>
        
        {/* Animated icon overlay */}
        {isActive && (
          <motion.div 
            className={`absolute inset-0 flex items-center justify-center ${sizeClasses.icon}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: getDuration(),
                repeat: Infinity,
                repeatType: "loop",
                ease: "easeInOut"
              }}
            >
              {getIconComponent(actualType)}
            </motion.div>
          </motion.div>
        )}
        
        {/* Circular spinner */}
        {isActive && (
          <motion.div 
            className="absolute inset-0 rounded-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <motion.circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray="283"
                initial={{ strokeDashoffset: 283 }}
                animate={{ strokeDashoffset: 0 }}
                transition={{ 
                  duration: getDuration(),
                  ease: "easeInOut"
                }}
              />
            </svg>
          </motion.div>
        )}
      </div>
      
      {/* Label text */}
      {showText && (
        <div className={`mt-2 ${sizeClasses.text} font-medium`}>
          {getLabel(actualType)}
        </div>
      )}
    </div>
  );
};

export default TransformationAnimation;