import React from 'react';
import { Button } from '@/components/ui/button';
import { Dumbbell, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SessionHeaderActionsProps {
  appointmentId: string;
}

const SessionHeaderActions = ({ appointmentId }: SessionHeaderActionsProps) => {
  return (
    <div className="flex items-center gap-3">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button asChild variant="outline" className="h-10 px-4 rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-700">
            <Link to={`/kinesiology/${appointmentId}`}>
              <Heart size={18} className="mr-2 text-red-500" />
              Kinesiology Tools
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          Emotional & Energetic Assessments
        </TooltipContent>
      </Tooltip>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button asChild variant="outline" size="icon" className="h-10 w-10 rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-700">
            <Link to={`/muscle-tests/${appointmentId}`}>
              <Dumbbell size={18} className="text-indigo-500" />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          Muscle Testing Log
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export default SessionHeaderActions;