import React from 'react';

interface TerraInsightLogoProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'standard' | 'icon-only';
  className?: string;
}

const TerraInsightLogo: React.FC<TerraInsightLogoProps> = ({
  size = 'medium',
  variant = 'standard',
  className = '',
}) => {
  // Size mapping based on prop
  const sizeMap = {
    small: { logo: 32, text: 'text-lg' },
    medium: { logo: 48, text: 'text-2xl' },
    large: { logo: 64, text: 'text-3xl' },
  };

  const dimensions = sizeMap[size] || sizeMap.medium;
  const logoSize = dimensions.logo;
  const textSize = dimensions.text;

  return (
    <div className={`flex items-center ${className}`}>
      {/* Logo Icon */}
      <div 
        className="relative" 
        style={{
          width: `${logoSize}px`,
          height: `${logoSize}px`,
        }}
      >
        {/* Glowing outer container */}
        <div 
          className="absolute inset-0 rounded-lg"
          style={{
            background: 'linear-gradient(135deg, rgba(10, 184, 182, 0.8) 0%, rgba(0, 128, 167, 0.8) 100%)',
            boxShadow: '0 0 15px rgba(20, 240, 230, 0.6)',
            transform: 'scale(1.05)',
            filter: 'blur(2px)',
          }}
        />
        
        {/* Main container */}
        <div 
          className="absolute inset-0 rounded-lg flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #05959A 0%, #006890 100%)',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.3)',
          }}
        >
          {/* 3D "TI" logo */}
          <svg
            width={logoSize * 0.7}
            height={logoSize * 0.7}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#14F0E6" />
                <stop offset="100%" stopColor="#20D7D0" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            
            {/* T shape */}
            <path 
              d="M4 6H20V9H14V18H10V9H4V6Z" 
              fill="url(#logoGradient)"
              filter="url(#glow)"
              style={{ 
                transform: 'translate(0px, -3px) scale(0.85)',
              }} 
            />
            
            {/* I shape */}
            <path 
              d="M10 11H14V20H10V11Z" 
              fill="url(#logoGradient)"
              filter="url(#glow)"
              style={{ 
                transform: 'translate(0px, -1px) scale(0.85)',
              }} 
            />
          </svg>
        </div>
      </div>
      
      {/* Text (conditionally rendered) */}
      {variant === 'standard' && (
        <div className="ml-3 font-bold" style={{ 
          background: 'linear-gradient(135deg, #0AB8B6 20%, #0080A7 80%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent' as any,
          backgroundClip: 'text',
        }}>
          <span className={`${textSize} tracking-tight`}>TerraInsight</span>
        </div>
      )}
    </div>
  );
};

export default TerraInsightLogo;