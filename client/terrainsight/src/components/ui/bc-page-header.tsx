import React from 'react';
import { cn } from '@/lib/utils';

export interface BCPageHeaderProps {
  heading: string;
  description?: string;
  backgroundImage?: string;
  className?: string;
  logo?: boolean;
}

/**
 * A Benton County styled page header component that supports background images
 */
export function BCPageHeader({
  heading,
  description,
  backgroundImage,
  className,
  logo = false,
}: BCPageHeaderProps) {
  const headerClasses = cn(
    'relative mb-8',
    backgroundImage ? 'bc-page-header-image py-16' : 'bc-page-header py-8',
    className
  );

  const contentClasses = cn(
    'container max-w-7xl mx-auto relative px-4 sm:px-6 lg:px-8 w-full',
    backgroundImage ? 'bc-page-header-content text-white z-10' : 'text-white'
  );

  return (
    <header
      className={headerClasses}
      style={
        backgroundImage
          ? {
              backgroundImage: `url(${backgroundImage})`,
            }
          : undefined
      }
    >
      <div className={contentClasses}>
        <div className="flex items-center gap-6">
          {logo && (
            <div className="hidden md:block">
              <img 
                src="/benton-county-logo.png" 
                alt="Benton County Logo"
                className="w-16 h-16" 
              />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold mb-2">{heading}</h1>
            {description && (
              <p className="text-lg opacity-90 max-w-2xl">{description}</p>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}