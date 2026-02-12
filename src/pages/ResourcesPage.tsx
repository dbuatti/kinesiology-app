"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  BookOpen, 
  Footprints, 
  Scale, 
  Brain, 
  Wind, 
  Activity, 
  ExternalLink, 
  Info, 
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  FileText,
  Search
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Breadcrumbs from "@/components/crm/Breadcrumbs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ResourcesPage = () => {
  return (
    <div className="p-4 md:p-8 max-w-full mx-auto space-y-8">
      <Breadcrumbs items={[{ label: "Resources" }]} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Clinical Resources</h1>
          <p className="text-slate-500 mt-1">Protocols, research, and assessment guides for your practice.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input placeholder="Search resources..." className="pl-10 bg-white border-slate-200 rounded-xl" />
        </div>
      </div>

      <Tabs defaultValue="vestibular" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto p-1 bg-slate-100 rounded-2xl">
          <TabsTrigger value="vestibular" className="rounded-xl py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Footprints size={16} className="mr-2" /> Vestibular
          </TabsTrigger>
          <TabsTrigger value="respiratory" className="rounded-xl py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Wind size={16} className="mr-2" /> Respiratory
          </TabsTrigger>
          <TabsTrigger value="neurological" className="rounded-xl py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Brain size={16} className="mr-2" /> Neurological
          </TabsTrigger>
          <TabsTrigger value="kinesiology" className="rounded-xl py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Activity size={16} className="mr-2" /> Kinesiology
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vestibular" className="mt-8 space-y-8">
          {/* Fukuda Step Test Resource */}
          <Card className="border-none shadow-lg rounded-3xl overflow-hidden bg-white">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-white">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                  <Footprints size={32} />
                </div>
                <div>
                  <Badge className="bg-emerald-400/30 text-white border-none mb-1">Assessment Protocol</Badge>
                  <CardTitle className="text-3xl font-black">Fukuda Step Test</CardTitle>
                </div>
              </div>
              <p className="text-emerald-50 text-lg max-w-2xl leading-relaxed">
                A clinical tool used to assess balance and potential vestibular system weakness on one side of the body.
              </p>
            </div>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-8">
                  <section className="space-y-4">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <Info size={20} className="text-emerald-600" /> Purpose & Context
                    </h3>
                    <p className="text-slate-600 leading-relaxed">
                      The Fukuda Step Test (or Stepping Test) is performed during a vestibular and balance exam to determine if there is a vestibular system weakness. It is particularly useful when a client reports dizziness, vertigo, or disequilibrium.
                    </p>
                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3">
                      <AlertCircle className="text-amber-600 shrink-0" size={20} />
                      <p className="text-sm text-amber-800">
                        <strong>Clinical Note:</strong> While widely used, there is debate about its accuracy compared to tests like the Babinski-Weil Test. It is best used as an initial outcome measure.
                      </p>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <CheckCircle2 size={20} className="text-emerald-600" /> How to Perform
                    </h3>
                    <div className="grid gap-4">
                      {[
                        { step: 1, text: "Stand in the middle of a room with plenty of space. Mark the starting position at the toes." },
                        { step: 2, text: "Close both eyes and hold arms outstretched directly in front of the body." },
                        { step: 3, text: "Start stepping in place at a comfortable, brisk walking pace." },
                        { step: 4, text: "Remain walking in place for 50 to 100 steps." },
                        { step: 5, text: "Open eyes and determine the degree of rotation from the starting line." }
                      ].map((item) => (
                        <div key={item.step} className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <span className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold shrink-0">{item.step}</span>
                          <p className="text-slate-700 font-medium">{item.text}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                <div className="space-y-6">
                  <Card className="border-2 border-emerald-100 bg-emerald-50/50 rounded-3xl shadow-none">
                    <CardHeader>
                      <CardTitle className="text-lg font-bold text-emerald-900">Results Assessment</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 bg-white rounded-2xl border border-emerald-100">
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">50 Steps</p>
                        <p className="text-lg font-bold text-slate-900">Angle > 30°</p>
                        <p className="text-xs text-slate-500">Indicates potential weakness to the side of deviation.</p>
                      </div>
                      <div className="p-4 bg-white rounded-2xl border border-emerald-100">
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">100 Steps</p>
                        <p className="text-lg font-bold text-slate-900">Angle > 45°</p>
                        <p className="text-xs text-slate-500">Indicates single-sided vestibular weakness.</p>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-900 px-1">Related Tests</h4>
                    <Button variant="outline" className="w-full justify-between rounded-xl h-12 border-slate-200 hover:bg-slate-50" asChild>
                      <a href="#" className="flex items-center">
                        <span className="flex items-center gap-2"><Scale size={16} className="text-indigo-500" /> Babinski-Weil Test</span>
                        <ArrowRight size={14} />
                      </a>
                    </Button>
                    <Button variant="outline" className="w-full justify-between rounded-xl h-12 border-slate-200 hover:bg-slate-50" asChild>
                      <a href="#" className="flex items-center">
                        <span className="flex items-center gap-2"><Activity size={16} className="text-rose-500" /> CTSIB (Updated Romberg)</span>
                        <ArrowRight size={14} />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="respiratory" className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="rounded-3xl border-none shadow-sm bg-white">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-2">
                  <Wind size={24} />
                </div>
                <CardTitle>BOLT Score Optimization</CardTitle>
                <CardDescription>Techniques to improve CO2 tolerance</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  The Body Oxygen Level Test (BOLT) is a key indicator of respiratory health. Scores below 25s indicate dysfunctional breathing patterns.
                </p>
                <Button variant="link" className="p-0 text-indigo-600 font-bold">View Full Protocol <ArrowRight size={14} className="ml-1" /></Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="neurological" className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Card className="rounded-3xl border-none shadow-sm bg-white">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-2">
                  <Brain size={24} />
                </div>
                <CardTitle>Frontal Lobe Assessment</CardTitle>
                <CardDescription>Rapid hand drill for cortical asymmetry</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  Assessing the speed and coordination of distal extremities to identify contralateral frontal cortex dysfunction.
                </p>
                <Button variant="link" className="p-0 text-purple-600 font-bold">View Full Protocol <ArrowRight size={14} className="ml-1" /></Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="kinesiology" className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="rounded-3xl border-none shadow-sm bg-white">
              <CardHeader>
                <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center mb-2">
                  <Activity size={24} />
                </div>
                <CardTitle>Muscle Testing Fundamentals</CardTitle>
                <CardDescription>Normotonic vs. Dysfunctional responses</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  A guide to identifying muscle states: Inhibition, Hypertonicity, and Neurological Switching.
                </p>
                <Button variant="link" className="p-0 text-rose-600 font-bold">View Full Protocol <ArrowRight size={14} className="ml-1" /></Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResourcesPage;