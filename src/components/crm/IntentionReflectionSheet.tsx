"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  Compass, 
  Target, 
  Heart, 
  Wind, 
  Printer, 
  ArrowRight, 
  Quote,
  Brain,
  Shield
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const IntentionReflectionSheet = () => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Hero Section */}
      <div className="relative rounded-[3.5rem] overflow-hidden bg-slate-950 text-white p-12 shadow-2xl group">
        {/* Cosmic Background Elements */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1464802686167-b939a6910659?q=80&w=2000')] opacity-20 bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/80 via-slate-950 to-purple-900/80" />
        
        {/* Geometric Mandala Overlay (Simulated with CSS/Icons) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
          <Sparkles size={600} className="text-indigo-400 animate-pulse" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-2xl group-hover:scale-110 transition-transform duration-500">
            <Compass size={40} className="text-indigo-400" />
          </div>
          <div className="space-y-2">
            <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 font-black text-[10px] uppercase tracking-[0.3em] px-4 py-1">
              Integrated Healer Program
            </Badge>
            <h1 className="text-5xl font-black tracking-tighter">Setting Your North Star</h1>
            <p className="text-xl text-slate-400 font-medium max-w-2xl mx-auto">
              "The Deeper you work, the higher you rise."
            </p>
          </div>
          
          <div className="flex gap-4 pt-4 print:hidden">
            <Button onClick={handlePrint} className="bg-white text-slate-950 hover:bg-indigo-50 h-12 px-8 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">
              <Printer size={18} className="mr-2" /> Print Worksheet
            </Button>
          </div>
        </div>
      </div>

      {/* Purpose & Instructions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="md:col-span-1 border-none shadow-lg rounded-[2.5rem] bg-indigo-600 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-6 opacity-10"><Target size={100} /></div>
          <CardHeader className="p-8">
            <CardTitle className="text-xl font-black flex items-center gap-3">
              <Sparkles size={20} className="text-teal-300" /> The Purpose
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <p className="text-indigo-50 font-medium leading-relaxed">
              This reflection sheet will help you get crystal clear on why you're here and what you're ready to release over the next 12 weeks. Your intention is your North Star—it will anchor you when resistance shows up.
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-none shadow-lg rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-xl font-black flex items-center gap-3 text-slate-900">
              <Wind size={20} className="text-indigo-600" /> Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <div className="flex gap-6 items-start">
              <div className="space-y-4 flex-1">
                <p className="text-slate-600 font-medium leading-relaxed">
                  Find a quiet space, take a few deep breaths, and write freely. Don't overthink it. Let your truth emerge.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-indigo-600 shadow-sm"><Brain size={16} /></div>
                    <span className="text-xs font-bold text-slate-700">Clear Mind</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-rose-600 shadow-sm"><Heart size={16} /></div>
                    <span className="text-xs font-bold text-slate-700">Open Heart</span>
                  </div>
                </div>
              </div>
              <div className="hidden sm:block w-32 h-32 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-200">
                <Quote size={64} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Part 1: Reflection Content */}
      <div className="space-y-8">
        <div className="flex items-center gap-4 px-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-lg">1</div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Part 1: Why Are You Here?</h2>
          <div className="flex-1 h-[2px] bg-slate-200 rounded-full opacity-50" />
        </div>

        <div className="grid grid-cols-1 gap-8">
          {[
            {
              q: "What called you to this program?",
              sub: "Go beyond the surface reason. What was the deeper pull?",
              a: "I’m not fully sure why I’m here asides from it being apart of the year programme and I seem to just ‘be here’. To be honest, I didn’t think that I was going to be invited to do this in February as it’s the second month of being involved this year. That said, I know that I have avoidant patterns. I know that I have things I’m not facing. I know that I have tensions, and confusions, and excessive thinking that makes daily life challenging.",
              icon: Sparkles,
              color: "border-indigo-100 bg-indigo-50/30"
            },
            {
              q: "What patterns or emotions are you tired of carrying?",
              sub: "What keeps showing up in your life that you're ready to release?",
              a: "I want to release overthinking. I want to release sadness. I want to release dull aches and pains from the body. I want to release worry and anxiety. I want to release frustration, and agitation and contempt. I want to release the need to separate.",
              icon: Heart,
              color: "border-rose-100 bg-rose-50/30"
            },
            {
              q: "If you're being completely honest, what are you avoiding or hiding from?",
              sub: "What part of yourself have you been unwilling to look at?",
              a: "I have been unwilling to look at the part of me that feels deeply sad. And unwilling to feel into the dark part of me that hates things. Dislikes things. Disagrees with things. Unwilling to look at the uncomfortable parts in my body. The fear. The anger and aggression. The truth and the expression. The willingness to speak truthfully and honestly.",
              icon: Shield,
              color: "border-amber-100 bg-amber-50/30"
            }
          ].map((item, i) => (
            <Card key={i} className={cn("border-2 shadow-none rounded-[2.5rem] overflow-hidden", item.color)}>
              <CardHeader className="p-8 pb-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0">
                    <item.icon size={20} className={cn(item.color.replace('border-', 'text-').replace('bg-', 'text-').split(' ')[0])} />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-black text-slate-900">{item.q}</CardTitle>
                    <CardDescription className="text-slate-500 font-medium mt-1">{item.sub}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white shadow-inner">
                  <p className="text-lg font-medium text-slate-700 leading-relaxed italic">
                    "{item.a}"
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Footer Quote */}
      <div className="text-center py-12 border-t border-slate-100">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4">The Integrated Healer</p>
        <p className="text-2xl font-black text-indigo-600 italic">"Your truth is the only path to transformation."</p>
      </div>
    </div>
  );
};

export default IntentionReflectionSheet;