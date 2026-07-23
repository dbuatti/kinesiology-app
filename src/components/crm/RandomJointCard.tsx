
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Move, Zap, RefreshCw, 
  Lightbulb, 
  ChevronRight, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { JOINT_ACTION_LIBRARY, JointData } from '@/data/joint-action-data';

const STORAGE_KEY = "rk_joint_of_the_day";

const RandomJointCard = () => {
  const [joint, setJoint] = useState<JointData>(JOINT_ACTION_LIBRARY[0]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const stored = localStorage.getItem(STORAGE_KEY);
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.date === today) {
          const foundJoint = JOINT_ACTION_LIBRARY.find(j => j.name === parsed.jointName);
          if (foundJoint) {
            setJoint(foundJoint);
            return;
          }
        }
      } catch (e) {
        console.error("Failed to parse stored joint", e);
      }
    }

    pickNewJoint(today);
  }, []);

  const pickNewJoint = (dateStr: string) => {
    const newJoint = JOINT_ACTION_LIBRARY[Math.floor(Math.random() * JOINT_ACTION_LIBRARY.length)];
    setJoint(newJoint);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      date: dateStr,
      jointName: newJoint.name
    }));
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const others = JOINT_ACTION_LIBRARY.filter(j => j.name !== joint.name);
      const next = others[Math.floor(Math.random() * others.length)];
      setJoint(next);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        date: today,
        jointName: next.name
      }));
      setIsRefreshing(false);
    }, 600);
  };

  return (
    <Card className="border border-slate-200 shadow-sm rounded-2xl bg-white overflow-hidden group">
      <CardHeader className="bg-slate-50 border-b border-slate-200 p-5 text-slate-900 relative overflow-hidden">
        <div className="flex items-center justify-between relative z-10">
          <div className="space-y-1">
            <div className="flex gap-1.5 mb-1">
              <Badge className="bg-slate-200 text-slate-800 border-none font-bold text-[7px] uppercase tracking-wider">
                {joint.type}
              </Badge>
              <Badge className="bg-slate-200 text-slate-800 border-none font-bold text-[7px] uppercase tracking-wider">
                {joint.region}
              </Badge>
            </div>
            <CardTitle className="text-base font-bold tracking-tight">{joint.name}</CardTitle>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleManualRefresh}
            className={cn(
              "h-8 w-8 rounded-lg text-slate-500 hover:bg-slate-200 transition-all",
              isRefreshing && "animate-spin"
            )}
          >
            <RefreshCw size={16} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        <div className="grid grid-cols-1 gap-2">
          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-1.5">
              <Zap size={12} className="text-slate-600" />
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Sagittal</span>
            </div>
            <span className="text-xs font-bold text-slate-700">
              {joint.actions.Sagittal.map(a => a.label).join(', ')}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-1.5">
              <Move size={12} className="text-slate-600" />
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Frontal</span>
            </div>
            <span className="text-xs font-bold text-slate-700">
              {joint.actions.Frontal.map(a => a.label).join(', ')}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-1.5">
              <RefreshCw size={12} className="text-slate-600" />
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Transverse</span>
            </div>
            <span className="text-xs font-bold text-slate-700">
              {joint.actions.Transverse.map(a => a.label).join(', ')}
            </span>
          </div>
        </div>

        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 relative overflow-hidden">
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Lightbulb size={10} className="text-slate-600" /> Clinical Pearl
          </p>
          <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
            "{joint.pearl}"
          </p>
        </div>

        <Button 
          variant="ghost" 
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="w-full h-9 rounded-xl text-[9px] font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-100"
        >
          {isRefreshing ? <Loader2 className="animate-spin mr-1.5" size={12} /> : <ChevronRight className="mr-1.5" size={12} />}
          Next Joint
        </Button>
      </CardContent>
    </Card>
  );
};

export default RandomJointCard;