import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
  icon: LucideIcon;
  gradient: string;
  label: string;
  children?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ icon: Icon, gradient, label, children }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <div className={`h-8 w-8 rounded-lg ${gradient} flex items-center justify-center`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <h3 className="font-medium text-lg">{label}</h3>
      </div>
      {children}
    </div>
  );
};