// src/components/ui/button.tsx
import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "ghost" | "solid";
  size?: "sm" | "md" | "lg";
  asChild?: boolean;
  children: React.ReactNode;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  variant = "solid",
  size = "md",
  className,
  children,
  ...props
}) => {
  const baseClasses =
    "rounded-md px-4 py-2 font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variantClasses =
    variant === "ghost"
      ? "bg-transparent hover:bg-neutral-200 dark:hover:bg-neutral-800"
      : "bg-neutral-700 text-white hover:bg-neutral-800";
  const sizeClasses =
    size === "sm"
      ? "text-sm"
      : size === "lg"
      ? "text-lg"
      : "text-md";

  return (
    <button
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export { Button };
