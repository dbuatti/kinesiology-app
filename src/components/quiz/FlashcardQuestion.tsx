import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Check, X, RotateCw } from "lucide-react";

interface FlashcardQuestionProps {
  question: string;
  correctAnswer: string;
  explanation: string;
  onAnswer: (isCorrect: boolean) => void;
}

const FlashcardQuestion: React.FC<FlashcardQuestionProps> = ({
  question,
  correctAnswer,
  explanation,
  onAnswer
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="space-y-8">
      <div 
        className={`relative w-full min-h-[300px] transition-all duration-500 [transform-style:preserve-3d] cursor-pointer ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Front */}
        <div className="absolute inset-0 w-full h-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center [backface-visibility:hidden] shadow-xl">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-4">Theory Flashcard</span>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {question}
          </h3>
          <div className="mt-8 flex items-center gap-2 text-muted-foreground text-xs font-bold">
            <RotateCw size={14} className="animate-spin-slow" /> Click to flip
          </div>
        </div>

        {/* Back */}
        <div className="absolute inset-0 w-full h-full bg-primary/5 dark:bg-primary/10 border-2 border-primary/30 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center [backface-visibility:hidden] [transform:rotateY(180deg)] shadow-xl">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-4">The Answer</span>
          <h3 className="text-2xl font-bold text-primary mb-4">
            {correctAnswer}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
            {explanation}
          </p>
        </div>
      </div>

      {isFlipped && (
        <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Button 
            variant="outline" 
            className="flex-1 h-14 rounded-2xl border-2 border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-rose-900/30 dark:hover:bg-rose-900/20"
            onClick={() => onAnswer(false)}
          >
            <X size={20} className="mr-2" /> I didn't know this
          </Button>
          <Button 
            className="flex-1 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
            onClick={() => onAnswer(true)}
          >
            <Check size={20} className="mr-2" /> I knew this!
          </Button>
        </div>
      )}
    </div>
  );
};

export default FlashcardQuestion;
