
import type { FC } from 'react';
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

const MultipleChoice: FC<MultipleChoiceProps> = ({
  question,
  options,
  correctAnswer,
  onAnswer,
  selectedAnswer,
  isCorrect
}) => {
  return (
    <div className="space-y-6">
      <h3 className="text-xl md:text-2xl font-black leading-tight text-slate-900 dark:text-slate-100">
        {question}
      </h3>
      <div className="grid grid-cols-1 gap-3">
        {options.map((option, index) => {
          const isSelected = selectedAnswer === option;
          const isThisCorrect = option === correctAnswer;
          
          let className = "justify-start h-auto py-5 px-8 text-left text-base font-bold transition-all duration-300 rounded-[1.5rem] border-2 shadow-sm";
          
          if (selectedAnswer) {
            if (isThisCorrect) {
              className += " border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 shadow-emerald-100";
            } else if (isSelected && !isCorrect) {
              className += " border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400 shadow-rose-100";
            } else {
              className += " opacity-40 border-slate-100 dark:border-slate-800 grayscale-[0.5]";
            }
          } else {
            // Using explicit text colors to prevent theme/variant conflicts
            className += " bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-700 dark:hover:text-indigo-300 hover:shadow-md hover:-translate-y-0.5";
          }

          return (
            <Button
              key={index}
              variant="outline"
              className={className}
              onClick={() => !selectedAnswer && onAnswer(option)}
              disabled={!!selectedAnswer}
            >
              <div className="flex items-center justify-between w-full">
                <span className="flex-1">{option}</span>
                {selectedAnswer && isThisCorrect && (
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0 ml-4 animate-in zoom-in duration-300">
                    <CheckCircle2 size={16} />
                  </div>
                )}
                {selectedAnswer && isSelected && !isCorrect && (
                  <div className="w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center text-white shrink-0 ml-4 animate-in zoom-in duration-300">
                    <XCircle size={16} />
                  </div>
                )}
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default MultipleChoice;