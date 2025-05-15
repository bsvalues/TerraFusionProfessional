import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

/**
 * Section container with consistent styling and optional heading
 */
export const Section: React.FC<{
  title?: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}> = ({ title, description, className, children }) => {
  return (
    <section className={cn('py-8', className)}>
      {(title || description) && (
        <div className="mb-6">
          {title && <h2 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h2>}
          {description && <p className="mt-2 text-gray-600">{description}</p>}
        </div>
      )}
      {children}
    </section>
  );
};

/**
 * PageHeader with consistent styling and optional breadcrumbs
 */
export const PageHeader: React.FC<{
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  className?: string;
}> = ({ title, description, actions, breadcrumbs, className }) => {
  return (
    <div className={cn('mb-8 pb-4 border-b border-gray-200', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="flex items-center gap-1 mb-2 text-sm text-gray-500">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && <span className="px-1">/</span>}
              {crumb.href ? (
                <a href={crumb.href} className="hover:text-primary transition-colors">
                  {crumb.label}
                </a>
              ) : (
                <span className="font-medium text-gray-700">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">{title}</h1>
          {description && <p className="mt-2 text-lg text-gray-600">{description}</p>}
        </div>
        {actions && <div className="ml-auto">{actions}</div>}
      </div>
    </div>
  );
};

/**
 * Enhanced Card component with more visual options
 */
export const EnhancedCard: React.FC<{
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
  hoverable?: boolean;
  variant?: 'default' | 'outline' | 'filled';
}> = ({ title, description, icon, footer, className, children, hoverable = false, variant = 'default' }) => {
  const variantClasses = {
    default: '',
    outline: 'border border-gray-200',
    filled: 'bg-muted',
  };

  return (
    <Card
      className={cn(
        variantClasses[variant],
        hoverable && 'transition-all duration-200 hover:shadow-md hover:-translate-y-1',
        className
      )}
    >
      {(title || description) && (
        <CardHeader>
          <div className="flex items-center">
            {icon && <div className="mr-3">{icon}</div>}
            <div>
              {title && <CardTitle>{title}</CardTitle>}
              {description && <CardDescription>{description}</CardDescription>}
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
};

/**
 * AnimatedBadge with subtle animation effects
 */
export const AnimatedBadge: React.FC<{
  text: string;
  color?: 'default' | 'primary' | 'secondary' | 'destructive' | 'green' | 'yellow' | 'purple';
  className?: string;
  animate?: boolean;
}> = ({ text, color = 'default', className, animate = true }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  // Colors mapped to Tailwind classes
  const colorClasses = {
    default: '',
    primary: 'bg-primary/10 text-primary border-primary/30',
    secondary: 'bg-secondary/10 text-secondary border-secondary/30',
    destructive: 'bg-destructive/10 text-destructive border-destructive/30',
    green: 'bg-green-100 text-green-800 border-green-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
  };

  // Animation effect on mount
  useEffect(() => {
    if (animate) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [animate]);

  return (
    <Badge
      variant="outline"
      className={cn(
        'px-2 py-1 text-xs font-medium border',
        colorClasses[color],
        isAnimating && 'animate-pulse',
        className
      )}
    >
      {text}
    </Badge>
  );
};

/**
 * StatusIndicator component for showing various status states
 */
export const StatusIndicator: React.FC<{
  status: 'success' | 'warning' | 'error' | 'info';
  text: string;
  className?: string;
  showIcon?: boolean;
}> = ({ status, text, className, showIcon = true }) => {
  const statusConfig = {
    success: {
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      icon: <CheckCircle className="h-4 w-4 text-green-600" />,
    },
    warning: {
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      icon: <AlertTriangle className="h-4 w-4 text-yellow-600" />,
    },
    error: {
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      icon: <XCircle className="h-4 w-4 text-red-600" />,
    },
    info: {
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
      icon: <Info className="h-4 w-4 text-blue-600" />,
    },
  };

  const { bgColor, textColor, icon } = statusConfig[status];

  return (
    <div
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
        bgColor,
        textColor,
        className
      )}
    >
      {showIcon && <span className="mr-1.5">{icon}</span>}
      {text}
    </div>
  );
};

/**
 * ActionButton with consistent styling and optional icon
 */
export const ActionButton: React.FC<{
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  disabled?: boolean;
}> = ({ children, icon, onClick, variant = 'default', size = 'default', className, disabled = false }) => {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      className={cn('flex items-center', className)}
      disabled={disabled}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </Button>
  );
};

/**
 * Feature highlight component for showcasing new features
 */
export const FeatureHighlight: React.FC<{
  title: string;
  description: string;
  icon?: React.ReactNode;
  isNew?: boolean;
  className?: string;
}> = ({ title, description, icon, isNew = false, className }) => {
  return (
    <div className={cn('p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg', className)}>
      <div className="flex items-start">
        {icon && <div className="mr-4 mt-1 text-primary">{icon}</div>}
        <div>
          <div className="flex items-center">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {isNew && (
              <span className="ml-2 px-1.5 py-0.5 bg-primary/20 text-primary text-xs font-medium rounded">
                NEW
              </span>
            )}
          </div>
          <p className="mt-1 text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  );
};

/**
 * ContentPanel for grouping related content with a title
 */
export const ContentPanel: React.FC<{
  title?: string;
  description?: string;
  className?: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, description, className, headerActions, children }) => {
  return (
    <div className={cn('bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden', className)}>
      {(title || description || headerActions) && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <div>
            {title && <h3 className="text-lg font-medium text-gray-900">{title}</h3>}
            {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
          </div>
          {headerActions && <div>{headerActions}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
};