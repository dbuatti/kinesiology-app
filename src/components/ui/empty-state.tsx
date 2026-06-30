import React from 'react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  title: string;
  description: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, onAction }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="space-y-3">
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
        {onAction && (
          <Button onClick={onAction} variant="outline">
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
};