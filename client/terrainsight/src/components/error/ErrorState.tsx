import React from 'react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, XCircle, Bug, Wifi, Database, ServerCrash } from 'lucide-react';
import { Link } from 'wouter';
import { ApiError } from '@/lib/api';

// Define error types
export type ErrorType = 
  | 'api' 
  | 'network' 
  | 'database' 
  | 'server' 
  | 'validation' 
  | 'permission' 
  | 'auth'
  | 'unknown';

interface ErrorStateProps {
  error: Error | ApiError | string;
  title?: string;
  subtitle?: string;
  type?: ErrorType;
  className?: string;
  onRetry?: () => void;
  homeLink?: boolean;
  showDetails?: boolean;
  compact?: boolean;
}

export const getErrorIcon = (type: ErrorType) => {
  switch (type) {
    case 'api':
      return Bug;
    case 'network':
      return Wifi;
    case 'database':
      return Database;
    case 'server':
      return ServerCrash;
    case 'validation':
    case 'permission':
    case 'auth':
      return AlertTriangle;
    case 'unknown':
    default:
      return XCircle;
  }
};

export const getErrorMessage = (error: Error | ApiError | string, type: ErrorType): string => {
  if (typeof error === 'string') return error;
  
  // Handle ApiError
  if (error instanceof ApiError) {
    return error.message || `Error ${error.status}: ${error.details || 'Unknown error'}`;
  }
  
  // Handle standard Error
  if (error instanceof Error) {
    return error.message || 'An unknown error occurred';
  }
  
  // Default error messages by type
  switch (type) {
    case 'api':
      return 'Failed to complete the API request';
    case 'network':
      return 'Network connection issue detected';
    case 'database':
      return 'Database operation failed';
    case 'server':
      return 'Server returned an error';
    case 'validation':
      return 'The provided data is invalid';
    case 'permission':
      return 'You do not have permission to perform this action';
    case 'auth':
      return 'Authentication error';
    case 'unknown':
    default:
      return 'An unexpected error occurred';
  }
};

const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  title,
  subtitle,
  type = 'unknown',
  className,
  onRetry,
  homeLink = true,
  showDetails = process.env.NODE_ENV === 'development',
  compact = false
}) => {
  const Icon = getErrorIcon(type);
  const errorMessage = getErrorMessage(error, type);
  
  // For ApiError, extract status and details
  const isApiError = error instanceof ApiError;
  const status = isApiError ? error.status : undefined;
  const details = isApiError ? error.details : undefined;
  const code = isApiError ? error.code : undefined;
  
  // For compact mode
  if (compact) {
    return (
      <Alert variant="destructive" className={cn("my-4", className)}>
        <Icon className="h-4 w-4" />
        <AlertTitle>{title || 'Error'}</AlertTitle>
        <AlertDescription>
          {errorMessage}
          {onRetry && (
            <Button 
              variant="link" 
              onClick={onRetry} 
              className="p-0 h-auto text-destructive underline ml-2"
            >
              Try again
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }
  
  // Full error state
  return (
    <Card className={cn("border-destructive/50", className)}>
      <CardHeader className="bg-destructive/5 border-b border-destructive/20">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-destructive" />
          <CardTitle className="text-destructive">{title || 'Error'}</CardTitle>
        </div>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardHeader>
      
      <CardContent className="pt-6">
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{isApiError ? `Error ${status}` : 'Error'}</AlertTitle>
          <AlertDescription>
            {errorMessage}
          </AlertDescription>
        </Alert>
        
        {showDetails && (
          <div className="mt-4 space-y-2">
            {isApiError && (
              <>
                {status && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="font-medium">{status}</span>
                  </div>
                )}
                {code && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Code:</span>
                    <span className="font-medium">{code}</span>
                  </div>
                )}
                {details && (
                  <div className="text-sm mt-2">
                    <span className="text-muted-foreground block mb-1">Details:</span>
                    <pre className="text-xs bg-muted p-2 rounded-md overflow-auto whitespace-pre-wrap">
                      {details}
                    </pre>
                  </div>
                )}
              </>
            )}
            
            {error instanceof Error && error.stack && (
              <div className="text-sm mt-2">
                <span className="text-muted-foreground block mb-1">Stack trace:</span>
                <pre className="text-xs bg-muted p-2 rounded-md overflow-auto max-h-[200px]">
                  {error.stack}
                </pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between border-t bg-muted/50 p-4">
        {onRetry && (
          <Button 
            variant="outline" 
            onClick={onRetry}
            className="gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        )}
        
        {homeLink && (
          <Link href="/">
            <Button variant={onRetry ? "default" : "outline"} className="gap-1">
              Go to Home
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
};

export default ErrorState;