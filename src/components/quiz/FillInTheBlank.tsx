import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";

interface FillInTheBlankProps {
  question: string;
  correctAnswer: string;
  onAnswer: (answer: string) => void;
  selectedAnswer?: string;
  isCorrect?: boolean;
}

const FillInTheBlank: React.FC<FillInTheBlankProps> = ({
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
    <div className="space-y-6">
      <h3 className="text-xl font-bold leading-tight text-slate-900 dark:text-slate-100">
        {question}
      </h3>
      
      {!selectedAnswer ? (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your answer here..."
            className="h-12 rounded-xl border-2 focus-visible:ring-primary"
            autoFocus
          />
          <Button type="submit" className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/90">
            <ArrowRight size={20} />
          </Button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className={`p-4 rounded-xl border-2 flex items-center justify-between ${
            isCorrect 
              ? "bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" 
              : "bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400"
          }`}>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Your Answer</span>
              <span className="font-bold">{selectedAnswer}</span>
            </div>
            {isCorrect ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
          </div>
          
          {!isCorrect && (
            <div className="p-4 rounded-xl border-2 border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-900/10">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 opacity-70">Correct Answer</span>
              <p className="font-bold text-emerald-700 dark:text-emerald-300">{correctAnswer}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FillInTheBlank;
