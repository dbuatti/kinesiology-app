
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  GraduationCap, 
  Brain, 
  Zap, 
  Activity, 
  Layers, 
  Target, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { QuizCategory } from '@/utils/quiz-engine';
import { cn } from '@/lib/utils';

interface QuizSetupProps {
  onStart: (category: QuizCategory) => void;
}

const CATEGORIES: { id: QuizCategory; label: string; icon: any; color: string; desc: string }[] = [
  { id: 'All', label: 'Full Mastery', icon: Sparkles, color: 'bg-indigo-600', desc: 'Random questions from all categories.' },
  { id: 'Anatomy', label: 'Anatomy & Nerves', icon: Brain, color: 'bg-purple-600', desc: 'Muscles, cranial nerves, and nuclei.' },
  { id: 'TCM', label: 'TCM & Meridians', icon: Layers, color: 'bg-emerald-600', desc: 'Channels, elements, and acupoints.' },
  { id: 'Clinical', label: 'Clinical Reflexes', icon: Activity, color: 'bg-rose-600', desc: 'Primitive reflexes and stimuli.' },
  { id: 'Priority Logic', label: 'Priority Logic', icon: Zap, color: 'bg-amber-500', desc: 'Clinical hierarchy and reasoning.' },
  { id: 'Methodology', label: 'FNH Methodology', icon: Target, color: 'bg-primary', desc: 'PEACE process and NEI protocols.' },
];

const QuizSetup = ({ onStart }: QuizSetupProps) => {
  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-indigo-200">
          <GraduationCap size={40} className="text-primary-foreground" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground">Knowledge Oracle</h1>
        <p className="text-lg text-muted-foreground font-medium max-w-xl mx-auto">
          Sharpen your clinical intuition with infinite practice questions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {CATEGORIES.map((cat) => (
          <Card 
            key={cat.id}
            className="border-none shadow-md hover:shadow-xl transition-all duration-300 group cursor-pointer rounded-[2.5rem] bg-background overflow-hidden"
            onClick={() => onStart(cat.id)}
          >
            <CardContent className="p-8 space-y-6">
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center text-primary-foreground shadow-lg transition-transform group-hover:scale-110",
                cat.color
              )}>
                <cat.icon size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black text-foreground group-hover:text-indigo-600 transition-colors">{cat.label}</h3>
                <p className="text-sm text-muted-foreground font-medium mt-1 leading-relaxed">{cat.desc}</p>
              </div>
              <div className="pt-4 flex items-center justify-between border-t border-border">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-indigo-600 transition-colors">Start Training</span>
                <ArrowRight size={18} className="text-muted-foreground group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default QuizSetup;