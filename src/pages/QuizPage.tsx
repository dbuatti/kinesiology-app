import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateQuestion, Question } from "@/utils/quiz-engine";
import QuestionRenderer from "@/components/quiz/QuestionRenderer";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Zap, 
  Trophy, 
  ArrowRight, 
  RotateCcw, 
  ChevronLeft,
  BrainCircuit,
  Sparkles,
  CheckCircle2,
  XCircle,
  Info
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const QuizPage = () => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | undefined>(undefined);
  const [isCorrect, setIsCorrect] = useState<boolean | undefined>(undefined);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const loadNextQuestion = useCallback(async (useAi = false) => {
    setSelectedAnswer(undefined);
    setIsCorrect(undefined);
    setShowExplanation(false);

    if (useAi) {
      setIsLoadingAi(true);
      try {
        const { data, error } = await supabase.functions.invoke('generate-quiz-question', {
          body: { category: 'Clinical Reasoning' }
        });

        if (error) throw error;

        const aiQuestion: Question = {
          id: `ai-${Date.now()}`,
          type: 'mcq',
          category: 'AI Clinical Scenario',
          question: data.question,
          options: data.options,
          correctAnswer: data.correctAnswer,
          explanation: data.explanation
        };
        setCurrentQuestion(aiQuestion);
      } catch (err) {
        console.error("Error loading AI question:", err);
        setCurrentQuestion(generateQuestion());
      } finally {
        setIsLoadingAi(false);
      }
    } else {
      setCurrentQuestion(generateQuestion());
    }
  }, []);

  useEffect(() => {
    loadNextQuestion();
  }, [loadNextQuestion]);

  const handleAnswer = (answer: string | boolean) => {
    if (typeof answer === 'boolean') {
      // Flashcard logic
      if (answer) {
        setScore(s => s + 1);
        setStreak(s => s + 1);
        showSuccess("Great job!");
      } else {
        setStreak(0);
      }
      setTotalAnswered(t => t + 1);
      loadNextQuestion();
      return;
    }

    setSelectedAnswer(answer);
    const correct = answer === currentQuestion?.correctAnswer;
    setIsCorrect(correct);
    setTotalAnswered(t => t + 1);

    if (correct) {
      setScore(s => s + 1);
      setStreak(s => s + 1);
      if (streak + 1 === 5) showSuccess("5 in a row! You're on fire! 🔥");
    } else {
      setStreak(0);
    }
    setShowExplanation(true);
  };

  if (!currentQuestion) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="rounded-xl font-bold text-xs uppercase tracking-widest"
          >
            <ChevronLeft size={16} className="mr-1" /> Exit
          </Button>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Trophy size={16} className="text-amber-500" />
              <span className="font-black text-sm">{score}</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-primary fill-primary" />
              <span className="font-black text-sm">{streak}</span>
            </div>
          </div>
        </div>
        <Progress value={(streak % 10) * 10} className="h-1 rounded-none bg-transparent [&>div]:bg-primary" />
      </div>

      <main className="max-w-3xl mx-auto px-4 pt-8 space-y-8">
        {/* Category Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full border border-primary/20">
            {currentQuestion.id.startsWith('ai') ? <Sparkles size={14} /> : <BrainCircuit size={14} />}
            <span className="text-[10px] font-black uppercase tracking-widest">{currentQuestion.category}</span>
          </div>
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Question {totalAnswered + 1}</span>
        </div>

        {/* Question Area */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 relative overflow-hidden">
          {isLoadingAi && (
            <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-black uppercase tracking-widest text-primary animate-pulse">Consulting AI Oracle...</p>
            </div>
          )}

          <QuestionRenderer
            question={currentQuestion}
            onAnswer={handleAnswer}
            selectedAnswer={selectedAnswer}
            isCorrect={isCorrect}
          />

          {showExplanation && (
            <div className="mt-8 animate-in fade-in slide-in-from-top-4 duration-500">
              <Alert className={isCorrect ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-900/30" : "bg-rose-50 border-rose-200 dark:bg-rose-900/10 dark:border-rose-900/30"}>
                <div className="flex items-start gap-3">
                  {isCorrect ? <CheckCircle2 className="text-emerald-600 mt-1" size={20} /> : <XCircle className="text-rose-600 mt-1" size={20} />}
                  <div>
                    <AlertTitle className={`font-black text-sm uppercase tracking-widest ${isCorrect ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}>
                      {isCorrect ? "Correct!" : "Not quite..."}
                    </AlertTitle>
                    <AlertDescription className="text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                      {currentQuestion.explanation}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
              
              <div className="mt-8 flex gap-3">
                <Button 
                  onClick={() => loadNextQuestion()} 
                  className="flex-1 h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-lg shadow-slate-900/20"
                >
                  Next Question <ArrowRight size={18} className="ml-2" />
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => loadNextQuestion(true)} 
                  className="h-14 px-6 rounded-2xl border-2 border-primary/20 text-primary hover:bg-primary/5 font-bold"
                >
                  <Sparkles size={18} className="mr-2" /> AI Challenge
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Stats Footer */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Accuracy</p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {totalAnswered > 0 ? Math.round((score / totalAnswered) * 100) : 0}%
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Streak</p>
            <p className="text-2xl font-black text-primary">{streak}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total</p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{totalAnswered}</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default QuizPage;
