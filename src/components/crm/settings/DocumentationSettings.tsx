"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, LayoutGrid, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const DocumentationSettings = () => {
  return (
    <Card className="border-none shadow-lg rounded-[2.5rem] bg-white dark:bg-slate-950 overflow-hidden">
      <CardHeader className="p-8 pb-4">
        <CardTitle className="text-indigo-500 font-black flex items-center gap-3">
          <FileText size={24} className="text-indigo-500" /> Documentation & Audit
        </CardTitle>
        <CardDescription className="font-medium">Export site structure and content breakdowns.</CardDescription>
      </CardHeader>
      <CardContent className="p-8 pt-0 space-y-4">
        <Link to="/settings/audit">
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 group hover:border-indigo-300 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                <LayoutGrid size={20} />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900 dark:text-white">Site Audit Tool</p>
                <p className="text-[10px] text-slate-500 font-medium">Full text breakdown of all pages</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
      </CardContent>
    </Card>
  );
};

export default DocumentationSettings;