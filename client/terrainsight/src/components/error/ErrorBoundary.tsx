import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Link } from 'wouter';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      error 
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    this.setState({
      error,
      errorInfo
    });
    
    // Call optional onError handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Log error to console in development
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }
  
  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // Reset error state when props change if resetOnPropsChange is true
    if (
      this.state.hasError && 
      this.props.resetOnPropsChange && 
      prevProps.children !== this.props.children
    ) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null
      });
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Default error UI
      return (
        <Card className="mx-auto my-8 max-w-xl border-destructive/50">
          <CardHeader className="bg-destructive/5 border-b border-destructive/20">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive">An error occurred</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {this.state.error?.message || 'Unknown error'}
              </AlertDescription>
            </Alert>
            
            <div className="mt-4">
              <h3 className="text-base font-medium mb-2">What happened?</h3>
              <p className="text-muted-foreground mb-4">
                The application encountered an unexpected error. This could be due to a temporary issue or a bug in the software.
              </p>
              
              <h3 className="text-base font-medium mb-2">What can you do?</h3>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Try reloading the page</li>
                <li>Clear your browser cache and cookies</li>
                <li>Try again later</li>
                <li>Return to the home page</li>
              </ul>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <div className="mt-6 border rounded-md p-4 bg-muted/50">
                <h4 className="text-sm font-medium mb-2">Technical Details (Development Only)</h4>
                <pre className="text-xs overflow-auto p-2 bg-muted rounded-md max-h-[200px]">
                  <code>
                    {this.state.error && this.state.error.toString()}
                    {'\n\nComponent Stack:\n'}
                    {this.state.errorInfo.componentStack}
                  </code>
                </pre>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t bg-muted/50 p-4">
            <Button 
              variant="outline" 
              onClick={this.handleReset}
              className="gap-1"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            
            <Link href="/">
              <Button className="gap-1">
                <Home className="h-4 w-4" />
                Go to Home
              </Button>
            </Link>
          </CardFooter>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;