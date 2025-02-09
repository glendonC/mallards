// src/components/theme/common/OptionButton.tsx
import React from 'react';
import { OptionButtonProps } from './types';

const OptionButton: React.FC<OptionButtonProps> = ({
  selected,
  onClick,
  children,
  className = ''
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left p-3 rounded-lg transition-colors
        ${selected 
          ? 'bg-blue-50 text-blue-700 border-2 border-blue-200' 
          : 'hover:bg-gray-50 border-2 border-transparent'
        }
        ${className}
      `}
    >
      {children}
    </button>
  );
};

export default OptionButton;