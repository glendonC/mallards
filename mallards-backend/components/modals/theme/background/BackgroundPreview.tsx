import React from "react";

interface BackgroundPreviewProps {
  option: {
    id: string;
    title: string;
    description: string;
    component: React.ComponentType<any>;
    props?: Record<string, any>;
  };
  onSelect: () => void;
}

const BackgroundPreview: React.FC<BackgroundPreviewProps> = ({
  option,
  onSelect,
}) => {
  const Component = option.component;

  return (
    <button
      onClick={onSelect}
      className="w-full text-left hover:opacity-90 transition-opacity"
    >
      <div className="relative h-[200px] rounded-lg overflow-hidden">
        <Component {...option.props} className="absolute inset-0" />
      </div>
      <div className="mt-2">
        <h3 className="font-medium text-lg">{option.title}</h3>
        <p className="text-sm text-gray-600">{option.description}</p>
      </div>
    </button>
  );
};

export default BackgroundPreview;
