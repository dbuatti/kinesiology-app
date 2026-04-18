import React from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle } from "lucide-react";

interface MultipleChoiceProps {
  question: string;
  options: string[];
  correctAnswer: string;
  onAnswer: (answer: string) => void;
  selectedAnswer?: string;
  isCorrect?: boolean;
}

const MultipleChoice: React.FC<MultipleChoiceProps> = ({
  question,
  options,
  correctAnswer,
  onAnswer,
  selectedAnswer,
  isCorrect
}) => {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold leading-tight text-slate-900 dark:text-slate-100">
        {question}
      </h3>
      <div className="grid grid-cols-1 gap-3">
        {options.map((option, index) => {
          const isSelected = selectedAnswer === option;
          const isThisCorrect = option === correctAnswer;
          
          let variant: "outline" | "default" | "secondary" = "outline";
          let className = "justify-start h-auto py-4 px-6 text-left text-sm font-medium transition-all duration-300 rounded-2xl border-2";
          
          if (selectedAnswer) {
            if (isThisCorrect) {
              className += " border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400";
            } else if (isSelected && !isCorrect) {
              className += " border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400";
            } else {
              className += " opacity-50 border-slate-200 dark:border-slate-800";
            }
          } else {
            className += " hover:border-primary hover:bg-primary/5 border-slate-200 dark:border-slate-800";
          }

          return (
            <Button
              key={index}
              variant={variant}
              className={className}
              onClick={() => !selectedAnswer && onAnswer(option)}
              disabled={!!selectedAnswer}
            >
              <div className="flex items-center justify-between w-full">
                <span>{option}</span>
                {selectedAnswer && isThisCorrect && <CheckCircle2 size={18} className="text-emerald-500 shrink-0 ml-2" />}
                {selectedAnswer && isSelected && !isCorrect && <XCircle size={18} className="text-rose-500 shrink-0 ml-2" />}
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default MultipleChoice;
