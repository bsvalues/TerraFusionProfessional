import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Separator } from './separator';
import { Badge } from './badge';
import { ChevronRight } from 'lucide-react';
import { Button } from './button';

/**
 * Stat Card component for displaying key metrics
 */
export const StatCard: React.FC<{
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}> = ({ title, value, description, icon, trend, className }) => {
  return (
    <Card className={cn("border shadow-sm hover:shadow transition-shadow", className)}>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
          {icon && <div className="text-primary/80">{icon}</div>}
        </div>
      </CardHeader>
      <CardContent className="pb-4 pt-0 px-4">
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-gray-500 mt-1">
            {description}
          </p>
        )}
        {trend && (
          <div className="flex items-center mt-2">
            <div 
              className={cn(
                "text-xs font-medium flex items-center",
                trend.isPositive ? "text-green-600" : "text-red-600"
              )}
            >
              {trend.isPositive ? "↑" : "↓"} {trend.value}%
            </div>
            <span className="text-xs text-gray-500 ml-1">vs. last period</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Section header component 
 */
export const SectionHeader: React.FC<{
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}> = ({ title, description, action, className }) => {
  return (
    <div className={cn("flex justify-between items-start mb-4", className)}>
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

/**
 * Card for activities, notifications, etc.
 */
export const ActivityCard: React.FC<{
  items: Array<{
    id: string | number;
    icon?: React.ReactNode;
    title: string;
    time?: string;
    description?: string;
    badge?: {
      text: string;
      variant?: 'default' | 'outline' | 'secondary' | 'destructive';
    };
  }>;
  title?: string;
  description?: string;
  viewAllHref?: string;
  className?: string;
  maxHeight?: string;
}> = ({ items, title, description, viewAllHref, className, maxHeight = '300px' }) => {
  return (
    <Card className={cn("border shadow-sm", className)}>
      {(title || description) && (
        <CardHeader className="pb-2">
          {title && <CardTitle className="text-lg font-semibold">{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className="p-0">
        <div className={cn("overflow-auto", maxHeight && `max-h-[${maxHeight}]`)}>
          {items.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              No items to display
            </div>
          ) : (
            <div className="space-y-0">
              {items.map((item, index) => (
                <div 
                  key={item.id} 
                  className={cn(
                    "flex items-center p-4",
                    index < items.length - 1 && "border-b border-gray-100"
                  )}
                >
                  {item.icon && (
                    <div className="mr-3 flex-shrink-0">
                      {item.icon}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.title}
                      </p>
                      {item.time && <span className="text-xs text-gray-500">{item.time}</span>}
                    </div>
                    {item.description && (
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {item.description}
                      </p>
                    )}
                  </div>
                  {item.badge && (
                    <Badge 
                      variant={item.badge.variant || 'outline'} 
                      className="ml-2 flex-shrink-0"
                    >
                      {item.badge.text}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {viewAllHref && (
          <div className="bg-gray-50 px-4 py-2 border-t flex justify-end">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs flex items-center text-gray-700"
              asChild
            >
              <a href={viewAllHref}>
                <span>View all</span>
                <ChevronRight className="ml-1 h-3 w-3" />
              </a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Feature card for highlighting new features or important sections
 */
export const FeatureCard: React.FC<{
  title: string;
  description: string;
  icon?: React.ReactNode;
  isNew?: boolean;
  action?: {
    label: string;
    href: string;
  };
  className?: string;
}> = ({ title, description, icon, isNew, action, className }) => {
  return (
    <div className={cn(
      "p-5 rounded-lg border bg-gradient-to-br from-gray-50 to-gray-100", 
      className
    )}>
      <div className="flex items-start">
        {icon && <div className="mr-4 text-primary">{icon}</div>}
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <h3 className="text-sm font-semibold">{title}</h3>
            {isNew && (
              <Badge 
                className="ml-2 px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100" 
                variant="outline"
              >
                NEW
              </Badge>
            )}
          </div>
          <p className="text-xs text-gray-600">{description}</p>
          
          {action && (
            <div className="mt-3">
              <Button 
                variant="link" 
                className="text-xs text-primary p-0 h-auto" 
                asChild
              >
                <a href={action.href}>
                  {action.label} <ChevronRight className="ml-1 h-3 w-3" />
                </a>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Card with a gradient border for visual interest
 */
export const GradientCard: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <div className={cn(
      "relative rounded-lg p-px overflow-hidden",
      className
    )}>
      {/* Gradient border effect */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20" />
      
      {/* Inner content with background */}
      <div className="relative bg-white dark:bg-gray-950 rounded-[calc(0.5rem-1px)] p-4">
        {children}
      </div>
    </div>
  );
};

/**
 * Page section with a title and optional description
 */
export const PageSection: React.FC<{
  title?: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}> = ({ title, description, children, action, className }) => {
  return (
    <section className={cn("py-4", className)}>
      {(title || description) && (
        <SectionHeader 
          title={title || ''} 
          description={description} 
          action={action}
          className="mb-4"
        />
      )}
      {children}
    </section>
  );
};