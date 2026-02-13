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
  Search,
  Zap,
  XCircle,
  Move
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Breadcrumbs from "@/components/crm/Breadcrumbs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

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
          <TabsTrigger value="lymphatic" className="rounded-xl py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Droplets size={16} className="mr-2" /> Lymphatic
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vestibular" className="mt-8 space-y-8">
          {/* Fukuda/Unterberger Step Test Resource */}
          <Card className="border-none shadow-lg rounded-3xl overflow-hidden bg-white">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-white">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                  <Footprints size={32} />
                </div>
                <div>
                  <div className="flex gap-2 mb-1">
                    <Badge className="bg-emerald-400/30 text-white border-none">Assessment Protocol</Badge>
                    <Badge className="bg-white/20 text-white border-none">Unterberger Test</Badge>
                  </div>
                  <CardTitle className="text-3xl font-black">Fukuda Step Test</CardTitle>
                </div>
              </div>
              <p className="text-emerald-50 text-lg max-w-2xl leading-relaxed">
                Examines labyrinthine function by triggering vestibulospinal reflexes. Used to isolate peripheral vestibular dysfunction and postural instability.
              </p>
            </div>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-10">
                  <section className="space-y-4">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <Info size={20} className="text-emerald-600" /> Purpose & Context
                    </h3>
                    <p className="text-slate-600 leading-relaxed">
                      The Unterberger (Fukuda) test is best implemented as a diagnostic method to isolate <strong>peripheral labyrinthine dysfunction</strong> in ambulatory individuals. It is most useful for patients at an advanced stage of vestibular rehabilitation where isolating nuanced balance mechanisms is required.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3">
                        <AlertCircle className="text-amber-600 shrink-0" size={20} />
                        <p className="text-sm text-amber-800">
                          <strong>Clinical Note:</strong> Rotation typically occurs <strong>toward the side of the affected ear</strong> (e.g., rotating left suggests a left ear drum/canal issue).
                        </p>
                      </div>
                      <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex gap-3">
                        <XCircle className="text-rose-600 shrink-0" size={20} />
                        <p className="text-sm text-rose-800">
                          <strong>Limitations:</strong> Not recommended as a sole diagnostic for those with stroke, BPPV, or spinal cord injuries that limit motor patterns.
                        </p>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <CheckCircle2 size={20} className="text-emerald-600" /> How to Perform
                    </h3>
                    <div className="grid gap-4">
                      {[
                        { step: 1, text: "Stand in a designated area (ideally marked with 0.5m and 1.0m concentric circles divided by 30° angles)." },
                        { step: 2, text: "Blindfold the patient (or close eyes) and instruct them to hold both arms straight out anteriorly." },
                        { step: 3, text: "Instruct the patient to step in place for 50 or 100 paces at a comfortable, brisk walking pace." },
                        { step: 4, text: "Observe for body sway, trajectory length, and the final angle of rotation from the starting line." }
                      ].map((item) => (
                        <div key={item.step} className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <span className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold shrink-0">{item.step}</span>
                          <p className="text-slate-700 font-medium">{item.text}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <Zap size={20} className="text-indigo-600" /> Intervention Strategies
                    </h3>
                    <p className="text-slate-600 leading-relaxed">
                      If the test is positive, structure the plan of care to challenge the vestibular system through functional exercise:
                    </p>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <li className="flex items-center gap-2 p-3 bg-indigo-50 rounded-xl text-indigo-900 text-sm font-medium">
                        <Move size={16} /> Functional reflex conditioning
                      </li>
                      <li className="flex items-center gap-2 p-3 bg-indigo-50 rounded-xl text-indigo-900 text-sm font-medium">
                        <Activity size={16} /> Cross-body rotational movements
                      </li>
                      <li className="flex items-center gap-2 p-3 bg-indigo-50 rounded-xl text-indigo-900 text-sm font-medium">
                        <Brain size={16} /> Multi-planar head/neck engagement
                      </li>
                      <li className="flex items-center gap-2 p-3 bg-indigo-50 rounded-xl text-indigo-900 text-sm font-medium">
                        <Zap size={16} /> 30s Cross Crawls for integration
                      </li>
                    </ul>
                  </section>
                </div>

                <div className="space-y-6">
                  <Card className="border-2 border-emerald-100 bg-emerald-50/50 rounded-3xl shadow-none">
                    <CardHeader>
                      <CardTitle className="text-lg font-bold text-emerald-900">Results Assessment</CardTitle>
                      <CardDescription className="text-emerald-700">Asymmetrical labyrinthine function indicators:</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 bg-white rounded-2xl border border-emerald-100">
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">50 Steps (High Sensitivity)</p>
                        <div className="space-y-1">
                          <p className="text-lg font-bold text-slate-900">Angle {">"} 30°</p>
                          <p className="text-lg font-bold text-slate-900">Displacement {">"} 0.5m</p>
                        </div>
                      </div>
                      <div className="p-4 bg-white rounded-2xl border border-emerald-100">
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">100 Steps (Delayed Onset)</p>
                        <div className="space-y-1">
                          <p className="text-lg font-bold text-slate-900">Angle {">"} 45°</p>
                          <p className="text-lg font-bold text-slate-900">Displacement {">"} 1.0m</p>
                        </div>
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

        <TabsContent value="neurological" className="mt-8 space-y-8">
          {/* Romberg Test Resource */}
          <Card className="border-none shadow-lg rounded-3xl overflow-hidden bg-white">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-8 text-white">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                  <Scale size={32} />
                </div>
                <div>
                  <div className="flex gap-2 mb-1">
                    <Badge className="bg-purple-400/30 text-white border-none">Neurological Exam</Badge>
                    <Badge className="bg-white/20 text-white border-none">Proprioception</Badge>
                  </div>
                  <CardTitle className="text-3xl font-black">Romberg Test</CardTitle>
                </div>
              </div>
              <p className="text-purple-50 text-lg max-w-2xl leading-relaxed">
                A foundational clinical tool to differentiate between sensory ataxia and cerebellar ataxia by removing visual compensation for balance.
              </p>
            </div>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-10">
                  <section className="space-y-4">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <Info size={20} className="text-purple-600" /> Purpose & Mechanism
                    </h3>
                    <p className="text-slate-600 leading-relaxed">
                      The Romberg test assesses the <strong>Dorsal Column-Medial Lemniscal Pathway</strong>. Balance requires 2 out of 3 systems: Vision, Proprioception, and Vestibular function. By closing the eyes, the patient is forced to rely solely on proprioception and vestibular input.
                    </p>
                  </section>

                  <section className="space-y-4">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <CheckCircle2 size={20} className="text-purple-600" /> Standard Protocol
                    </h3>
                    <div className="grid gap-4">
                      {[
                        { step: 1, text: "Patient stands barefoot with feet together (touching) and arms at sides or crossed over chest." },
                        { step: 2, text: "Observe for 30 seconds with eyes open. Note any significant sway or instability." },
                        { step: 3, text: "Instruct patient to close eyes and maintain position for another 30 seconds." },
                        { step: 4, text: "Stand close to the patient for safety to prevent falls during the 'eyes closed' phase." }
                      ].map((item) => (
                        <div key={item.step} className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <span className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold shrink-0">{item.step}</span>
                          <p className="text-slate-700 font-medium">{item.text}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <Zap size={20} className="text-amber-500" /> Sharpened (Tandem) Romberg
                    </h3>
                    <p className="text-slate-600 leading-relaxed">
                      A more challenging variation where the patient stands in a <strong>heel-to-toe (tandem)</strong> position. This narrows the base of support and is more sensitive to subtle vestibular or proprioceptive impairments.
                    </p>
                  </section>
                </div>

                <div className="space-y-6">
                  <Card className="border-2 border-purple-100 bg-purple-50/50 rounded-3xl shadow-none">
                    <CardHeader>
                      <CardTitle className="text-lg font-bold text-purple-900">Interpretation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 bg-white rounded-2xl border border-purple-100">
                        <p className="text-xs font-bold text-purple-600 uppercase tracking-widest mb-2">Positive Romberg Sign</p>
                        <p className="text-sm text-slate-700">Stable with eyes open, but loses balance/sways significantly with eyes closed.</p>
                        <p className="text-xs font-bold text-indigo-600 mt-2">Indicates: Sensory Ataxia (Dorsal Column lesion, Peripheral Neuropathy)</p>
                      </div>
                      <div className="p-4 bg-white rounded-2xl border border-purple-100">
                        <p className="text-xs font-bold text-rose-600 uppercase tracking-widest mb-2">Negative Result</p>
                        <p className="text-sm text-slate-700">Unstable with both eyes open and closed.</p>
                        <p className="text-xs font-bold text-rose-600 mt-2">Indicates: Cerebellar Ataxia or Vestibular Dysfunction</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>

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

        <TabsContent value="lymphatic" className="mt-8 space-y-8">
          <Card className="border-none shadow-lg rounded-3xl overflow-hidden bg-white">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-8 text-white">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                  <Droplets size={32} />
                </div>
                <div>
                  <div className="flex gap-2 mb-1">
                    <Badge className="bg-blue-400/30 text-white border-none">Drainage Protocol</Badge>
                    <Badge className="bg-white/20 text-white border-none">Counterstrain</Badge>
                  </div>
                  <CardTitle className="text-3xl font-black">Lymphatic System Assessment</CardTitle>
                </div>
              </div>
              <p className="text-blue-50 text-lg max-w-2xl leading-relaxed">
                "Drainage Precedes Supply" — Addressing lymphatic stasis to reduce neural inflammation and systemic toxicity.
              </p>
            </div>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-10">
                  <section className="space-y-4">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <Info size={20} className="text-blue-600" /> Philosophy & Theory
                    </h3>
                    <p className="text-slate-600 leading-relaxed">
                      The lymphatic system is the body's primary waste removal network. When stagnant, it leads to <strong>Neural Inflammation</strong> and the accumulation of inflammatory cytokines such as <strong>TNF-alpha, IL-6, and IL-1b</strong>.
                    </p>
                    <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl space-y-3">
                      <h4 className="font-bold text-blue-900">The "Drainage Precedes Supply" Rule</h4>
                      <p className="text-sm text-blue-800 leading-relaxed">
                        You cannot bring fresh, oxygenated blood and nutrients into a tissue that is already "clogged" with metabolic waste. Clearing the exit (lymphatics) is the priority before strengthening or nourishing.
                      </p>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <CheckCircle2 size={20} className="text-blue-600" /> Counterstrain Technique
                    </h3>
                    <div className="grid gap-4">
                      {[
                        { step: 1, title: "Identify Suture Side", text: "Palpate the cranial sutures (usually Lambdoid or Sagittal) to find the side of greatest tenderness or 'stickiness'." },
                        { step: 2, title: "Test Indicator Muscle", text: "Find a strong indicator muscle (IM) that weakens when the tender suture or priority zone is touched (TL)." },
                        { step: 3, title: "Position for Comfort", text: "Move the client's body or the specific zone into a position of maximum comfort (shortening the tissue) until tenderness reduces by at least 70%." },
                        { step: 4, title: "Hold & Breathe", text: "Maintain this position for 45 to 90 seconds. Encourage deep, diaphragmatic breathing to facilitate lymphatic flow." },
                        { step: 5, title: "Slow Return & Re-test", text: "Slowly return the tissue to neutral and re-test the IM. It should now remain strong under TL." }
                      ].map((item) => (
                        <div key={item.step} className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold shrink-0">{item.step}</span>
                          <div>
                            <p className="font-bold text-slate-900 mb-1">{item.title}</p>
                            <p className="text-slate-600 text-sm leading-relaxed">{item.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <Zap size={20} className="text-amber-500" /> Priority Zones
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <h4 className="font-bold text-slate-900 mb-2">1. Cervical (Neck)</h4>
                        <p className="text-xs text-slate-500">Clears the head and brain (Glymphatics). Essential for brain fog and headaches.</p>
                      </div>
                      <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <h4 className="font-bold text-slate-900 mb-2">2. Thoracic (Chest)</h4>
                        <p className="text-xs text-slate-500">The main drainage point for the entire body. Linked to Pec Minor tension.</p>
                      </div>
                      <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <h4 className="font-bold text-slate-900 mb-2">3. Cisterna Chyli</h4>
                        <p className="text-xs text-slate-500">Located behind the navel. The 'well' of the lymphatic system for the lower body.</p>
                      </div>
                      <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <h4 className="font-bold text-slate-900 mb-2">4. Inguinal (Groin)</h4>
                        <p className="text-xs text-slate-500">Clears the legs and pelvic floor. Vital for lower extremity edema.</p>
                      </div>
                    </div>
                  </section>
                </div>

                <div className="space-y-6">
                  <Card className="border-2 border-blue-100 bg-blue-50/50 rounded-3xl shadow-none">
                    <CardHeader>
                      <CardTitle className="text-lg font-bold text-blue-900">Visual References</CardTitle>
                      <CardDescription className="text-blue-700">Key anatomical landmarks for drainage:</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="aspect-video bg-white rounded-2xl border border-blue-100 flex items-center justify-center text-slate-400 text-xs font-bold uppercase tracking-widest text-center p-4">
                        Cranial Lymphatic Pathways<br/>(Placeholder)
                      </div>
                      <div className="aspect-video bg-white rounded-2xl border border-blue-100 flex items-center justify-center text-slate-400 text-xs font-bold uppercase tracking-widest text-center p-4">
                        Major Body Lymph Nodes<br/>(Placeholder)
                      </div>
                      <div className="aspect-video bg-white rounded-2xl border border-blue-100 flex items-center justify-center text-slate-400 text-xs font-bold uppercase tracking-widest text-center p-4">
                        Popliteal & Inguinal Flow<br/>(Placeholder)
                      </div>
                    </CardContent>
                  </Card>

                  <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl">
                    <h4 className="font-bold text-amber-900 flex items-center gap-2 mb-2">
                      <AlertCircle size={18} /> Clinical Pearl
                    </h4>
                    <p className="text-sm text-amber-800 leading-relaxed">
                      Hypertonic muscles (like the <strong>Pectoralis Minor</strong>) often act as physical "kinks" in the lymphatic hose. Releasing these muscles is often a prerequisite for effective lymphatic drainage.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResourcesPage;