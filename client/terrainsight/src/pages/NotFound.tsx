/**
 * Not Found Page
 * 
 * This page is displayed when a user navigates to a route that doesn't exist.
 */

import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { HomeIcon, AlertTriangleIcon } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="container mx-auto p-4 flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangleIcon className="mr-2 h-5 w-5 text-yellow-500" />
            Page Not Found
          </CardTitle>
          <CardDescription>
            The page you're looking for doesn't exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTitle>404 Error</AlertTitle>
            <AlertDescription>
              We couldn't find the page you requested. This could be due to a mistyped URL
              or a page that has been moved or deleted.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button asChild>
            <Link href="/">
              <HomeIcon className="mr-2 h-4 w-4" />
              Go to Home
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default NotFoundPage;