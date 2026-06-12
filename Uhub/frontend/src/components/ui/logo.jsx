import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const Logo = ({
  size = 'md',
  variant,
  showText = true,
  className = '',
  textClassName = '',
  centered = false,
  compact = false
}) => {
  const { isDark } = useTheme();

  const sizeClasses = {
    xs: 'h-6 w-auto',
    sm: 'h-8 w-auto',
    md: 'h-10 w-auto',
    lg: 'h-12 w-auto',
    xl: 'h-16 w-auto',
    '2xl': 'h-20 w-auto'
  };

  const resolvedVariant = variant || (isDark ? 'negative' : 'default');

  const logoSource = {
    default: '/uDriveLogo.png',
    positive: '/uDriveLogoPos.png',
    negative: '/uDriveLogoNeg.png'
  };

  const textSizes = {
    xs: 'text-sm',
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl',
    '2xl': 'text-3xl'
  };

  const containerClasses = `flex items-center ${centered ? 'justify-center' : ''} ${className}`;
  const logoClasses = `${sizeClasses[size]} ${showText && !compact ? 'mr-2' : ''}`;
  const textClasses = `font-bold text-content-primary ${textSizes[size]} ${textClassName}`;

  return (
    <div className={containerClasses}>
      <img
        src={logoSource[resolvedVariant] || logoSource.default}
        alt="U Drive Logo"
        className={logoClasses}
      />
      {showText && (
        <span className={textClasses}>
          hub
        </span>
      )}
    </div>
  );
};

export default Logo;
