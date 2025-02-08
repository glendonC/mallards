import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface AlertProps {
  children: React.ReactNode;
  variant?: 'default' | 'destructive';
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({ children, variant = 'default', className = '' }) => {
  const { customColors } = useTheme();
  
  return (
    <div className={`p-4 rounded-lg border ${
      variant === 'destructive' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
    } ${className}`}>
      {children}
    </div>
  );
};

export const AlertTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h5 className="mb-1 font-medium">{children}</h5>
);

export const AlertDescription: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-sm opacity-90">{children}</div>
);
