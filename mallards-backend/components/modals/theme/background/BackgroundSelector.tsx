import React, { useState } from "react";
import BackgroundPreview from "./BackgroundPreview";
import OptionButton from '../common/OptionButton';
import FlickeringGrid from "../../../ui/flickering-grid";
import { DotPattern } from "../../../ui/dot-pattern";
import { useTheme } from "../../../../context/ThemeContext";

interface BackgroundSelectorProps {
  onClose: () => void;
}

const createBackgroundOptions = (customColors: any) => [
  {
    id: "clean-interface",
    title: "Clean Interface",
    description: "Minimalist background for clear data visibility",
    component: ({ className }: { className: string }) => (
      <div className={`${className}`} style={{
        backgroundColor: `${customColors.backgroundColor}80`
      }} />
    ),
  },
  {
    id: "flickering-grid",
    title: "Data Matrix",
    description: "Dynamic data visualization pattern",
    component: ({ className }: { className: string }) => (
      <div className={className}>
        <FlickeringGrid
          className="size-full"
          squareSize={4}
          gridGap={6}
          color="#2563eb"
          maxOpacity={0.2}
          flickerChance={0.1}
        />
      </div>
    ),
  },
  {
    id: "dot-pattern",
    title: "Analysis Grid",
    description: "Subtle pattern for data-driven interfaces",
    component: ({ className }: { className: string }) => (
      <div 
        className={className} 
        style={{ 
          backgroundColor: "#f8fafc",
          backgroundImage: `radial-gradient(#2563eb 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
          opacity: 0.8
        }}
      />
    ),
  },
];

const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({ onClose }) => {
  const { customColors, updateBackground } = useTheme();
  const backgroundOptions = createBackgroundOptions(customColors);
  const [selectedBackground, setSelectedBackground] = useState(backgroundOptions[0]);

  const handleApplyBackground = () => {
    updateBackground(selectedBackground.id, {
      colors: customColors,
      // Add any other config needed for the specific background type
    });
    onClose();
  };

  return (
    <div className="flex h-full">
      {/* Options Panel */}
      <div className="w-1/3 border-r border-gray-200 p-4 space-y-4">
        <h3 className="text-lg font-semibold mb-4">Choose a Background</h3>
        <div className="space-y-2">
          {backgroundOptions.map((option) => (
            <OptionButton
              key={option.id}
              selected={selectedBackground.id === option.id}
              onClick={() => setSelectedBackground(option)}
            >
              <div className="space-y-1">
                <p className="font-medium">{option.title}</p>
                <p className="text-sm text-gray-500">{option.description}</p>
                <div className="h-12 w-full rounded-md overflow-hidden mt-2">
                  <option.component className="w-full h-full" />
                </div>
              </div>
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Preview Panel */}
      <div className="w-2/3 p-4">
        <h3 className="text-lg font-semibold mb-4">Preview</h3>
        <div className="relative aspect-video rounded-xl overflow-hidden border border-gray-200">
          <div className="absolute inset-0">
            {selectedBackground && (
              <selectedBackground.component className="w-full h-full" />
            )}
          </div>
          <div className="relative z-10 p-6">
            <div className="grid grid-cols-3 gap-4 h-full">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-sm"
                >
                  <div className="h-full flex flex-col justify-between">
                    <div className="text-sm font-medium text-gray-600">Metric {item}</div>
                    <div className="text-2xl font-bold text-gray-800">
                      {Math.floor(Math.random() * 1000)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleApplyBackground}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Apply Background
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackgroundSelector;
