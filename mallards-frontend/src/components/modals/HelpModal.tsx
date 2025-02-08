import React from "react";
import { OrbitingCircles } from "../ui/orbiting-circles";
import { 
  SiReact, 
  SiTypescript, 
  SiTailwindcss, 
  SiAmazon,
  SiAmazons3,
  SiAwsamplify 
} from "react-icons/si";

interface HelpModalProps {
  onClose: () => void;
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="theme-modal-overlay">
      <div className="theme-modal-content max-w-5xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Help & About</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col items-center justify-center p-8">
          <div className="relative flex h-[400px] w-full flex-col items-center justify-center overflow-hidden rounded-lg">
            <span className="pointer-events-none whitespace-pre-wrap bg-gradient-to-b from-black to-gray-300 bg-clip-text text-center text-6xl font-semibold leading-none text-transparent dark:from-white dark:to-slate-600">
              Tech Stack
            </span>

            <OrbitingCircles iconSize={40}>
              <SiReact color="#3B82F6" />
              <SiTypescript color="#2563EB" />
              <SiTailwindcss color="#14B8A6" />
            </OrbitingCircles>
            <OrbitingCircles iconSize={35} radius={130} speed={1.5}>
              <SiAmazon color="#FF9900" />      {/* AWS General - standard orange */}
              <SiAmazons3 color="#569A31" />    {/* S3 - green */}
              <SiAmazon color="#FF9900" />      {/* Lambda - orange */}
              <SiAmazon color="#C925D1" />      {/* SNS - purple */}
              <SiAmazon color="#01A88D" />      {/* SageMaker - teal */}
              <SiAwsamplify color="#FF9900" />  {/* Amplify - orange */}
            </OrbitingCircles>
          </div>

          <div className="mt-8 text-center max-w-2xl">
            <h3 className="text-xl font-semibold mb-4">Welcome to Our Dashboard</h3>
            <p className="text-gray-600 mb-4">
              This dashboard is built with modern web technologies to provide a powerful and intuitive experience.
              The visualization above shows the core technologies that power this application.
            </p>
            <p className="text-gray-600">
              For additional support or documentation, please visit our documentation page or contact the support team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
