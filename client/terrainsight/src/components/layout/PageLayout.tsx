import React from 'react';
import { useAppMode } from '../../contexts/AppModeContext';
import { AdaptiveBackground, ContentBackdrop, GradientDivider } from '../ui/background';
import { Section, PageHeader } from '../ui/design-system';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  fullWidth?: boolean;
  className?: string;
  contentClassName?: string;
}

/**
 * PageLayout that adapts based on application mode
 * Creates a responsive layout with title, description and consistent padding
 * Enhanced with animations and creative styling from landing page
 */
export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  title,
  description,
  actions,
  breadcrumbs,
  fullWidth = false,
  className,
  contentClassName
}) => {
  const { isStandalone } = useAppMode();
  
  // Use different padding based on application mode
  const layoutClasses = cn(
    'flex flex-col min-h-[calc(100vh-4rem)]',
    'pl-0', // Default padding
    className
  );
  
  // Content area classes with consistent padding
  const contentClasses = cn(
    'flex-grow p-4 sm:p-6 md:p-8',
    !fullWidth && 'max-w-7xl mx-auto',
    contentClassName
  );
  
  // Animation variants for page elements
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      } 
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };
  
  return (
    <AdaptiveBackground>
      <div className={layoutClasses}>
        <motion.main 
          className={contentClasses}
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <ContentBackdrop variant="glass" className="p-6 sm:p-8 rounded-xl">
            {(title || description || breadcrumbs) && (
              <motion.div variants={itemVariants}>
                <PageHeader
                  title={title || ''}
                  description={description}
                  breadcrumbs={breadcrumbs}
                  actions={actions}
                  className="mb-6"
                />
                <GradientDivider className="mb-6" />
              </motion.div>
            )}
            <motion.div variants={itemVariants}>
              {children}
            </motion.div>
          </ContentBackdrop>
        </motion.main>
      </div>
    </AdaptiveBackground>
  );
};

/**
 * ContentSection provides consistent padding and layout for page sections
 * Enhanced with glass styling and animations
 */
export const ContentSection: React.FC<{
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'subtle';
  animate?: boolean;
}> = ({ 
  title, 
  description, 
  children, 
  className, 
  variant = 'default',
  animate = true
}) => {
  // Animation variants
  const sectionVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };
  
  const contentVariant = variant === 'glass' 
    ? 'p-6 bg-white/80 backdrop-blur-md rounded-xl border border-blue-50 shadow-sm'
    : variant === 'subtle'
    ? 'p-4'
    : 'p-6 bg-white rounded-lg border border-gray-100 shadow-sm';
  
  return (
    <motion.div
      initial={animate ? "hidden" : undefined}
      animate={animate ? "visible" : undefined}
      variants={sectionVariants}
      className={cn('mb-8', className)}
    >
      <Section
        title={title}
        description={description}
        className={contentVariant}
      >
        {children}
      </Section>
    </motion.div>
  );
};