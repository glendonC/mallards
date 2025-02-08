import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from "react";
import colorPresets from '../components/modals/theme/colors/colorConfigs';

interface ThemePreset {
    backgroundColor: string;
    textColor: string;
    tileColor: string;
    borderColor: string;
    dockHighlightColors: string[];
    background?: {
        type: 'gradient-analytics' | 'enterprise-mesh' | 'clean-interface' | 'flickering-grid' | 'dot-pattern';
        config: any;
    };
    [key: string]: string | string[] | { type: string; config: any } | undefined;
}
  
interface LayoutArea {
    id: string;
    gridColumn: string;
    gridRow: string;
}

interface Layout {
    gridTemplateColumns: string;
    gridTemplateRows: string;
    areas: LayoutArea[];
}

interface ThemeContextType {
    currentTheme: string;
    customColors: ThemePreset;
    currentLayout: string;
    fontFamily: string;
    layouts: Record<string, Layout>;
    applyThemePreset: (preset: string) => void;
    setCustomColors: React.Dispatch<React.SetStateAction<ThemePreset>>;
    applyLayout: (layoutName: string) => void;
    setFontFamily: React.Dispatch<React.SetStateAction<string>>;
    handleColorChange: (colorType: keyof ThemePreset, value: string) => void;
    updateBackground: (type: string, config: any) => void;
    backgroundConfig: {
        type: string;
        config: any;
    };
}
  
const themePresets: Record<string, ThemePreset> = {
    'hub-classic': {
      ...colorPresets['hub-classic'].colors,
      dockHighlightColors: ["#006B3F", "#4caf50", "#ffeb3b", "#03a9f4", "#e91e63"],
    },
    'hub-dark': {
      ...colorPresets['hub-dark'].colors,
      dockHighlightColors: ["#00834E", "#4caf50", "#ffeb3b", "#03a9f4", "#e91e63"],
    },
    'midnight-professional': {
      ...colorPresets['midnight-professional'].colors,
      dockHighlightColors: ["#006B3F", "#4caf50", "#ffeb3b", "#03a9f4", "#e91e63"],
    },
    'high-contrast': {
      ...colorPresets['high-contrast'].colors,
      dockHighlightColors: ["#006B3F", "#4caf50", "#ffeb3b", "#03a9f4", "#e91e63"],
    },
    'soft-neutrals': {
      ...colorPresets['soft-neutrals'].colors,
      dockHighlightColors: ["#3F856B", "#4caf50", "#ffeb3b", "#03a9f4", "#e91e63"],
    },
};
  
const layouts: Record<string, Layout> = {
    "grid-default": {
      gridTemplateColumns: "repeat(3, 1fr)",
      gridTemplateRows: "repeat(2, 1fr)",
      areas: [
        { id: "total-transactions", gridColumn: "1", gridRow: "1" },
        { id: "total-anomalies", gridColumn: "2", gridRow: "1" },
        { id: "anomaly-percentage", gridColumn: "3", gridRow: "1" },
        { id: "high-severity", gridColumn: "1", gridRow: "2" },
        { id: "severity-distribution", gridColumn: "2", gridRow: "2" },
        { id: "anomalies-over-time", gridColumn: "3", gridRow: "2" },
      ],
    },
    "grid-focused": {
      gridTemplateColumns: "repeat(2, 1fr)",
      gridTemplateRows: "repeat(3, 1fr)",
      areas: [
        { id: "total-transactions", gridColumn: "1 / span 2", gridRow: "1" },
        { id: "total-anomalies", gridColumn: "1", gridRow: "2" },
        { id: "anomaly-percentage", gridColumn: "2", gridRow: "2" },
        { id: "high-severity", gridColumn: "1", gridRow: "3" },
        { id: "severity-distribution", gridColumn: "2", gridRow: "3" },
        { id: "anomalies-over-time", gridColumn: "1 / span 2", gridRow: "4" },
      ],
    },
    "grid-stacked": {
      gridTemplateColumns: "1fr",
      gridTemplateRows: "repeat(6, 1fr)",
      areas: [
        { id: "total-transactions", gridColumn: "1", gridRow: "1" },
        { id: "total-anomalies", gridColumn: "1", gridRow: "2" },
        { id: "anomaly-percentage", gridColumn: "1", gridRow: "3" },
        { id: "high-severity", gridColumn: "1", gridRow: "4" },
        { id: "severity-distribution", gridColumn: "1", gridRow: "5" },
        { id: "anomalies-over-time", gridColumn: "1", gridRow: "6" },
      ],
    },
};
  
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
  
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [currentTheme, setCurrentTheme] = useState<string>('hub-classic');
    const [customColors, setCustomColors] = useState<ThemePreset>(themePresets['hub-classic']);
    const [currentLayout, setCurrentLayout] = useState<string>('grid-default');
    const [fontFamily, setFontFamily] = useState<string>('DM Sans');
    const [backgroundConfig, setBackgroundConfig] = useState({
        type: 'clean-interface',
        config: {}
    });

    useEffect(() => {
        const root = document.documentElement;

        Object.entries(customColors).forEach(([key, value]) => {
        if (typeof value === "string") {
            root.style.setProperty(`--${key}`, value);
        }
        });

        root.style.setProperty("--font-body", fontFamily);
    }, [customColors, fontFamily]);


    const handleColorChange = (colorType: keyof ThemePreset, value: string) => {
        setCustomColors((prevColors) => ({
        ...prevColors,
        [colorType]: value,
        }));
    };  

    const applyThemePreset = (preset: string) => {
        if (themePresets[preset]) {
        setCurrentTheme(preset);
        setCustomColors(themePresets[preset]);
        } else {
        console.warn(`Theme preset "${preset}" does not exist.`);
        }
    };
    
    const applyLayout = (layoutName: string) => {
        if (layouts[layoutName]) {
        setCurrentLayout(layoutName);
        } else {
        console.warn(`Layout "${layoutName}" does not exist.`);
        setCurrentLayout("grid-default");
        }
    };
    
    const updateBackground = (type: string, config: any) => {
        setBackgroundConfig({ type, config });
    };

    const value: ThemeContextType = {
            currentTheme,
            customColors,
            currentLayout,
            fontFamily,
            layouts,
            applyThemePreset,
            setCustomColors,
            applyLayout,
            setFontFamily,
            handleColorChange,
            updateBackground,
            backgroundConfig,
        };

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
  
export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
};
  