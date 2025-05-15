import React from 'react';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import type { BreadcrumbItem } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { ChevronDown, HelpCircle, MoreHorizontal } from 'lucide-react';

export interface PageAction {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive';
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: PageAction[];
  children?: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  helpText?: string;
  showHelp?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumbs = [],
  actions = [],
  children,
  className,
  icon,
  helpText,
  showHelp = false,
}) => {
  // Determine how many actions to show directly vs in dropdown
  const visibleActions = actions.slice(0, 2);
  const overflowActions = actions.slice(2);

  return (
    <div className={cn('border-b pb-5', className)}>
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <div className="mb-3">
          <Breadcrumb items={breadcrumbs} />
        </div>
      )}

      {/* Title and actions row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          {icon && <div className="text-primary">{icon}</div>}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          </div>
          {showHelp && helpText && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <HelpCircle className="h-4 w-4" />
                  <span className="sr-only">Help</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[260px]">
                <div className="p-2">
                  <p className="text-sm">{helpText}</p>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Actions */}
        {actions.length > 0 && (
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {visibleActions.map((action, i) => (
              <Button 
                key={i}
                variant={action.variant || 'default'} 
                size="sm"
                onClick={action.onClick}
                asChild={!!action.href}
              >
                {action.href ? (
                  <a href={action.href}>
                    {action.icon && <span className="mr-2">{action.icon}</span>}
                    {action.label}
                  </a>
                ) : (
                  <>
                    {action.icon && <span className="mr-2">{action.icon}</span>}
                    {action.label}
                  </>
                )}
              </Button>
            ))}

            {/* Overflow actions dropdown */}
            {overflowActions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">More actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {overflowActions.map((action, i) => (
                    <DropdownMenuItem 
                      key={i} 
                      onClick={action.onClick}
                      asChild={!!action.href}
                    >
                      {action.href ? (
                        <a href={action.href} className="flex items-center">
                          {action.icon && <span className="mr-2">{action.icon}</span>}
                          {action.label}
                        </a>
                      ) : (
                        <>
                          {action.icon && <span className="mr-2">{action.icon}</span>}
                          {action.label}
                        </>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
      </div>

      {/* Children content (e.g., tabs, filter controls) */}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
};

export default PageHeader;