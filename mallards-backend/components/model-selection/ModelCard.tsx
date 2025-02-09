import React from 'react';
import { Info, Target, Zap } from 'lucide-react';
import { Model } from '../../types/model';
import Tooltip from '../Tooltip';
// ... other imports

interface ModelCardProps {
  model: Model;
  isSelected: boolean;
  onSelect: (id: string) => void;
  customColors: any;
}

export const ModelCard: React.FC<ModelCardProps> = ({ 
  model, 
  isSelected, 
  onSelect, 
  customColors 
}) => {
  const renderSpeedIndicator = (speed: number) => {
    return Array(4).fill(0).map((_, i) => (
      <Zap 
        key={i}
        className={`w-4 h-4 ${i < speed ? 'text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  const renderMemoryIndicator = (memory: number) => {
    return Array(4).fill(0).map((_, i) => (
      <Target 
        key={i}
        className={`w-4 h-4 ${i < memory ? 'text-blue-400' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div
      className={`p-6 rounded-lg cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
      style={{ backgroundColor: customColors?.tileColor }}
      onClick={() => onSelect(model.id)}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-medium" style={{ color: customColors?.textColor }}>
          {model.name}
        </h3>
        <div className="flex gap-4">
          <Tooltip text="Processing Speed - More bolts = Faster">
            <div className="flex items-center gap-1">
              {renderSpeedIndicator(model.speed)}
            </div>
          </Tooltip>
          <Tooltip text="Memory Usage - More targets = More Efficient">
            <div className="flex items-center gap-1">
              {renderMemoryIndicator(model.memory)}
            </div>
          </Tooltip>
        </div>
      </div>
      
      <p className="text-sm mb-4 opacity-75" style={{ color: customColors?.textColor }}>
        {model.description}
      </p>

      <div className="space-y-2">
        <h4 className="text-sm font-medium" style={{ color: customColors?.textColor }}>
          Best for:
        </h4>
        <ul className="text-sm space-y-1">
          {model.useCases.map((useCase, index) => (
            <li 
              key={index}
              className="flex items-center gap-2"
              style={{ color: customColors?.textColor }}
            >
              <Info className="w-3 h-3" />
              {useCase}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ModelCard; 