
import { useState } from 'react'; import type { FC } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, ArrowRight, Sparkles } from "lucide-react";

interface FillInTheBlankProps {
  question: string;
  correctAnswer: string;
  onAnswer: (answer: string) => void;
  selectedAnswer?: string;
  isCorrect?: boolean;
}

const FillInTheBlank: FC<FillInTheBlankProps> = ({
  question,
  correctAnswer,
  onAnswer,
  selectedAnswer,
  isCorrect
}) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onAnswer(input.trim());
    }
  };

  return (
    <div className="space-y-8">
      <h3 className="text-xl md:text-2xl font-black leading-tight text-foreground dark:text-primary-foreground">
        {question}
      </h3>
      
      {!selectedAnswer ? (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" size={18} />
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your answer here..."
              className="h-14 pl-12 rounded-2xl border-2 border-border/50 focus:border-indigo-500 focus:ring-indigo-500 text-lg font-medium shadow-inner bg-muted/50"
              autoFocus
            />
          </div>
          <Button type="submit" className="h-14 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-primary-foreground font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100">
            Submit <ArrowRight size={18} className="ml-2" />
          </Button>
        </form>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className={`p-6 rounded-[2rem] border-2 flex items-center justify-between shadow-sm ${
            isCorrect 
              ? "bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" 
              : "bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400"
          }`}>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Your Answer</span>
              <span className="text-xl font-black">{selectedAnswer}</span>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-primary-foreground shadow-lg ${isCorrect ? 'bg-emerald-500' : 'bg-rose-500'}`}>
              {isCorrect ? <CheckCircle2 size={28} /> : <XCircle size={28} />}
            </div>
          </div>
          
          {!isCorrect && (
            <div className="p-6 rounded-[2rem] border-2 border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-900/10">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 opacity-70 mb-1 block">Correct Answer</span>
              <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">{correctAnswer}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FillInTheBlank;