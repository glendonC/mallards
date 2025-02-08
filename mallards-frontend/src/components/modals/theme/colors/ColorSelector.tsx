// src/components/theme/colors/ColorSelector.tsx
import React from 'react';
import { useTheme } from '../../../../context/ThemeContext';
import OptionButton from '../common/OptionButton';
import ColorPreview from './ColorPreview';
import themePresets, { ThemePresetId } from './colorConfigs';

interface ColorSelectorProps {
  onClose: () => void;
}

const ColorSelector: React.FC<ColorSelectorProps> = ({ onClose }) => {
  const { applyThemePreset, customColors } = useTheme();
  const [selectedTheme, setSelectedTheme] = React.useState<ThemePresetId>('hub-classic');

  const handleThemeChange = (themeId: ThemePresetId) => {
    setSelectedTheme(themeId);
  };

  return (
    <div className="flex h-full">
      <div className="w-1/3 border-r border-gray-200 p-4 space-y-4">
        <h3 className="text-lg font-semibold mb-4">Choose a Theme</h3>
        <div className="space-y-2">
          {Object.values(themePresets).map(theme => (
            <OptionButton
              key={theme.id}
              selected={selectedTheme === theme.id}
              onClick={() => handleThemeChange(theme.id)}
            >
              <div className="space-y-1">
                <p className="font-medium">{theme.name}</p>
                <p className="text-sm text-gray-500">{theme.description}</p>
                {/* Color swatches */}
                <div className="flex space-x-1 mt-2">
                  <div className="w-6 h-6 rounded" 
                       style={{ backgroundColor: theme.colors.backgroundColor }} />
                  <div className="w-6 h-6 rounded" 
                       style={{ backgroundColor: theme.colors.tileColor }} />
                  <div className="w-6 h-6 rounded" 
                       style={{ backgroundColor: theme.colors.accentColor }} />
                </div>
              </div>
            </OptionButton>
          ))}
        </div>
      </div>
      
      <div className="w-2/3 p-4">
        <h3 className="text-lg font-semibold mb-4">Preview</h3>
        <ColorPreview 
          selectedTheme={selectedTheme}
          previewColors={themePresets[selectedTheme].colors}
        />
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              applyThemePreset(selectedTheme);
              onClose();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Apply Theme
          </button>
        </div>
      </div>
    </div>
  );
};

export default ColorSelector;