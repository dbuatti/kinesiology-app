"use client";

import React from 'react';
import { 
  FileText, 
  Star, 
  Folder, 
  Cloud, 
  History, 
  MessageSquare, 
  Video, 
  Lock, 
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const DocsHeader = () => {
  const menuItems = ["File", "Edit", "View", "Insert", "Format", "Tools", "Extensions", "Help"];

  return (
    <header className="bg-[hsl(var(--docs-surface))] border-b border-slate-200 px-4 py-2 flex flex-col gap-1 print:hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-600 rounded-sm">
            <FileText size={20} className="text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-lg font-medium text-slate-700 px-1 hover:bg-slate-200 rounded-sm cursor-pointer transition-colors">
                Clinical Practice Notes
              </span>
              <div className="flex items-center gap-1 text-slate-400">
                <Star size={14} className="hover:text-amber-400 cursor-pointer" />
                <Folder size={14} className="hover:text-slate-600 cursor-pointer" />
                <Cloud size={14} className="text-slate-500" />
              </div>
            </div>
            <nav className="flex items-center gap-1">
              {menuItems.map((item) => (
                <button 
                  key={item} 
                  className="text-xs text-slate-600 px-2 py-0.5 hover:bg-slate-200 rounded-sm transition-colors"
                >
                  {item}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 mr-2">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-slate-600">
              <History size={20} />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-slate-600">
              <MessageSquare size={20} />
            </Button>
            <Button variant="ghost" className="h-9 px-3 rounded-full text-slate-600 gap-1">
              <Video size={20} />
              <ChevronDown size={14} />
            </Button>
          </div>
          
          <Button className="bg-sky-200 hover:bg-sky-300 text-slate-950 rounded-full px-6 h-10 font-semibold gap-2 shadow-none border-none">
            <Lock size={18} />
            Share
          </Button>

          <div className="flex items-center gap-3 ml-2">
            <Sparkles size={20} className="text-slate-600" />
            <Avatar className="h-8 w-8 border border-slate-200">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>DB</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DocsHeader;