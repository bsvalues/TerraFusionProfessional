import React from 'react';
import { cn } from '@/lib/utils';
import { useAppMode } from '@/contexts/AppModeContext';

interface AdaptiveSectionProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
  contentClassName?: string;
  actions?: React.ReactNode;
}

/**
 * AdaptiveSection provides a consistent section layout that adapts based on app mode
 */
export const AdaptiveSection: React.FC<AdaptiveSectionProps> = ({
  children,
  title,
  description,
  className,
  contentClassName,
  actions,
}) => {
  const { isIntegrated, config } = useAppMode();
  
  const sectionClasses = cn(
    'w-full',
    isIntegrated ? 'mb-4' : 'mb-6',
    className
  );
  
  const contentClasses = cn(
    'mt-4',
    contentClassName
  );
  
  return (
    <section className={sectionClasses}>
      {(title || description || actions) && (
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <div>
            {title && (
              <h2 className={cn(
                'font-medium',
                isIntegrated ? 'text-lg' : 'text-xl'
              )}>
                {title}
              </h2>
            )}
            {description && (
              <p className="text-muted-foreground text-sm mt-1">
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      )}
      <div className={contentClasses}>
        {children}
      </div>
    </section>
  );
};