
import { Shield, Link as LinkIcon, Brain, Activity, Move, RefreshCw, Target, Zap } from 'lucide-react';

interface AnatomyModelProps {
  selectedAnatomyJoint: 'knee' | 'ankle' | 'shoulder' | 'hip';
  selectedStructure: string | null;
  onSelectStructure: (structure: string) => void;
}

const AnatomyModel = ({ selectedAnatomyJoint, selectedStructure, onSelectStructure }: AnatomyModelProps) => {
  return (
    <div className="w-full h-full flex items-center justify-center">
      {selectedAnatomyJoint === 'knee' && (
        <svg viewBox="0 0 200 240" className="w-full max-w-[280px] h-auto">
          {/* Femur (Thigh Bone) */}
          <path d="M70,10 L130,10 L130,80 C130,100 140,110 125,120 C110,130 90,130 75,120 C60,110 70,100 70,80 Z" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="2" />
          {/* Tibia (Shin Bone) */}
          <path d="M75,150 C90,140 110,140 125,150 L125,230 L75,230 Z" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="2" />
          {/* Fibula */}
          <rect x="60" y="160" width="12" height="70" rx="4" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.5" />

          {/* Quadriceps Tendon */}
          <path 
            d="M90,40 L110,40 L110,90 L90,90 Z" 
            fill={selectedStructure === 'quadriceps' ? 'hsl(var(--chart-primary))' : '#CBD5E1'} 
            stroke={selectedStructure === 'quadriceps' ? 'hsl(var(--chart-primary))' : '#94A3B8'} 
            strokeWidth="2" 
            className="cursor-pointer transition-all hover:opacity-90 hover:fill-indigo-500"
            onClick={() => onSelectStructure('quadriceps')}
          />
          {/* Patella (Kneecap) */}
          <circle 
            cx="100" 
            cy="105" 
            r="18" 
            fill="#F8FAFC" 
            stroke="#64748B" 
            strokeWidth="2" 
          />
          {/* Patellar Tendon */}
          <path 
            d="M92,120 L108,120 L105,155 L95,155 Z" 
            fill={selectedStructure === 'patellar' ? 'hsl(var(--chart-primary))' : '#CBD5E1'} 
            stroke={selectedStructure === 'patellar' ? 'hsl(var(--chart-primary))' : '#94A3B8'} 
            strokeWidth="2" 
            className="cursor-pointer transition-all hover:opacity-90 hover:fill-indigo-500"
            onClick={() => onSelectStructure('patellar')}
          />

          {/* Medial Collateral Ligament (MCL) */}
          <path 
            d="M125,95 C128,110 128,130 125,145" 
            fill="none" 
            stroke={selectedStructure === 'mcl' ? 'hsl(var(--chart-primary))' : '#94A3B8'} 
            strokeWidth="8" 
            strokeLinecap="round"
            className="cursor-pointer transition-all hover:opacity-90 hover:stroke-indigo-500"
            onClick={() => onSelectStructure('mcl')}
          />

          {/* Lateral Collateral Ligament (LCL) */}
          <path 
            d="M70,95 C67,110 62,130 65,145" 
            fill="none" 
            stroke={selectedStructure === 'lcl' ? 'hsl(var(--chart-primary))' : '#94A3B8'} 
            strokeWidth="6" 
            strokeLinecap="round"
            className="cursor-pointer transition-all hover:opacity-90 hover:stroke-indigo-500"
            onClick={() => onSelectStructure('lcl')}
          />

          {/* Labels */}
          <text x="100" y="30" textAnchor="middle" className="text-[8px] font-bold fill-slate-400 uppercase tracking-wider">Femur</text>
          <text x="100" y="210" textAnchor="middle" className="text-[8px] font-bold fill-slate-400 uppercase tracking-wider">Tibia</text>
        </svg>
      )}

      {selectedAnatomyJoint === 'ankle' && (
        <svg viewBox="0 0 200 240" className="w-full max-w-[280px] h-auto">
          {/* Tibia & Fibula */}
          <rect x="75" y="10" width="35" height="110" rx="4" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="2" />
          <rect x="55" y="20" width="15" height="100" rx="4" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.5" />

          {/* Talus & Calcaneus (Heel) */}
          <path d="M65,130 C65,120 120,120 130,130 C140,140 150,160 140,180 C130,190 60,190 55,170 Z" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="2" />
          <path d="M55,170 C55,190 70,210 100,210 C130,210 140,190 140,180 Z" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.5" />

          {/* Achilles Tendon */}
          <path 
            d="M110,40 L120,40 L115,150 L105,150 Z" 
            fill={selectedStructure === 'achilles' ? 'hsl(var(--chart-primary))' : '#CBD5E1'} 
            stroke={selectedStructure === 'achilles' ? 'hsl(var(--chart-primary))' : '#94A3B8'} 
            strokeWidth="2" 
            className="cursor-pointer transition-all hover:opacity-90 hover:fill-indigo-500"
            onClick={() => onSelectStructure('achilles')}
          />

          {/* Anterior Talofibular Ligament (ATFL) */}
          <path 
            d="M65,115 L90,135" 
            fill="none" 
            stroke={selectedStructure === 'atfl' ? 'hsl(var(--chart-primary))' : '#94A3B8'} 
            strokeWidth="6" 
            strokeLinecap="round"
            className="cursor-pointer transition-all hover:opacity-90 hover:stroke-indigo-500"
            onClick={() => onSelectStructure('atfl')}
          />

          {/* Calcaneofibular Ligament (CFL) */}
          <path 
            d="M60,125 L75,165" 
            fill="none" 
            stroke={selectedStructure === 'cfl' ? 'hsl(var(--chart-primary))' : '#94A3B8'} 
            strokeWidth="6" 
            strokeLinecap="round"
            className="cursor-pointer transition-all hover:opacity-90 hover:stroke-indigo-500"
            onClick={() => onSelectStructure('cfl')}
          />

          {/* Labels */}
          <text x="92" y="30" textAnchor="middle" className="text-[8px] font-bold fill-slate-400 uppercase tracking-wider">Tibia</text>
          <text x="100" y="200" textAnchor="middle" className="text-[8px] font-bold fill-slate-400 uppercase tracking-wider">Calcaneus</text>
        </svg>
      )}

      {selectedAnatomyJoint === 'shoulder' && (
        <svg viewBox="0 0 200 240" className="w-full max-w-[280px] h-auto">
          {/* Clavicle (Collarbone) */}
          <path d="M40,40 C80,35 120,45 150,40" fill="none" stroke="#F1F5F9" strokeWidth="10" strokeLinecap="round" />
          {/* Scapula (Shoulder Blade) */}
          <path d="M40,60 L80,60 L60,120 Z" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="2" />
          {/* Humerus (Arm Bone) */}
          <path d="M110,90 L110,220" fill="none" stroke="#F1F5F9" strokeWidth="18" strokeLinecap="round" />
          {/* Humeral Head */}
          <circle cx="110" cy="80" r="16" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="2" />

          {/* Supraspinatus Tendon */}
          <path 
            d="M75,55 C90,55 100,65 110,72" 
            fill="none" 
            stroke={selectedStructure === 'supraspinatus' ? 'hsl(var(--chart-primary))' : '#CBD5E1'} 
            strokeWidth="6" 
            strokeLinecap="round"
            className="cursor-pointer transition-all hover:opacity-90 hover:stroke-indigo-500"
            onClick={() => onSelectStructure('supraspinatus')}
          />

          {/* Glenohumeral Ligament (GHL) */}
          <path 
            d="M98,80 C98,90 105,95 110,100" 
            fill="none" 
            stroke={selectedStructure === 'ghl' ? 'hsl(var(--chart-primary))' : '#94A3B8'} 
            strokeWidth="6" 
            strokeLinecap="round"
            className="cursor-pointer transition-all hover:opacity-90 hover:stroke-indigo-500"
            onClick={() => onSelectStructure('ghl')}
          />

          {/* Biceps Tendon (Long Head) */}
          <path 
            d="M110,72 L110,150" 
            fill="none" 
            stroke={selectedStructure === 'biceps' ? 'hsl(var(--chart-primary))' : '#CBD5E1'} 
            strokeWidth="4" 
            strokeLinecap="round"
            className="cursor-pointer transition-all hover:opacity-90 hover:stroke-indigo-500"
            onClick={() => onSelectStructure('biceps')}
          />

          {/* Acromioclavicular (AC) Ligament */}
          <path 
            d="M125,40 L135,55" 
            fill="none" 
            stroke={selectedStructure === 'ac' ? 'hsl(var(--chart-primary))' : '#94A3B8'} 
            strokeWidth="6" 
            strokeLinecap="round"
            className="cursor-pointer transition-all hover:opacity-90 hover:stroke-indigo-500"
            onClick={() => onSelectStructure('ac')}
          />

          {/* Labels */}
          <text x="150" y="30" textAnchor="middle" className="text-[8px] font-bold fill-slate-400 uppercase tracking-wider">Clavicle</text>
          <text x="110" y="235" textAnchor="middle" className="text-[8px] font-bold fill-slate-400 uppercase tracking-wider">Humerus</text>
        </svg>
      )}

      {selectedAnatomyJoint === 'hip' && (
        <svg viewBox="0 0 200 240" className="w-full max-w-[280px] h-auto">
          {/* Pelvis (Hip Bone) */}
          <path d="M50,40 C50,20 150,20 150,40 C150,60 130,80 130,100 C130,120 110,130 100,130 C90,130 70,120 70,100 C70,80 50,60 50,40 Z" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="2" />
          {/* Femur (Thigh Bone) */}
          <path d="M100,140 L100,230" fill="none" stroke="#F1F5F9" strokeWidth="18" strokeLinecap="round" />
          {/* Greater Trochanter */}
          <path d="M85,140 L75,150 L80,170 L100,160 Z" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.5" />

          {/* Iliofemoral Ligament (Y-Ligament) */}
          <path 
            d="M100,115 L85,150 M100,115 L115,150" 
            fill="none" 
            stroke={selectedStructure === 'iliofemoral' ? 'hsl(var(--chart-primary))' : '#94A3B8'} 
            strokeWidth="6" 
            strokeLinecap="round"
            className="cursor-pointer transition-all hover:opacity-90 hover:stroke-indigo-500"
            onClick={() => onSelectStructure('iliofemoral')}
          />

          {/* Gluteus Medius Tendon */}
          <path 
            d="M70,100 C70,120 75,135 78,145" 
            fill="none" 
            stroke={selectedStructure === 'gluteus_med' ? 'hsl(var(--chart-primary))' : '#CBD5E1'} 
            strokeWidth="6" 
            strokeLinecap="round"
            className="cursor-pointer transition-all hover:opacity-90 hover:stroke-indigo-500"
            onClick={() => onSelectStructure('gluteus_med')}
          />

          {/* Hamstring Tendon */}
          <path 
            d="M115,120 L105,180" 
            fill="none" 
            stroke={selectedStructure === 'hamstring' ? 'hsl(var(--chart-primary))' : '#CBD5E1'} 
            strokeWidth="5" 
            strokeLinecap="round"
            className="cursor-pointer transition-all hover:opacity-90 hover:stroke-indigo-500"
            onClick={() => onSelectStructure('hamstring')}
          />

          {/* Labels */}
          <text x="100" y="30" textAnchor="middle" className="text-[8px] font-bold fill-slate-400 uppercase tracking-wider">Pelvis</text>
          <text x="100" y="235" textAnchor="middle" className="text-[8px] font-bold fill-slate-400 uppercase tracking-wider">Femur</text>
        </svg>
      )}
    </div>
  );
};

export default AnatomyModel;