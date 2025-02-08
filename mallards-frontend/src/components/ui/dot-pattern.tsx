import React from "react";
import { cn } from "../../lib/utils";

interface DotPatternProps {
  className?: string;
  size?: number;
  spacing?: number;
  dotColor?: string;
}

export const DotPattern: React.FC<DotPatternProps> = ({
  className,
  size = 1,
  spacing = 16,
  dotColor = "rgb(0,0,0,0.2)",
}) => {
  return (
    <div
      className={cn("absolute inset-0", className)}
      style={{
        backgroundImage: `radial-gradient(${dotColor} ${size}px, transparent 0)`,
        backgroundSize: `${spacing}px ${spacing}px`,
        backgroundPosition: "0 0",
        width: "100%",
        height: "100%"
      }}
    />
  );
};
