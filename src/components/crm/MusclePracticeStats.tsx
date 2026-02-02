"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Dumbbell, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { fetchMusclePracticeStats, MuscleStat } from "@/utils/muscle-stats";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const MusclePracticeStats = () => {
  const [stats, setStats] = useState<MuscleStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const data = await fetchMusclePracticeStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to load muscle practice stats:", error);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading) {
    return (
      <Card className="border-none shadow-lg rounded-2xl bg-white">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2 text-slate-900">
            <Dumbbell size={24} className="text-indigo-500" /> Muscle Practice Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-indigo-500" size={24} />
        </CardContent>
      </Card>
    );
  }

  const totalMuscles = stats.length;
  const topMuscles = stats.slice(0, 5);

  return (
    <Card className="border-none shadow-lg rounded-2xl bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold flex items-center gap-2 text-slate-900">
          <Dumbbell size={24} className="text-indigo-600" /> Muscle Practice Insights
        </CardTitle>
        <CardDescription>
          Analysis of muscles tested {totalMuscles > 0 ? `(${totalMuscles} tracked)` : ''}. Shows the percentage of tests that resulted in non-Normotonic status (Inhibition, Hypertonic, Switching, Dysfunctional).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {totalMuscles === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <AlertTriangle size={32} className="mx-auto mb-3 text-amber-400" />
            <p className="font-medium">No sufficient muscle test data found.</p>
            <p className="text-sm">Start logging muscle tests in your appointments to see insights (requires 5+ tests per muscle).</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                <p className="text-sm font-bold text-indigo-900">Muscle</p>
                <p className="text-sm font-bold text-indigo-900">Dysfunction Rate</p>
            </div>
            {topMuscles.map((stat, index) => {
              const progress = stat.dysfunction_rate;
              const isHigh = progress >= 50;
              const isMedium = progress >= 25;

              const colorClass = isHigh ? "[&>div]:bg-red-500" : isMedium ? "[&>div]:bg-amber-500" : "[&>div]:bg-emerald-500";
              const icon = isHigh ? AlertTriangle : isMedium ? TrendingUp : CheckCircle2;
              const IconComponent = icon;

              return (
                <div key={stat.muscle_name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <IconComponent size={16} className={isHigh ? "text-red-500" : isMedium ? "text-amber-500" : "text-emerald-500"} />
                        <span className="font-medium text-slate-800">{stat.muscle_name}</span>
                        <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-500">
                            {stat.total_tests} tests
                        </Badge>
                    </div>
                    <span className={cn(
                        "font-bold text-lg tabular-nums",
                        isHigh ? "text-red-600" : isMedium ? "text-amber-600" : "text-emerald-600"
                    )}>
                      {stat.dysfunction_rate}%
                    </span>
                  </div>
                  <Progress 
                    value={progress} 
                    className={cn("h-2", colorClass)}
                  />
                  <p className="text-xs text-slate-500">
                    {stat.non_normotonic_count} non-Normotonic results.
                  </p>
                </div>
              );
            })}
            {totalMuscles > 5 && (
                <p className="text-xs text-slate-400 text-center pt-2">
                    ...and {totalMuscles - 5} more muscles tracked.
                </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MusclePracticeStats;