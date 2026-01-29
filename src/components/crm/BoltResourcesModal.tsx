"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BookOpen, 
  Clock, 
  Target, 
  AlertCircle, 
  CheckCircle2,
  Wind,
  Timer,
  TrendingUp
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BoltResourcesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentScore?: number | null;
}

const BoltResourcesModal = ({ open, onOpenChange, currentScore }: BoltResourcesModalProps) => {
  const needsImprovement = currentScore !== null && currentScore !== undefined && currentScore < 25;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Wind size={24} className="text-white" />
            </div>
            BOLT Score Improvement Resources
          </DialogTitle>
          <DialogDescription>
            Evidence-based breathing exercises to improve CO2 tolerance and respiratory health
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {currentScore !== null && currentScore !== undefined && (
            <Card className={`border-2 ${needsImprovement ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-1">Current BOLT Score</p>
                    <p className="text-4xl font-black text-slate-900">{currentScore}s</p>
                  </div>
                  <div className="text-right">
                    {needsImprovement ? (
                      <>
                        <Badge className="bg-amber-500 text-white mb-2">Needs Improvement</Badge>
                        <p className="text-xs text-amber-800 font-medium">Target: 25s minimum</p>
                        <p className="text-xs text-amber-700">Optimal: 40s+</p>
                      </>
                    ) : (
                      <>
                        <Badge className="bg-emerald-500 text-white mb-2">
                          <CheckCircle2 size={14} className="mr-1" /> Good Score
                        </Badge>
                        <p className="text-xs text-emerald-800 font-medium">Keep practicing!</p>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Timer size={20} className="text-indigo-600" />
                Breathing Recovery Exercise
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-indigo-100">
                  <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Breath Hold</p>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      Take a normal breath in and out through the nose. Plug the nose/nostrils for <strong>5 seconds</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-indigo-100">
                  <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Recovery Breathing</p>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      Release the hold and resume normal, calm, nasal breathing for <strong>10-15 seconds</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-indigo-100">
                  <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Repeat Cycle</p>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      Continue the cycle for <strong>5-15 minutes</strong>
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-600 text-white p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={18} />
                  <p className="font-bold">Recommended Practice Schedule</p>
                </div>
                <p className="text-sm text-indigo-100">
                  Do this exercise <strong>2-3 times per day</strong>, everyday in sets of <strong>10-20 minutes</strong> to increase your BOLT score
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target size={20} className="text-emerald-600" />
                Target Goals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <TrendingUp size={24} className="text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="font-bold text-emerald-900">Minimum Target: 25 seconds</p>
                  <p className="text-sm text-emerald-700">Essential for optimizing health</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <CheckCircle2 size={24} className="text-blue-600 flex-shrink-0" />
                <div>
                  <p className="font-bold text-blue-900">Optimal Target: 40+ seconds</p>
                  <p className="text-sm text-blue-700">Ideal for peak respiratory function</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-sm text-red-900 space-y-2">
              <p className="font-bold">Important Clinical Notes:</p>
              <ul className="space-y-1 ml-4 list-disc">
                <li>
                  The lower the client's BOLT score, the more imperative it is for them to do the Breathing Recovery exercise
                </li>
                <li>
                  If a client fails to heed advice regarding breathing and symptoms don't improve, consider whether they are committed to fully healing
                </li>
                <li>
                  <strong>Triggering Response:</strong> On some occasions, breathing exercises can be stressful to the nervous system. If this occurs, use the <strong>Nociceptive Threat Assessment</strong> to clear the nervous system's negative response before continuing
                </li>
                <li>
                  There needs to be a balance of shared responsibility, but ultimately the client must drive their own healing process
                </li>
              </ul>
            </AlertDescription>
          </Alert>

          <Card className="border-slate-200 bg-slate-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen size={20} className="text-slate-700" />
                Reference Books
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
                <BookOpen size={20} className="text-indigo-600 flex-shrink-0" />
                <div>
                  <p className="font-bold text-slate-900">The Oxygen Advantage</p>
                  <p className="text-sm text-slate-600">by Patrick McKeown</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
                <BookOpen size={20} className="text-indigo-600 flex-shrink-0" />
                <div>
                  <p className="font-bold text-slate-900">The Breathing Cure</p>
                  <p className="text-sm text-slate-600">by Patrick McKeown</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Close
          </Button>
          <Button 
            onClick={() => {
              window.print();
            }}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700"
          >
            Print Resources
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BoltResourcesModal;