import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

export interface ThemeOption {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  className?: string;
  gradient?: string;
}

export interface PreviewCardProps {
  item: ThemeOption;
  index: number;
}

export interface OptionButtonProps {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}