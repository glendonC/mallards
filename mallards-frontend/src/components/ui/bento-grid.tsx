import { ReactNode } from "react";
import React from "react";

interface BentoGridProps {
  children: ReactNode;
  className?: string;
}

interface BentoCardProps {
  name: string;
  description: string;
  onClick?: () => void;
  Icon?: React.ElementType;
  className?: string;
}

export const BentoGrid: React.FC<BentoGridProps> = ({ children, className }) => {
  return (
    <div 
      className={`grid grid-cols-1 lg:grid-cols-3 gap-4 w-full ${className ?? ""}`}
      style={{ minHeight: '400px' }} // Ensure minimum height
    >
      {children}
    </div>
  );
};

export const BentoCard: React.FC<BentoCardProps> = ({
  name,
  description,
  onClick,
  Icon,
  className,
}) => {
  return (
    <div
      className={`
        bg-white dark:bg-gray-800 
        p-6 rounded-xl shadow-md 
        hover:shadow-xl transition-shadow 
        cursor-pointer
        flex flex-col
        ${className}
      `}
      onClick={onClick}
    >
      <div className="flex flex-col h-full space-y-4">
        {Icon && (
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700">
            <Icon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </div>
        )}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {name}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 flex-grow">
          {description}
        </p>
      </div>
    </div>
  );
};