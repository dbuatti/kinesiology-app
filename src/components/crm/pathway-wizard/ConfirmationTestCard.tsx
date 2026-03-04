"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ConfirmationTestCardProps {
  test: string;
  className?: string;
}

const ConfirmationTestCard = ({ test, className }: ConfirmationTestCardProps) => {
  return (
    <Card className={`border-2 border-blue-100 bg-blue-50/50 shadow-none ${className}`}>
      <CardContent className="p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
          <CheckCircle2 size={16} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Confirmation Test</p>
          <p className="text-sm font-bold text-blue-900 leading-tight">{test}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConfirmationTestCard;