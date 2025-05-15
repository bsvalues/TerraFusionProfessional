import React from 'react';
import { Link } from 'wouter';
import TerraInsightLogo from './TerraInsightLogo';

interface TerraInsightFooterProps {
  className?: string;
}

const TerraInsightFooter: React.FC<TerraInsightFooterProps> = ({ className = '' }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`py-8 border-t border-gray-200 bg-gradient-to-b from-white to-gray-50 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <TerraInsightLogo size="small" />
            <p className="text-sm text-gray-500 mt-4">
              Advanced geospatial analytics for property assessment and valuation.
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4">Platform</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/map">
                  <span className="text-sm text-gray-600 hover:text-teal-600 transition-colors cursor-pointer">
                    Property Map
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/analytics">
                  <span className="text-sm text-gray-600 hover:text-teal-600 transition-colors cursor-pointer">
                    Analytics
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/dashboard">
                  <span className="text-sm text-gray-600 hover:text-teal-600 transition-colors cursor-pointer">
                    Dashboard
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/properties">
                  <span className="text-sm text-gray-600 hover:text-teal-600 transition-colors cursor-pointer">
                    Property Explorer
                  </span>
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4">Resources</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/documentation">
                  <span className="text-sm text-gray-600 hover:text-teal-600 transition-colors cursor-pointer">
                    Documentation
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/tutorials">
                  <span className="text-sm text-gray-600 hover:text-teal-600 transition-colors cursor-pointer">
                    Tutorials
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/support">
                  <span className="text-sm text-gray-600 hover:text-teal-600 transition-colors cursor-pointer">
                    Support
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/faq">
                  <span className="text-sm text-gray-600 hover:text-teal-600 transition-colors cursor-pointer">
                    FAQ
                  </span>
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4">Legal</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/terms">
                  <span className="text-sm text-gray-600 hover:text-teal-600 transition-colors cursor-pointer">
                    Terms of Service
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/privacy">
                  <span className="text-sm text-gray-600 hover:text-teal-600 transition-colors cursor-pointer">
                    Privacy Policy
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/accessibility">
                  <span className="text-sm text-gray-600 hover:text-teal-600 transition-colors cursor-pointer">
                    Accessibility
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/data-use">
                  <span className="text-sm text-gray-600 hover:text-teal-600 transition-colors cursor-pointer">
                    Data Use Policy
                  </span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500">
            © {currentYear} Benton County Assessor's Office. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/about">
              <span className="text-sm text-gray-600 hover:text-teal-600 transition-colors cursor-pointer">About</span>
            </Link>
            <Link href="/contact">
              <span className="text-sm text-gray-600 hover:text-teal-600 transition-colors cursor-pointer">Contact</span>
            </Link>
            <Link href="/sitemap">
              <span className="text-sm text-gray-600 hover:text-teal-600 transition-colors cursor-pointer">Sitemap</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default TerraInsightFooter;