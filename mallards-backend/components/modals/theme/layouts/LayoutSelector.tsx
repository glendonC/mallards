// src/components/theme/layouts/LayoutSelector.tsx
import React from 'react';
import { useTheme } from '../../../../context/ThemeContext';
import LayoutPreview from './LayoutPreview';
import OptionButton from '../common/OptionButton';
import { LayoutId, layoutOptions } from './layoutConfigs';

interface LayoutSelectorProps {
  onClose: () => void;
}

export const LayoutSelector: React.FC<LayoutSelectorProps> = ({ onClose }) => {
  const { applyLayout } = useTheme();
  const [selectedLayout, setSelectedLayout] = React.useState<LayoutId>('grid-default');

  const handleLayoutChange = (layoutId: LayoutId) => {
    setSelectedLayout(layoutId);
  };

  return (
    <div className="flex h-full">
      <div className="w-1/3 border-r border-gray-200 p-4 space-y-4">
        <h3 className="text-lg font-semibold mb-4">Choose a Layout</h3>
        <div className="space-y-2">
          {layoutOptions.map(layout => (
            <OptionButton
              key={layout.id}
              selected={selectedLayout === layout.id}
              onClick={() => handleLayoutChange(layout.id)}
            >
              {layout.name}
            </OptionButton>
          ))}
        </div>
      </div>
      
      <div className="w-2/3 p-4">
        <h3 className="text-lg font-semibold mb-4">Preview</h3>
        <LayoutPreview selectedLayout={selectedLayout} />
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              applyLayout(selectedLayout);
              onClose();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Apply Layout
          </button>
        </div>
      </div>
    </div>
  );
};

export default LayoutSelector;