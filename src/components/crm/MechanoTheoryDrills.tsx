
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  Sparkles,
  HelpCircle,
  ChevronRight, 
  ChevronLeft, 
  RotateCcw,
  CheckCircle2,
  Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MECHANO_FLASHCARDS } from '@/data/mechano-quiz-data';

const MechanoTheoryDrills = () => {
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  const currentCard = MECHANO_FLASHCARDS[cardIndex];

  const handleNext = () => {
    setCardIndex(prev => Math.min(MECHANO_FLASHCARDS.length - 1, prev + 1));
    setIsFlipped(false);
  };

  const handlePrev = () => {
    setCardIndex(prev => Math.max(0, prev - 1));
    setIsFlipped(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-10 animate-in fade-in duration-700">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-semibold text-foreground">Theory Drills</h2>
        <p className="text-muted-foreground font-medium">Test your knowledge of Functional Neurology principles.</p>
      </div>

      <div 
        className="perspective-1000 h-[400px] cursor-pointer group"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className={cn(
          "relative w-full h-full transition-all duration-700 preserve-3d",
          isFlipped ? "rotate-y-180" : ""
        )}>
          {/* Front */}
          <Card className="absolute inset-0 backface-hidden border border-border shadow-sm rounded-2xl bg-card flex flex-col items-center justify-center p-12 text-center border-2 border-border/30">
            <Badge className="absolute top-8 left-8 bg-indigo-50 text-indigo-600 border-none font-semibold text-[10px] uppercase tracking-wider px-3 py-1">
              {currentCard.category}
            </Badge>
            <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mb-8 text-indigo-200 group-hover:text-indigo-400 transition-colors">
              <HelpCircle size={48} />
            </div>
            <h3 className="text-2xl font-semibold text-foreground leading-tight">
              {currentCard.question}
            </h3>
            <div className="mt-10 flex items-center gap-2 text-xs font-medium text-muted-foreground animate-pulse">
              <RotateCcw size={12} /> Click to reveal answer
            </div>
          </Card>

          {/* Back */}
          <Card className="absolute inset-0 backface-hidden rotate-y-180 border-none shadow-2xl rounded-2xl bg-indigo-600 text-primary-foreground flex flex-col items-center justify-center p-12 text-center">
            <div className="w-20 h-20 bg-card/10 rounded-3xl flex items-center justify-center mb-8 text-indigo-200">
              <Sparkles size={48} />
            </div>
            <p className="text-2xl font-bold leading-relaxed">
              {currentCard.answer}
            </p>
            <div className="mt-10 flex items-center gap-2 text-[10px] font-semibold text-indigo-300 uppercase tracking-wider">
              <CheckCircle2 size={12} /> Click to flip back
            </div>
          </Card>
        </div>
      </div>

      <div className="flex items-center justify-between px-6">
        <Button 
          variant="ghost" 
          onClick={handlePrev}
          disabled={cardIndex === 0}
          className="rounded-lg h-9 px-3.5 font-medium text-[13px] text-muted-foreground hover:bg-muted"
        >
          <ChevronLeft size={20} className="mr-2" /> Previous
        </Button>
        
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-medium text-muted-foreground">
            {cardIndex + 1} / {MECHANO_FLASHCARDS.length}
          </span>
          <div className="flex gap-1">
            {MECHANO_FLASHCARDS.map((_, i) => (
              <div key={i} className={cn(
                "w-1.5 h-1.5 rounded-full transition-all",
                i === cardIndex ? "bg-indigo-600 w-4" : "bg-muted"
              )} />
            ))}
          </div>
        </div>

        <Button 
          variant="ghost" 
          onClick={handleNext}
          disabled={cardIndex === MECHANO_FLASHCARDS.length - 1}
          className="rounded-lg h-9 px-3.5 font-medium text-[13px] text-indigo-600 hover:bg-indigo-50"
        >
          Next <ChevronRight size={20} className="ml-2" />
        </Button>
      </div>

      <div className="p-6 bg-amber-50 rounded-2xl border-2 border-amber-100 flex items-start gap-5">
        <div className="w-12 h-12 rounded-2xl bg-card shadow-sm flex items-center justify-center text-amber-500 shrink-0">
          <Lightbulb size={24} />
        </div>
        <div className="space-y-1">
          <h5 className="font-semibold text-amber-900 text-xs uppercase tracking-wider">Study Tip</h5>
          <p className="text-sm text-amber-800 font-medium leading-relaxed">
            "Mastering the theory is the first step to clinical intuition. Try to explain these concepts to a peer to solidify your understanding."
          </p>
        </div>
      </div>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
};

export default MechanoTheoryDrills;