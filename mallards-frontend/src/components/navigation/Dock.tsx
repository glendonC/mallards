import React, { useState, useEffect, useRef, MouseEvent } from "react";
import { useTheme } from "../../context/ThemeContext";
import "../../styles/components/dock.css";
import ThemeModal from "../modals/theme/ThemeModal";
import HelpModal from "../modals/HelpModal";
import { useNavigate } from 'react-router-dom';

interface DockItem {
  id: string;
  path?: string;
  modal?: string;
  icon: string; // Replace with your specific icon type if using a library
  class: string;
}

const Dock: React.FC = () => {
  const { customColors } = useTheme();
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const dockRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  const defaultScale = 1;
  const hoverScale = 2.5;
  const neighborScale = 2;
  const defaultMargin = "4px";
  const expandedMargin = "28px";

  const [isWideScreen, setIsWideScreen] = useState<boolean>(
    window.innerWidth >= 900
  );

  useEffect(() => {
    const handleResize = () => {
      setIsWideScreen(window.innerWidth >= 900);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getScale = (index: number): number => {
    if (!isWideScreen) return defaultScale;
    if (hoveredIndex === null) return defaultScale;
    if (index === hoveredIndex) return hoverScale;
    if (Math.abs(index - hoveredIndex) === 1) return neighborScale;
    return defaultScale;
  };

  const getMargin = (index: number): string => {
    if (!isWideScreen) return defaultMargin;
    if (hoveredIndex === null) return defaultMargin;
    if (index === hoveredIndex || Math.abs(index - hoveredIndex) === 1)
      return expandedMargin;
    return defaultMargin;
  };

  const dockItems: DockItem[] = [
    { id: "home", path: "/dashboard", icon: "home", class: "dock-hover-fx" },
    { id: "anomalies", path: "/anomalies", icon: "chart-line", class: "dock-hover-fx-1" },
    { id: "predictive", path: "/predictive", icon: "chart-bar", class: "dock-hover-fx-2" },
    { id: "simulation", path: "/simulation", icon: "flask", class: "dock-hover-fx-3" },
    { id: "theme", modal: "theme", icon: "palette", class: "dock-hover-fx-4" },
    { id: "help", modal: "help", icon: "question-circle", class: "dock-hover-fx-5" }
  ];

  const handleModalClose = (): void => {
    setActiveModal(null);
  };

  const handleClickOutside = (e: MouseEvent<HTMLDivElement>): void => {
    if ((e.target as HTMLElement).classList.contains("modal")) {
      handleModalClose();
    }
  };

  const handleClick = (item: DockItem) => {
    if (item.path) {
      navigate(item.path);
    } else if (item.modal) {
      setActiveModal(item.modal);
    }
  };

  return (
    <>
      <div
        className="dock-container"
        style={{
          backgroundColor: customColors.tileColor,
          borderColor: customColors.borderColor,
        }}
      >
        <div
          className="dock"
          ref={dockRef}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {dockItems.map((item, index) => (
            <div
              key={item.id}
              className={`dock-item ${item.class}`}
              style={{
                transform: `scale(${getScale(index)})`,
                margin: `0 ${getMargin(index)}`,
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onClick={() => handleClick(item)}
            >
              <div className="dock-item-link-wrap">
                <i className={`fas fa-${item.icon}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      {activeModal === "theme" && (
        <ThemeModal onClose={handleModalClose} onClick={handleClickOutside} />
      )}
      {activeModal === "help" && (
        <HelpModal onClose={handleModalClose} onClick={handleClickOutside} />
      )}
    </>
  );
};

export default Dock;
