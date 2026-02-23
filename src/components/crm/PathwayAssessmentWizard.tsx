"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronRight, 
  ChevronLeft, 
  Activity, 
  Brain, 
  Dumbbell, 
  AlertCircle, 
  CheckCircle2, 
  Zap, 
  Eye, 
  Heart, 
  RotateCcw,
  Droplets,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import NociceptiveThreatAssessment from './NociceptiveThreatAssessment';

type Step = 
  | 'SELECT_PATHWAY' 
  | 'TEST_IM' 
  | 'SELECT_RESPONSE' 
  | 'SELECT_DIRECTION' 
  | 'SELECT_SPECIFIC' 
  | 'CORRECTION' 
  | 'REASSESS';

type PathwayType = 'Primitive Reflex' | 'Cranial Nerve' | 'Brain Zone' | 'Muscle' | 'Nociceptive Threat';
type ResponseType = 'Clear/Normal' | 'Inhibited/Abnormal';
type DirectionType = 'Afferent (Bottom-Up)' | 'Efferent (Top-Down)';
type SpecificCorrection = 
  | 'Mechanoreceptor' 
  | 'Vestibular/Ocular' 
  | 'Physiological'
  | 'Cortical' 
  | 'Subcortical' 
  | 'Emotional';

interface WizardState {
  pathway: PathwayType | null;
  response: ResponseType | null;
  direction: DirectionType | null;
  specific: SpecificCorrection | null;
  reassessed: boolean;
}

interface PathwayAssessmentWizardProps {
  onSave: (summary: string) => void;
  initialValue?: string;
}

