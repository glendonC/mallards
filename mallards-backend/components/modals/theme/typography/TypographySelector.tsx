// src/components/theme/typography/TypographySelector.tsx
import React from 'react';
import { useTheme } from '../../../../context/ThemeContext';
import OptionButton from '../common/OptionButton';
import TypographyPreview from './TypographyPreview';
import { FontFamily, fontOptions } from './typographyConfigs';

interface TypographySelectorProps {
  onClose: () => void;
}

export const TypographySelector: React.FC<TypographySelectorProps> = ({ onClose }) => {
  const { setFontFamily } = useTheme();
  const [selectedFont, setSelectedFont] = React.useState<FontFamily>('DM Sans');

  const handleFontChange = (fontFamily: FontFamily) => {
    setSelectedFont(fontFamily);
  };

  return (
    <div className="flex h-full">
      <div className="w-1/3 border-r border-gray-200 p-4 space-y-4">
        <h3 className="text-lg font-semibold mb-4">Choose a Font</h3>
        <div className="space-y-2">
          {fontOptions.map(font => (
            <OptionButton
              key={font.id}
              selected={selectedFont === font.id}
              onClick={() => handleFontChange(font.id)}
            >
              <div>
                <p style={{ fontFamily: font.id }}>{font.name}</p>
                {font.previewText && (
                  <p className="text-sm text-gray-500">{font.previewText}</p>
                )}
              </div>
            </OptionButton>
          ))}
        </div>
      </div>
      
      <div className="w-2/3 p-4">
        <h3 className="text-lg font-semibold mb-4">Preview</h3>
        <TypographyPreview selectedFont={selectedFont} />
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              setFontFamily(selectedFont);
              onClose();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Apply Typography
          </button>
        </div>
      </div>
    </div>
  );
};

export default TypographySelector;