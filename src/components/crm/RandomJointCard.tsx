"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Move, Zap, RefreshCw, 
  Dumbbell, Lightbulb, 
  ChevronRight, Loader2,
  MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const JOINTS = [
  { 
    name: "Cranium", 
    type: "Axial", 
    region: "Upper",
    sagittal: "Flexion, Extension",
    frontal: "Lateral Flexion",
    transverse: "Rotation",
    pearl: "Organizes the 'Top-Down' neurological tone. Essential for cranial nerve health."
  },
  { 
    name: "Jaw (TMJ)", 
    type: "Axial", 
    region: "Upper",
    sagittal: "Protrusion, Retraction",
    frontal: "Lateral Deviation",
    transverse: "-",
    pearl: "Deeply connected to the Pelvis and the Vagus nerve (Medulla)."
  },
  { 
    name: "Cervical Spine", 
    type: "Axial", 
    region: "Upper",
    sagittal: "Flexion, Extension",
    frontal: "Lateral Flexion (L/R)",
    transverse: "Rotation (L/R)",
    pearl: "Organizes the head around the horizon. Key for righting reflexes."
  },
  { 
    name: "Thoracic Spine", 
    type: "Axial", 
    region: "Upper",
    sagittal: "Flexion, Extension",
    frontal: "Lateral Flexion (L/R)",
    transverse: "Rotation (L/R)",
    pearl: "Primary site for rotation. Essential for ribcage mobility and breathing."
  },
  { 
    name: "Lumbar Spine", 
    type: "Axial", 
    region: "Lower",
    sagittal: "Flexion, Extension",
    frontal: "Lateral Flexion (L/R)",
    transverse: "Rotation (Minimal)",
    pearl: "Designed for stability. Often compensates for poor hip or thoracic mobility."
  },
  { 
    name: "Pelvis", 
    type: "Axial", 
    region: "Lower",
    sagittal: "Anterior Tilt, Posterior Tilt",
    frontal: "Hip Hike (L/R), Pelvic Drop",
    transverse: "Rotation (L/R)",
    pearl: "The 'Engine Room' of gait. Connects the upper and lower kinetic chains."
  },
  { 
    name: "Sacrum", 
    type: "Axial", 
    region: "Lower",
    sagittal: "Nutation, Counter-Nutation",
    frontal: "-",
    transverse: "-",
    pearl: "The keystone of the pelvis. Movement is subtle but neurologically vital."
  },
  { 
    name: "Shoulder (GH Joint)", 
    type: "Appendicular", 
    region: "Upper",
    sagittal: "Flexion, Extension",
    frontal: "Abduction, Adduction",
    transverse: "Internal Rotation, External Rotation",
    pearl: "Most mobile joint. Slaved to the Scapula and Thoracic spine."
  },
  { 
    name: "Scapula", 
    type: "Appendicular", 
    region: "Upper",
    sagittal: "Elevation, Depression",
    frontal: "Upward/Downward Rotation",
    transverse: "Protraction, Retraction",
    pearl: "The foundation of shoulder function. Must glide freely over the ribs."
  },
  { 
    name: "Elbow", 
    type: "Appendicular", 
    region: "Upper",
    sagittal: "Flexion, Extension",
    frontal: "-",
    transverse: "Pronation, Supination",
    pearl: "A hinge joint that allows for complex hand orientation."
  },
  { 
    name: "Wrist", 
    type: "Appendicular", 
    region: "Upper",
    sagittal: "Flexion, Extension",
    frontal: "Radial/Ulnar Deviation",
    transverse: "-",
    pearl: "Essential for fine motor control and upper limb integration."
  },
  { 
    name: "Hand/Fingers", 
    type: "Appendicular", 
    region: "Upper",
    sagittal: "Flexion, Extension",
    frontal: "Adduction, Abduction",
    transverse: "-",
    pearl: "High density of mechanoreceptors. Direct link to the motor cortex."
  },
  { 
    name: "Hip", 
    type: "Appendicular", 
    region: "Lower",
    sagittal: "Flexion, Extension",
    frontal: "Abduction, Adduction",
    transverse: "Internal Rotation, External Rotation",
    pearl: "Deep ball-and-socket joint. Essential for power and locomotion."
  },
  { 
    name: "Knee", 
    type: "Appendicular", 
    region: "Lower",
    sagittal: "Flexion, Extension",
    frontal: "-",
    transverse: "Tibial Internal/External Rotation",
    pearl: "Stability is key. Often compensates for hip or ankle dysfunction."
  },
  { 
    name: "Foot/Ankle", 
    type: "Appendicular", 
    region: "Lower",
    sagittal: "Dorsiflexion, Plantar Flexion",
    frontal: "Inversion, Eversion",
    transverse: "Internal Rotation, External Rotation",
    pearl: "Primary source of proprioceptive input for the cerebellum."
  }
];

const STORAGE_KEY = "antigravity_joint_of_the_day";

const RandomJointCard = () => {
  const [joint, setJoint] = useState(JOINTS[0]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const stored = localStorage.getItem(STORAGE_KEY);
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.date === today) {
          const foundJoint = JOINTS.find(j => j.name === parsed.jointName);
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
    const newJoint = JOINTS[Math.floor(Math.random() * JOINTS.length)];
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
      const others = JOINTS.filter(j => j.name !== joint.name);
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
    <Card className="border-none shadow-lg rounded-[2rem] bg-card overflow-hidden group">
      <CardHeader className="bg-indigo-600 p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
          <Dumbbell size={60} />
        </div>
        <div className="flex items-center justify-between relative z-10">
          <div className="space-y-1">
            <div className="flex gap-1.5 mb-1">
              <Badge className="bg-white/20 text-white border-none font-black text-[7px] uppercase tracking-widest">
                {joint.type}
              </Badge>
              <Badge className="bg-white/20 text-white border-none font-black text-[7px] uppercase tracking-widest">
                {joint.region}
              </Badge>
            </div>
            <CardTitle className="text-xl font-black tracking-tight">{joint.name}</CardTitle>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleManualRefresh}
            className={cn(
              "h-10 w-10 rounded-xl text-white hover:bg-white/20 transition-all",
              isRefreshing && "animate-spin"
            )}
          >
            <RefreshCw size={20} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-blue-500" />
              <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Sagittal</span>
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{joint.sagittal}</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
            <div className="flex items-center gap-2">
              <Move size={14} className="text-emerald-500" />
              <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Frontal</span>
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{joint.frontal}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-900/30">
            <div className="flex items-center gap-2">
              <RefreshCw size={14} className="text-orange-500" />
              <span className="text-[9px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest">Transverse</span>
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{joint.transverse}</span>
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-5"><Lightbulb size={30} /></div>
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
            <Lightbulb size={10} className="text-amber-500" /> Clinical Pearl
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed italic">
            "{joint.pearl}"
          </p>
        </div>

        <Button 
          variant="ghost" 
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="w-full h-10 rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
        >
          {isRefreshing ? <Loader2 className="animate-spin mr-2" size={14} /> : <ChevronRight className="mr-2" size={14} />}
          Next Joint
        </Button>
      </CardContent>
    </Card>
  );
};

export default RandomJointCard;