import React from 'react';
import { cn } from '@/lib/utils';
import { BCPageHeader } from './bc-page-header';

export interface BCPageLayoutProps {
  children: React.ReactNode;
  heading: string;
  description?: string;
  backgroundImage?: string;
  className?: string;
  headerClassName?: string;
  logo?: boolean;
}

/**
 * A Benton County styled page layout component with proper scrolling behavior
 */
export function BCPageLayout({
  children,
  heading,
  description,
  backgroundImage,
  className,
  headerClassName,
  logo = false,
}: BCPageLayoutProps) {
  return (
    <div className="bc-page-container">
      <BCPageHeader 
        heading={heading}
        description={description}
        backgroundImage={backgroundImage}
        className={headerClassName}
        logo={logo}
      />
      
      <main className={cn("bc-page-content", className)}>
        <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 max-w-7xl w-full">
          {children}
        </div>
      </main>
    </div>
  );
}