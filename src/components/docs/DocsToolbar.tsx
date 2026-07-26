
import type { ReactNode } from 'react';
import { 
  Search, 
  Undo2, 
  Redo2, 
  Printer, 
  Type, 
  PaintRoller, 
  ChevronDown,
  Bold,
  Italic,
  Underline,
  Baseline,
  Highlighter,
  Link,
  MessageSquarePlus,
  Image as ImageIcon,
  AlignLeft,
  ListTodo,
  List,
  ListOrdered,
  IndentDecrease,
  IndentIncrease,
  RemoveFormatting,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

const DocsToolbar = () => {
  const Separator = () => <div className="w-px h-5 bg-muted mx-1" />;

  const ToolButton = ({ children, className }: { children: ReactNode, className?: string }) => (
    <button className={cn(
      "p-1.5 hover:bg-muted rounded-md transition-colors text-foreground/80",
      className
    )}>
      {children}
    </button>
  );

  return (
    <div className="bg-[hsl(var(--docs-toolbar))] border-b border-border px-4 py-1 flex items-center gap-0.5 overflow-x-auto no-scrollbar print:hidden">
      <div className="flex items-center bg-card rounded-full px-3 py-1.5 mr-2 border border-transparent hover:border-border transition-all cursor-text">
        <Search size={16} className="text-muted-foreground mr-2" />
        <span className="text-sm text-muted-foreground">Menus</span>
      </div>

      <ToolButton><Undo2 size={16} /></ToolButton>
      <ToolButton><Redo2 size={16} /></ToolButton>
      <ToolButton><Printer size={16} /></ToolButton>
      <ToolButton><Type size={16} /></ToolButton>
      <ToolButton><PaintRoller size={16} /></ToolButton>

      <div className="flex items-center px-2 py-1 hover:bg-muted rounded-md cursor-pointer gap-2">
        <span className="text-sm font-medium text-foreground/80">100%</span>
        <ChevronDown size={12} />
      </div>

      <Separator />

      <div className="flex items-center px-2 py-1 hover:bg-muted rounded-md cursor-pointer gap-4 min-w-[100px]">
        <span className="text-sm font-medium text-foreground/80">Normal text</span>
        <ChevronDown size={12} />
      </div>

      <Separator />

      <div className="flex items-center px-2 py-1 hover:bg-muted rounded-md cursor-pointer gap-4 min-w-[80px]">
        <span className="text-sm font-medium text-foreground/80">Arial</span>
        <ChevronDown size={12} />
      </div>

      <Separator />

      <div className="flex items-center gap-1 px-1">
        <ToolButton className="h-7 w-7 flex items-center justify-center">-</ToolButton>
        <div className="bg-card border border-border rounded-sm px-2 py-0.5 text-xs font-medium w-8 text-center">11</div>
        <ToolButton className="h-7 w-7 flex items-center justify-center">+</ToolButton>
      </div>

      <Separator />

      <ToolButton><Bold size={16} /></ToolButton>
      <ToolButton><Italic size={16} /></ToolButton>
      <ToolButton><Underline size={16} /></ToolButton>
      <ToolButton><Baseline size={16} /></ToolButton>
      <ToolButton><Highlighter size={16} /></ToolButton>

      <Separator />

      <ToolButton><Link size={16} /></ToolButton>
      <ToolButton><MessageSquarePlus size={16} /></ToolButton>
      <ToolButton><ImageIcon size={16} /></ToolButton>

      <Separator />

      <ToolButton><AlignLeft size={16} /><ChevronDown size={10} className="inline ml-0.5" /></ToolButton>
      <ToolButton><ListTodo size={16} /><ChevronDown size={10} className="inline ml-0.5" /></ToolButton>
      <ToolButton><List size={16} /><ChevronDown size={10} className="inline ml-0.5" /></ToolButton>
      <ToolButton><ListOrdered size={16} /><ChevronDown size={10} className="inline ml-0.5" /></ToolButton>
      <ToolButton><IndentDecrease size={16} /></ToolButton>
      <ToolButton><IndentIncrease size={16} /></ToolButton>
      <ToolButton><RemoveFormatting size={16} /></ToolButton>

      <div className="ml-auto flex items-center gap-2">
        <div className="flex items-center px-3 py-1.5 hover:bg-muted rounded-md cursor-pointer gap-2">
          <Bold size={16} className="text-foreground/80" />
          <span className="text-sm font-medium text-foreground/80">Editing</span>
          <ChevronDown size={12} />
        </div>
        <Separator />
        <ToolButton><ChevronUp size={16} /></ToolButton>
      </div>
    </div>
  );
};

export default DocsToolbar;