import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Compass } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] bg-indigo-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-rose-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 text-center space-y-8 max-w-md px-6">
        <div className="w-20 h-20 mx-auto bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center">
          <Compass size={36} className="text-slate-400" />
        </div>

        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">Error 404</p>
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-slate-900 dark:text-white tracking-tighter">
            Lost in space.
          </h1>
          <p className="text-base text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            The page at <code className="text-indigo-600 text-sm font-mono bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md">{location.pathname}</code> doesn't exist.
          </p>
        </div>

        <Button asChild className="rounded-2xl h-12 px-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-indigo-600 dark:hover:bg-indigo-100 font-bold text-xs uppercase tracking-widest gap-2 transition-all">
          <Link to="/">
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
