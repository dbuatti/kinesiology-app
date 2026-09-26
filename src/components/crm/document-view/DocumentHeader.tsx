
import { format } from 'date-fns';

interface DocumentHeaderProps {
  clientName: string;
  date: Date;
  displayId?: string;
  id: string;
}

const DocumentHeader = ({ clientName, date, displayId, id }: DocumentHeaderProps) => {
  return (
    <div className="flex justify-between items-end border-b-4 border-foreground/20 pb-10">
      <div className="space-y-1">
        <h1 className="text-5xl font-semibold tracking-tighter uppercase leading-none">Session Notes</h1>
      </div>
      <div className="text-right space-y-1">
        <p className="text-xl font-semibold">{clientName}</p>
        <p className="text-xs font-medium text-muted-foreground">{format(date, "EEEE, MMMM d, yyyy")}</p>
        <p className="text-xs font-mono text-muted-foreground">{displayId || id}</p>
      </div>
    </div>
  );
};

export default DocumentHeader;