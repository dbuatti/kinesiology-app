
import { format } from 'date-fns';

interface DocumentHeaderProps {
  clientName: string;
  date: Date;
  displayId?: string;
  id: string;
}

const DocumentHeader = ({ clientName, date, displayId, id }: DocumentHeaderProps) => {
  return (
    <div className="flex justify-between items-end border-b-4 border-black pb-10">
      <div className="space-y-1">
        <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">Session Notes</h1>
      </div>
      <div className="text-right space-y-1">
        <p className="text-xl font-black">{clientName}</p>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{format(date, "EEEE, MMMM d, yyyy")}</p>
        <p className="text-[9px] font-mono text-slate-300 uppercase">{displayId || id}</p>
      </div>
    </div>
  );
};

export default DocumentHeader;