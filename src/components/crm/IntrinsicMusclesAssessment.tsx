
import React, { useMemo } from "react";
import { PRELIMINARY_MUSCLES, MIDLINE_MUSCLES } from "@/data/muscle-data";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CheckCircle2,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { getMuscleInfo } from "@/data/muscle-info-data";

type Status = 'Clear' | 'Inhibited' | 'Hypertonic';
type Side = 'L' | 'R';

interface IntrinsicMusclesAssessmentProps {
  findings?: string | null;
  onSave: (json: string) => Promise<void>;
}

interface MuscleFindings {
  [key: string]: Status;
}

const MuscleTestItem = ({
  name,
  statusL,
  statusR,
  statusMidline,
  isLateralized,
  onUpdate
}: {
  name: string;
  statusL?: Status;
  statusR?: Status;
  statusMidline?: Status;
  isLateralized: boolean;
  onUpdate: (name: string, status: Status | null, side?: Side) => void;
}) => {
  const info = useMemo(() => getMuscleInfo(name), [name]);

  const isInhibited = statusL === 'Inhibited' || statusR === 'Inhibited' || statusMidline === 'Inhibited';
  const isHypertonic = statusL === 'Hypertonic' || statusR === 'Hypertonic' || statusMidline === 'Hypertonic';

  return (
    <div className={cn(
      "p-2 px-3 rounded-xl border transition-all",
      isInhibited ? "bg-rose-50 border-rose-200" :
      isHypertonic ? "bg-amber-50 border-amber-200" :
      "border-slate-100 bg-white"
    )}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 truncate">
              {name}
            </h3>
            <Badge variant="outline" className="border-slate-200 text-slate-400 font-black text-[7px] uppercase tracking-widest px-1.5 py-0 rounded-none">
              {info.meridian}
            </Badge>
          </div>
          <div className="text-[9px] text-slate-500 flex items-center gap-1">
            <Zap size={10} className="text-indigo-400 shrink-0" />
            <span>{info.testingPosition || info.description || 'Standard muscle test'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2 border-r border-slate-100 pr-2">
            <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest">Inhib</span>
            {isLateralized ? (
              <div className="flex items-center gap-1.5">
                <Checkbox
                  id={`prelim-inhib-l-${name}`}
                  checked={statusL === 'Inhibited'}
                  onCheckedChange={(checked) => onUpdate(name, checked ? 'Inhibited' : 'Clear', 'L')}
                  className="h-3.5 w-3.5 border-slate-400 rounded-none"
                />
                <Checkbox
                  id={`prelim-inhib-r-${name}`}
                  checked={statusR === 'Inhibited'}
                  onCheckedChange={(checked) => onUpdate(name, checked ? 'Inhibited' : 'Clear', 'R')}
                  className="h-3.5 w-3.5 border-slate-400 rounded-none"
                />
              </div>
            ) : (
              <Checkbox
                id={`prelim-inhib-mid-${name}`}
                checked={statusMidline === 'Inhibited'}
                onCheckedChange={(checked) => onUpdate(name, checked ? 'Inhibited' : 'Clear')}
                className="h-3.5 w-3.5 border-slate-400 rounded-none"
              />
            )}
          </div>

          <div className="flex items-center gap-2 border-r border-slate-100 pr-2">
            <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest">Hyper</span>
            {isLateralized ? (
              <div className="flex items-center gap-1.5">
                <Checkbox
                  id={`prelim-hyper-l-${name}`}
                  checked={statusL === 'Hypertonic'}
                  onCheckedChange={(checked) => onUpdate(name, checked ? 'Hypertonic' : 'Clear', 'L')}
                  className="h-3.5 w-3.5 border-amber-400 rounded-none data-[state=checked]:bg-amber-500"
                />
                <Checkbox
                  id={`prelim-hyper-r-${name}`}
                  checked={statusR === 'Hypertonic'}
                  onCheckedChange={(checked) => onUpdate(name, checked ? 'Hypertonic' : 'Clear', 'R')}
                  className="h-3.5 w-3.5 border-amber-400 rounded-none data-[state=checked]:bg-amber-500"
                />
              </div>
            ) : (
              <Checkbox
                id={`prelim-hyper-mid-${name}`}
                checked={statusMidline === 'Hypertonic'}
                onCheckedChange={(checked) => onUpdate(name, checked ? 'Hypertonic' : 'Clear')}
                className="h-3.5 w-3.5 border-amber-400 rounded-none data-[state=checked]:bg-amber-500"
              />
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => isLateralized
              ? (onUpdate(name, 'Clear', 'L'), onUpdate(name, 'Clear', 'R'))
              : onUpdate(name, 'Clear')
            }
            className="h-5 px-1.5 text-[7px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 rounded"
          >
            <CheckCircle2 size={10} className="mr-1" /> Clear
          </Button>
        </div>
      </div>
    </div>
  );
};

const IntrinsicMusclesAssessment = ({ findings, onSave }: IntrinsicMusclesAssessmentProps) => {
  const parsed = useMemo(() => {
    try {
      return findings ? JSON.parse(findings) : {} as MuscleFindings;
    } catch {
      return {} as MuscleFindings;
    }
  }, [findings]);

  const getStatus = (name: string, side: Side): Status | undefined => {
    return parsed[`${name} (${side})`] as Status | undefined;
  };

  const getMidlineStatus = (name: string): Status | undefined => {
    return parsed[name] as Status | undefined;
  };

  const handleUpdate = async (name: string, status: Status | null, side?: Side) => {
    const key = side ? `${name} (${side})` : name;
    const next = { ...parsed };

    if (status === null || status === 'Clear') {
      delete next[key];
    } else {
      next[key] = status;
    }

    await onSave(JSON.stringify(next));
  };

  const countFindings = useMemo(() => {
    return Object.values(parsed).filter(v => v === 'Inhibited' || v === 'Hypertonic').length;
  }, [parsed]);

  return (
    <div className="space-y-8">
      {Object.entries(PRELIMINARY_MUSCLES).map(([group, muscles]) => (
        <div key={group} className="space-y-2">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2 mb-3">{group}</h3>
          <div className="grid grid-cols-1 gap-1.5">
            {muscles.map(muscle => (
              <MuscleTestItem
                key={muscle}
                name={muscle}
                statusL={getStatus(muscle, 'L')}
                statusR={getStatus(muscle, 'R')}
                statusMidline={getMidlineStatus(muscle)}
                isLateralized={!MIDLINE_MUSCLES.includes(muscle)}
                onUpdate={handleUpdate}
              />
            ))}
          </div>
        </div>
      ))}

      {countFindings > 0 && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => { await onSave(JSON.stringify({})); }}
            className="h-7 text-[10px] font-medium text-destructive hover:bg-destructive/10 rounded-lg"
          >
            Clear All Findings
          </Button>
        </div>
      )}
    </div>
  );
};

export default IntrinsicMusclesAssessment;
