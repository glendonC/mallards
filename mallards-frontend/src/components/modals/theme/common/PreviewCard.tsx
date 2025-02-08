import React from 'react';
import { PreviewCardProps } from './types';

const PreviewCard: React.FC<PreviewCardProps> = ({ item, index }) => {
  const { title, description, icon: Icon, onClick, gradient, className } = item;

  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-xl p-6 cursor-pointer 
        group transition-all duration-300
        hover:shadow-xl overflow-hidden 
        ${className}
      `}
    >
      {/* Gradient Background */}
      <div 
        className={`
          absolute inset-0 bg-gradient-to-br
          ${gradient || 'from-gray-500/20 via-gray-300/20 to-gray-100/20'}
          opacity-50 group-hover:opacity-100 
          transition-opacity duration-300
        `} 
      />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        <div className="mb-4">
          <Icon className="w-8 h-8 text-gray-700" />
        </div>
        
        <h3 className="text-xl font-semibold mb-2">
          {title}
        </h3>
        
        <p className="text-gray-600 text-sm">
          {description}
        </p>
        
        <div className="mt-auto">
          <span className="
            inline-flex items-center text-sm font-medium
            text-gray-700 group-hover:text-gray-900 
            transition-colors duration-300
          ">
            Configure →
          </span>
        </div>
      </div>
    </div>
  );
};

export default PreviewCard;