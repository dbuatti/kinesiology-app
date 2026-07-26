
import { cn } from '@/lib/utils';
import { List } from 'lucide-react';

interface OutlineItem {
  id: string;
  label: string;
}

interface DocsOutlineProps {
  items: OutlineItem[];
}

const DocsOutline = ({ items }: DocsOutlineProps) => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="w-64 shrink-0 hidden xl:block sticky top-0 h-fit pt-4 print:hidden">
      <div className="flex items-center gap-2 px-4 mb-4 text-muted-foreground">
        <List size={18} />
        <span className="text-xs font-bold uppercase tracking-widest">Document outline</span>
      </div>
      <nav className="space-y-0.5">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => scrollToSection(item.id)}
            className="w-full text-left px-4 py-2 text-[13px] text-muted-foreground hover:bg-muted rounded-r-full transition-colors border-l-2 border-transparent hover:border-primary font-medium truncate"
          >
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default DocsOutline;