const PathwayAssessmentWizard = ({ onSave, initialValue }: PathwayAssessmentWizardProps) => {
  const [step, setStep] = useState<Step>('SELECT_PATHWAY');
  const [showNociceptive, setShowNociceptive] = useState(false);
  const [state, setState] = useState<WizardState>({
    pathway: null,
    response: null,
    direction: null,
    specific: null,
    reassessed: false,
  });

  const nextStep = (next: Step) => setStep(next);
  const prevStep = (prev: Step) => setStep(prev);

  const generateSummary = (finalState: WizardState) => {
    const parts = [];
    if (finalState.pathway) parts.push(`Pathway: ${finalState.pathway}`);
    if (finalState.response) parts.push(`Response: ${finalState.response}`);
    if (finalState.direction) parts.push(`Correction: ${finalState.direction}`);
    if (finalState.specific) parts.push(`Specific: ${finalState.specific}`);
    if (finalState.reassessed) parts.push(`Status: Cleared`);
    
    return parts.join(' | ');
  };

  const handleComplete = () => {
    const summary = generateSummary(state);
    onSave(summary);
    setStep('SELECT_PATHWAY');
    setState({
      pathway: null,
      response: null,
      direction: null,
      specific: null,
      reassessed: false,
    });
  };

  if (showNociceptive) {
    return (
      <NociceptiveThreatAssessment 
        onSave={(summary) => {
          onSave(summary);
          setShowNociceptive(false);
        }} 
        initialValue={initialValue}
        onCancel={() => setShowNociceptive(false)} 
      />
    );
  }

  const renderStep = () => {
    switch (step) {
      case 'SELECT_PATHWAY':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Select Pathway to Assess</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(['Primitive Reflex', 'Cranial Nerve', 'Brain Zone', 'Muscle', 'Nociceptive Threat'] as PathwayType[]).map((p) => (
                <Button
                  key={p}
                  variant="outline"
                  className={cn(
                    "h-16 justify-start gap-3 px-4 rounded-xl border-2 transition-all",
                    state.pathway === p ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-100 hover:border-indigo-200"
                  )}
                  onClick={() => {
                    if (p === 'Nociceptive Threat') {
                      setShowNociceptive(true);
                    } else {
                      setState({ ...state, pathway: p });
                      nextStep('TEST_IM');
                    }
                  }}
                >
                  <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center">
                    {p === 'Primitive Reflex' && <RotateCcw size={18} className="text-orange-500" />}
                    {p === 'Cranial Nerve' && <Activity size={18} className="text-blue-500" />}
                    {p === 'Brain Zone' && <Brain size={18} className="text-purple-500" />}
                    {p === 'Muscle' && <Dumbbell size={18} className="text-green-500" />}
                    {p === 'Nociceptive Threat' && <AlertTriangle size={18} className="text-red-500" />}
                  </div>
                  <span className="font-semibold">{p}</span>
                </Button>
              ))}
            </div>
          </div>
        );

      case 'TEST_IM':
        return (
          <div className="space-y-6">
            <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
              <h3 className="text-lg font-bold text-indigo-900 mb-2">Stimulation & Test</h3>
              <p className="text-indigo-700 leading-relaxed">
                1. Stimulate the <strong>{state.pathway}</strong> pathway.<br />
                2. Immediately test the <strong>Indicator Muscle (IM)</strong>.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => prevStep('SELECT_PATHWAY')} className="flex-1 h-12 rounded-xl">
                <ChevronLeft size={18} className="mr-2" /> Back
              </Button>
              <Button onClick={() => nextStep('SELECT_RESPONSE')} className="flex-[2] h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700">
                Test Complete <ChevronRight size={18} className="ml-2" />
              </Button>
            </div>
          </div>
        );

      case 'SELECT_RESPONSE':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">What was the IM response?</h3>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className={cn(
                  "h-32 flex-col gap-3 rounded-2xl border-2 transition-all",
                  state.response === 'Clear/Normal' ? "border-green-600 bg-green-50 text-green-700" : "border-slate-100 hover:border-green-200"
                )}
                onClick={() => {
                  setState({ ...state, response: 'Clear/Normal' });
                  nextStep('REASSESS');
                }}
              >
                <CheckCircle2 size={32} className="text-green-500" />
                <span className="font-bold">Clear / Normal</span>
              </Button>
              <Button
                variant="outline"
                className={cn(
                  "h-32 flex-col gap-3 rounded-2xl border-2 transition-all",
                  state.response === 'Inhibited/Abnormal' ? "border-red-600 bg-red-50 text-red-700" : "border-slate-100 hover:border-red-200"
                )}
                onClick={() => {
                  setState({ ...state, response: 'Inhibited/Abnormal' });
                  nextStep('SELECT_DIRECTION');
                }}
              >
                <Zap size={32} className="text-red-500" />
                <span className="font-bold">Inhibited / Abnormal</span>
              </Button>
            </div>
            <Button variant="ghost" onClick={() => prevStep('TEST_IM')} className="w-full h-12 rounded-xl">
              <ChevronLeft size={18} className="mr-2" /> Back
            </Button>
          </div>
        );

      case 'SELECT_DIRECTION':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Correction Direction</h3>
            <div className="grid grid-cols-1 gap-3">
              <Button
                variant="outline"
                className={cn(
                  "h-20 justify-between px-6 rounded-2xl border-2 transition-all",
                  state.direction === 'Afferent (Bottom-Up)' ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-100 hover:border-indigo-200"
                )}
                onClick={() => {
                  setState({ ...state, direction: 'Afferent (Bottom-Up)' });
                  nextStep('SELECT_SPECIFIC');
                }}
              >
                <div className="text-left">
                  <div className="font-bold">Afferent</div>
                  <div className="text-xs opacity-70">Bottom-Up Processing</div>
                </div>
                <ChevronRight size={20} />
              </Button>
              <Button
                variant="outline"
                className={cn(
                  "h-20 justify-between px-6 rounded-2xl border-2 transition-all",
                  state.direction === 'Efferent (Top-Down)' ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-100 hover:border-indigo-200"
                )}
                onClick={() => {
                  setState({ ...state, direction: 'Efferent (Top-Down)' });
                  nextStep('SELECT_SPECIFIC');
                }}
              >
                <div className="text-left">
                  <div className="font-bold">Efferent</div>
                  <div className="text-xs opacity-70">Top-Down Processing</div>
                </div>
                <ChevronRight size={20} />
              </Button>
            </div>
            <Button variant="ghost" onClick={() => prevStep('SELECT_RESPONSE')} className="w-full h-12 rounded-xl">
              <ChevronLeft size={18} className="mr-2" /> Back
            </Button>
          </div>
        );

      case 'SELECT_SPECIFIC':
        const options: SpecificCorrection[] = state.direction === 'Afferent (Bottom-Up)' 
          ? ['Mechanoreceptor', 'Vestibular/Ocular', 'Physiological']
          : ['Cortical', 'Subcortical', 'Emotional'];

        return (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Specific Correction</h3>
            <div className="grid grid-cols-1 gap-3">
              {options.map((opt) => (
                <Button
                  key={opt}
                  variant="outline"
                  className={cn(
                    "h-16 justify-start gap-3 px-4 rounded-xl border-2 transition-all",
                    state.specific === opt ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-100 hover:border-indigo-200"
                  )}
                  onClick={() => {
                    setState({ ...state, specific: opt });
                    nextStep('CORRECTION');
                  }}
                >
                  <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center">
                    {opt === 'Mechanoreceptor' && <Activity size={18} className="text-blue-500" />}
                    {opt === 'Vestibular/Ocular' && <Eye size={18} className="text-cyan-500" />}
                    {opt === 'Physiological' && <Droplets size={18} className="text-emerald-500" />}
                    {opt === 'Cortical' && <Brain size={18} className="text-purple-500" />}
                    {opt === 'Subcortical' && <Zap size={18} className="text-amber-500" />}
                    {opt === 'Emotional' && <Heart size={18} className="text-rose-500" />}
                  </div>
                  <span className="font-semibold">{opt}</span>
                </Button>
              ))}
            </div>
            <Button variant="ghost" onClick={() => prevStep('SELECT_DIRECTION')} className="w-full h-12 rounded-xl">
              <ChevronLeft size={18} className="mr-2" /> Back
            </Button>
          </div>
        );

      case 'CORRECTION':
        return (
          <div className="space-y-6">
            <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
              <h3 className="text-lg font-bold text-amber-900 mb-2">Correction Action</h3>
              <div className="text-amber-800 space-y-3">
                <p className="font-medium">Apply the <strong>{state.specific}</strong> correction:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {state.specific === 'Mechanoreceptor' && (
                    <>
                      <li>Apply specific joint mobilization or soft tissue work.</li>
                      <li>Maintain contact with the receptor site.</li>
                    </>
                  )}
                  {state.specific === 'Vestibular/Ocular' && (
                    <>
                      <li>Perform VOR or saccadic eye movements.</li>
                      <li>Use head rotations or balance challenges.</li>
                    </>
                  )}
                  {state.specific === 'Physiological' && (
                    <>
                      <li>Address biochemical or organ-specific reflexes.</li>
                      <li>Check for nutritional or hydration priorities.</li>
                    </>
                  )}
                  {state.specific === 'Cortical' && (
                    <>
                      <li>Engage cognitive tasks or visualization.</li>
                      <li>Focus on intentional movement patterns.</li>
                    </>
                  )}
                  {state.specific === 'Subcortical' && (
                    <>
                      <li>Use rhythmic movements or breathing patterns.</li>
                      <li>Focus on autonomic regulation.</li>
                    </>
                  )}
                  {state.specific === 'Emotional' && (
                    <>
                      <li>Apply ESR (Emotional Stress Release) points.</li>
                      <li>Acknowledge and release associated stressors.</li>
                    </>
                  )}
                </ul>
                <p className="text-sm italic mt-4">"Hold points and breathe deeply for 30 seconds."</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => prevStep('SELECT_SPECIFIC')} className="flex-1 h-12 rounded-xl">
                <ChevronLeft size={18} className="mr-2" /> Back
              </Button>
              <Button onClick={() => nextStep('REASSESS')} className="flex-[2] h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700">
                Correction Applied <ChevronRight size={18} className="ml-2" />
              </Button>
            </div>
          </div>
        );

      case 'REASSESS':
        return (
          <div className="space-y-6">
            <div className="bg-green-50 p-6 rounded-2xl border border-green-100 text-center">
              <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-green-900 mb-2">Final Re-assessment</h3>
              <p className="text-green-700">
                Re-stimulate the <strong>{state.pathway}</strong> pathway and test the IM again.
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <Button 
                className="h-14 rounded-xl bg-green-600 hover:bg-green-700 text-lg font-bold"
                onClick={() => {
                  setState({ ...state, reassessed: true });
                  handleComplete();
                }}
              >
                Pathway is Clear <CheckCircle2 size={20} className="ml-2" />
              </Button>
              <Button 
                variant="outline" 
                className="h-14 rounded-xl border-2 border-red-100 text-red-600 hover:bg-red-50"
                onClick={() => {
                  setStep('SELECT_DIRECTION');
                }}
              >
                Still Inhibited - Try Another Correction
              </Button>
            </div>
            
            <Button variant="ghost" onClick={() => prevStep(state.response === 'Clear/Normal' ? 'SELECT_RESPONSE' : 'CORRECTION')} className="w-full h-12 rounded-xl">
              <ChevronLeft size={18} className="mr-2" /> Back
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="p-6 bg-white border-slate-100 shadow-sm rounded-2xl overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-slate-100">
        <div 
          className="h-full bg-indigo-600 transition-all duration-500" 
          style={{ 
            width: `${(
              ['SELECT_PATHWAY', 'TEST_IM', 'SELECT_RESPONSE', 'SELECT_DIRECTION', 'SELECT_SPECIFIC', 'CORRECTION', 'REASSESS'].indexOf(step) + 1
            ) / 7 * 100}%` 
          }} 
        />
      </div>
      
      <div className="flex items-center justify-between mb-6 mt-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
            <Zap size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 leading-none">Pathway Wizard</h2>
            <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-wider">Step {['SELECT_PATHWAY', 'TEST_IM', 'SELECT_RESPONSE', 'SELECT_DIRECTION', 'SELECT_SPECIFIC', 'CORRECTION', 'REASSESS'].indexOf(step) + 1} of 7</p>
          </div>
        </div>
        {state.pathway && (
          <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none px-3 py-1 rounded-full font-bold">
            {state.pathway}
          </Badge>
        )}
      </div>

      <div className="min-h-[300px] flex flex-col justify-center">
        {renderStep()}
      </div>

      {initialValue && step === 'SELECT_PATHWAY' && (
        <div className="mt-8 pt-6 border-t border-slate-50">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Current Assessment</h4>
          <div className="p-4 bg-slate-50 rounded-xl text-sm text-slate-600 font-medium border border-slate-100">
            {initialValue}
          </div>
        </div>
      )}
    </Card>
  );
};

export default PathwayAssessmentWizard;