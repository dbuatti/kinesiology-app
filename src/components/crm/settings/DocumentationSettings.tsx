"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, LayoutGrid, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const DocumentationSettings = () => {
  return (
    <Card className="border-none shadow-lg rounded-[2.5rem] bg-card overflow-hidden">
      <CardHeader className="p-8 pb-4">
        <CardTitle className="text-primary font-black flex items-center gap-3">
          <FileText size={22} className="text-primary" /> Documentation & Audit
        </CardTitle>
        <CardDescription className="font-medium">Export site structure and content breakdowns.</CardDescription>
      </CardHeader>
      <CardContent className="p-8 pt-0 space-y-4">
        <Link to="/settings/audit">
          <div className="flex items-center justify-between p-4 bg-muted/40 rounded-2xl border border-border group hover:border-primary/40 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-background border border-border shadow-sm flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <LayoutGrid size={20} />
              </div>
              <div>
                <p className="text-sm font-black text-foreground">Site Audit Tool</p>
                <p className="text-[10px] text-muted-foreground font-medium">Full text breakdown of all pages</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
      </CardContent>
    </Card>
  );
};

export default DocumentationSettings;