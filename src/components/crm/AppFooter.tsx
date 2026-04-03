"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Settings, 
  Database, 
  Bug, 
  Sparkles, 
  HelpCircle, 
  ShieldCheck,
  ExternalLink,
  Mic
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const AppFooter = () => {
  const links = [
    { label: "Settings", icon: Settings, path: "/settings" },
    { label: "Import", icon: Database, path: "/settings/import" },
    { label: "Demo", icon: Sparkles, path: "/settings/demo" },
    { label: "Debug", icon: Bug, path: "/settings/debug" },
  ];

  return (
    <footer className="mt-20 border-t border-border bg-muted/30 print:hidden">
      <div className="max-w-full mx-auto px-8 lg:px-12 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-black text-white">A</div>
              <span className="font-black text-lg tracking-tight">Antigravity CRM</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
              Advanced clinical management for the modern kinesiology practitioner. Built for precision, designed for healing.
            </p>
            <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
              <ShieldCheck size={14} /> System Secure & Encrypted
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">System Admin</h4>
            <nav className="flex flex-col gap-2">
              {links.map((link) => (
                <Link 
                  key={link.path} 
                  to={link.path}
                  className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors group"
                >
                  <link.icon size={14} className="group-hover:scale-110 transition-transform" />
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Resources</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/resources" className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors">Knowledge Base</Link>
              <Link to="/resources/worksheets/north-star" className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors">North Star Worksheet</Link>
              <Link to="/business/marketing-engine" className="text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors flex items-center gap-2 group">
                 <Mic size={14} className="group-hover:scale-110 transition-transform" /> AI Marketing Engine
              </Link>
              <a href="#" className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1 mt-2">
                Community Forum <ExternalLink size={10} />
              </a>
            </nav>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Support</h4>
            <div className="p-4 bg-card rounded-2xl border border-border shadow-sm space-y-3">
              <p className="text-[10px] font-bold text-slate-600">Need assistance with a protocol or technical issue?</p>
              <Button variant="outline" size="sm" className="w-full h-8 rounded-xl text-[10px] font-black uppercase tracking-widest">
                <HelpCircle size={12} className="mr-2" /> Get Support
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            © {new Date().getFullYear()} Antigravity Kinesiology. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-[10px] font-bold text-muted-foreground hover:text-foreground uppercase tracking-widest">Privacy Policy</a>
            <a href="#" className="text-[10px] font-bold text-muted-foreground hover:text-foreground uppercase tracking-widest">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;