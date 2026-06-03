"use client";

import React from 'react';
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
  const Separator = () => <div className="w-px h-5 bg-slate-300 mx-1" />;

  const ToolButton = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <button className={cn(
      "p-1.5 hover:bg-slate-200 rounded-md transition-colors text-slate-700",
      className
    )}>
      {children}
    </button>
  );

  return (
    <div className="bg-[hsl(var(--docs-toolbar))] border-b border-slate-200 px-4 py-1 flex items-center gap-0.5 overflow-x-auto no-scrollbar print:hidden">
      <div className="flex items-center bg-white rounded-full px-3 py-1.5 mr-2 border border-transparent hover:border-slate-300 transition-all cursor-text">
        <Search size={16} className="text-slate-500 mr-2" />
        <span className="text-sm text-slate-500">Menus</span>
      </div>

      <ToolButton><Undo2 size={16} /></ToolButton>
      <ToolButton><Redo2 size={16} /></ToolButton>
      <ToolButton><Printer size={16} /></ToolButton>
      <ToolButton><Type size={16} /></ToolButton>
      <ToolButton><PaintRoller size={16} /></ToolButton>

      <div className="flex items-center px-2 py-1 hover:bg-slate-200 rounded-md cursor-pointer gap-2">
        <span className="text-sm font-medium text-slate-700">100%</span>
        <ChevronDown size={12} />
      </div>

      <Separator />

      <div className="flex items-center px-2 py-1 hover:bg-slate-200 rounded-md cursor-pointer gap-4 min-w-[100px]">
        <span className="text-sm font-medium text-slate-700">Normal text</span>
        <ChevronDown size={12} />
      </div>

      <Separator />

      <div className="flex items-center px-2 py-1 hover:bg-slate-200 rounded-md cursor-pointer gap-4 min-w-[80px]">
        <span className="text-sm font-medium text-slate-700">Arial</span>
        <ChevronDown size={12} />
      </div>

      <Separator />

      <div className="flex items-center gap-1 px-1">
        <ToolButton className="h-7 w-7 flex items-center justify-center">-</ToolButton>
        <div className="bg-white border border-slate-300 rounded-sm px-2 py-0.5 text-xs font-medium w-8 text-center">11</div>
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
        <div className="flex items-center px-3 py-1.5 hover:bg-slate-200 rounded-md cursor-pointer gap-2">
          <Bold size={16} className="text-slate-700" />
          <span className="text-sm font-medium text-slate-700">Editing</span>
          <ChevronDown size={12} />
        </div>
        <Separator />
        <ToolButton><ChevronUp size={16} /></ToolButton>
      </div>
    </div>
  );
};

export default DocsToolbar;