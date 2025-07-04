import React from 'react';
import logo from '../assets/logo.png';


const Logo: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div className="flex items-center">
      <div className={`relative ${sizeClasses[size]}`}>
        <img src={logo} alt="Logo" className="w-full h-full object-contain" />
        <div className="absolute bottom-0 left-0 right-0 text-center text-xs font-bold text-blue-900"></div>
      </div>
      {size === 'lg' && (
        <span className="ml-2 text-lg font-semibold text-gray-700">LAKSHMI LIFE SCIENCES</span>
      )}
    </div>
  );
};

export default Logo;
