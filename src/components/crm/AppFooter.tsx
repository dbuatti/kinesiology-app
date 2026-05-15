"use client";

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  
  // Hide footer on active session pages
  if (location.pathname.startsWith('/appointments/')) {
    return null;
  }

  const links = [
    { label: "Settings", icon: Settings, path: "/settings" },
    { label: "Import", icon: Database, path: "/settings/import" },
    { label: "Demo", icon: Sparkles, path: "/settings/demo" },
    { label: "Debug", icon: Bug, path: "/settings/debug" },
  ];

  return (
    <footer className="mt-24 border-t border-border bg-muted/10 print:hidden">
      <div className="max-w-7xl mx-auto px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="font-black text-lg tracking-tighter text-primary uppercase">Clinical Hub</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
              Advanced clinical management for the modern kinesiology practitioner. Built for precision, designed for healing.
            </p>
            <div className="flex items-center gap-2 text-[10px] font-bold text-success uppercase tracking-widest">
              <ShieldCheck size={14} /> System Secure & Encrypted
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">System Admin</h4>
            <nav className="flex flex-col gap-3">
              {links.map((link) => (
                <Link 
                  key={link.path} 
                  to={link.path}
                  className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
                >
                  <link.icon size={14} />
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Resources</h4>
            <nav className="flex flex-col gap-3">
              <Link to="/resources" className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors">Knowledge Base</Link>
              <Link to="/resources/worksheets/north-star" className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors">North Star Worksheet</Link>
              <Link to="/business/marketing-engine" className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                 <Mic size={14} /> AI Marketing Engine
              </Link>
              <a href="#" className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                Community Forum <ExternalLink size={10} />
              </a>
            </nav>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Support</h4>
            <div className="p-6 border border-border bg-background space-y-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Need assistance with a protocol or technical issue?</p>
              <Button variant="outline" size="sm" className="w-full h-10 font-bold text-[10px] uppercase tracking-widest border-border">
                <HelpCircle size={12} className="mr-2" /> Get Support
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            © {new Date().getFullYear()} Clinical Hub. All rights reserved.
          </p>
          <div className="flex items-center gap-8">
            <a href="#" className="text-[10px] font-bold text-muted-foreground hover:text-foreground uppercase tracking-widest">Privacy Policy</a>
            <a href="#" className="text-[10px] font-bold text-muted-foreground hover:text-foreground uppercase tracking-widest">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;