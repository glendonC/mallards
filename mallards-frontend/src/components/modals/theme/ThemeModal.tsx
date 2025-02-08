import React, { useState } from "react";
import { Layout, Palette, Type, Image, ArrowLeft } from "lucide-react";
import LayoutSelector from "./layouts/LayoutSelector";
import TypographySelector from './typography/TypographySelector';
import ColorSelector from "./colors/ColorSelector";
import PreviewCard from './common/PreviewCard';
import { ThemeOption } from './common/types';
import BackgroundSelector from "./background/BackgroundSelector";

interface ThemeModalProps {
  onClose: () => void;
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
}

type ThemeOptionType = 'layouts' | 'colors' | 'typography' | 'background' | null;

const ThemeModal: React.FC<ThemeModalProps> = ({ onClose }) => {
  const [selectedOption, setSelectedOption] = useState<ThemeOptionType>(null);

  const items: ThemeOption[] = [
    {
      title: "Layouts",
      description: "Customize dashboard layout and metrics arrangement",
      icon: Layout,
      onClick: () => setSelectedOption("layouts"),
      className: "lg:col-span-2 lg:row-span-1",
      gradient: "from-blue-500/20 via-blue-300/20 to-blue-100/20"
    },
    {
      title: "Theme Colors",
      description: "Select from our curated theme presets",
      icon: Palette,
      onClick: () => setSelectedOption("colors"),
      className: "lg:row-span-2",
      gradient: "from-purple-500/20 via-purple-300/20 to-purple-100/20"
    },
    {
      title: "Typography",
      description: "Choose fonts and text styling",
      icon: Type,
      onClick: () => setSelectedOption("typography"),
      className: "lg:col-span-1",
      gradient: "from-green-500/20 via-green-300/20 to-green-100/20"
    },
    {
      title: "Background",
      description: "Customize dashboard background",
      icon: Image,
      onClick: () => setSelectedOption("background"),
      className: "lg:col-span-1",
      gradient: "from-amber-500/20 via-amber-300/20 to-amber-100/20"
    }
  ];

  const renderContent = () => {
    switch (selectedOption) {
      case "layouts":
        return <LayoutSelector onClose={() => setSelectedOption(null)} />;
      case "colors":
        return <ColorSelector onClose={() => setSelectedOption(null)} />;
      case "typography":
        return <TypographySelector onClose={() => setSelectedOption(null)} />;
      case "background":
        return <BackgroundSelector onClose={() => setSelectedOption(null)} />;
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-[200px]">
            {items.map((item, index) => (
              <PreviewCard 
                key={index} 
                item={item} 
                index={index} 
              />
            ))}
          </div>
        );
    }
  };

  const getModalTitle = () => {
    if (!selectedOption) return 'Customize Theme';
    return `Select ${selectedOption.charAt(0).toUpperCase() + selectedOption.slice(1)}`;
  };

  return (
    <div className="theme-modal-overlay">
      <div className="theme-modal-content max-w-5xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            {selectedOption && (
              <button
                onClick={() => setSelectedOption(null)}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors mr-2"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" strokeWidth={2.5} />
              </button>
            )}
            <h2 className="text-2xl font-bold leading-6 translate-y-[2px]">
              {getModalTitle()}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {renderContent()}
      </div>
    </div>
  );
};

export default ThemeModal;