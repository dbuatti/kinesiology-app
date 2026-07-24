import type { ReactNode } from 'react';

export const PhaseIcon = ({ icon: Icon }: { icon: React.ComponentType<{ size?: number }> }) => (
  <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm shrink-0">
    <Icon size={24} />
  </div>
);

export const PhaseHeader = ({ icon: Icon, title, description }: {
  icon: React.ComponentType<{ size?: number }>;
  title: string;
  description: string;
}) => (
  <div className="flex items-start gap-4">
    <PhaseIcon icon={Icon} />
    <div className="space-y-1">
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      <p className="text-sm text-muted-foreground font-medium max-w-2xl leading-relaxed">
        {description}
      </p>
    </div>
  </div>
);

export const SectionHeading = ({ icon: Icon, title, badge }: {
  icon: React.ComponentType<{ size?: number }>;
  title: string;
  badge?: ReactNode;
}) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <Icon size={16} className="text-muted-foreground" />
      <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{title}</h3>
    </div>
    {badge}
  </div>
);

export const Divider = () => (
  <div className="flex items-center gap-3 pb-3 border-b border-border">
    <div className="w-1 h-4 rounded-full bg-muted-foreground/20" />
  </div>
);
