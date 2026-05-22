"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { format, isToday, differenceInSeconds, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { safeParse } from "@/utils/safe-json";
import { showSuccess, showError } from "@/utils/toast";
import { BRAIN_REFLEX_POINTS } from "@/data/brain-reflex-data";
import { OUTLINE_ITEMS } from "@/components/crm/document-view/DocumentSidebar";

interface UseSessionDocumentStateProps {
  appointment: any;
  onUpdate: () => void;
  saveField: (field: string, value: any) => Promise<void>;
  updatePriorityPattern: (category: string, itemName: string, status: 'Clear' | 'Inhibited' | null, side?: 'L' | 'R') => Promise<void>;
}

export function useSessionDocumentState({
  appointment,
  onUpdate,
  saveField,
  updatePriorityPattern
}: UseSessionDocumentStateProps) {
  const [lastSaved, setLastSaved] = useState<Date>(new Date());
  const [openGuides, setOpenGuides] = useState<Record<string, boolean>>({});
  const [activeSection, setActiveSection] = useState<string>("p-sec");
  const [currentMuscleTests, setCurrentMuscleTests] = useState<any[]>([]);
  const [loadingMuscles, setLoadingMuscles] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [allAppointments, setAllAppointments] = useState<any[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);

  // Full Screen State
  const [isFullScreen, setIsFullScreen] = useState(() => {
    return localStorage.getItem('antigravity_fullscreen') === 'true';
  });

  // Quick Timer State
  const [activeTimerDuration, setActiveTimerDuration] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const quickTimerRef = useRef<NodeJS.Timeout | null>(null);

  const pattern = useMemo(() => safeParse(appointment.priority_pattern, {} as any), [appointment.priority_pattern]);

  const fetchCurrentMuscleTests = useCallback(async () => {
    if (!appointment.id || appointment.id.includes('00000000')) {
      setLoadingMuscles(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('muscle_tests')
        .select('*')
        .eq('appointment_id', appointment.id);
      if (!error && data) {
        setCurrentMuscleTests(data);
      }
    } catch (err) {
      console.error("Error fetching current muscle tests:", err);
    } finally {
      setLoadingMuscles(false);
    }
  }, [appointment.id]);

  const fetchAllAppointments = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          date,
          status,
          tag,
          clients (
            id,
            name
          )
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (error) throw error;
      setAllAppointments(data || []);
    } catch (err) {
      console.error("Error fetching appointments for switcher:", err);
    } finally {
      setLoadingAppointments(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentMuscleTests();
    fetchAllAppointments();
  }, [appointment.id, fetchCurrentMuscleTests, fetchAllAppointments]);

  // Live Clock & Timer Effect
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const handleFullScreenChange = () => {
      setIsFullScreen(localStorage.getItem('antigravity_fullscreen') === 'true');
    };

    window.addEventListener('antigravity_fullscreen_change', handleFullScreenChange);

    return () => {
      clearInterval(clockTimer);
      window.removeEventListener('antigravity_fullscreen_change', handleFullScreenChange);
      if (quickTimerRef.current) clearInterval(quickTimerRef.current);
    };
  }, []);

  const toggleFullScreen = useCallback(() => {
    const nextState = !isFullScreen;
    setIsFullScreen(nextState);
    localStorage.setItem('antigravity_fullscreen', String(nextState));
    window.dispatchEvent(new Event('antigravity_fullscreen_change'));
    showSuccess(nextState ? "Full Screen Mode Enabled" : "Full Screen Mode Disabled");
  }, [isFullScreen]);

  const startQuickTimer = useCallback((duration: number) => {
    if (quickTimerRef.current) clearInterval(quickTimerRef.current);
    setActiveTimerDuration(duration);
    setTimeLeft(duration);
    
    quickTimerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(quickTimerRef.current!);
          setActiveTimerDuration(null);
          showSuccess("Timer complete!");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const stopQuickTimer = useCallback(() => {
    if (quickTimerRef.current) clearInterval(quickTimerRef.current);
    setActiveTimerDuration(null);
    setTimeLeft(0);
  }, []);

  const formatCountdown = useCallback((seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const overallProgressPercent = useMemo(() => {
    const elapsedSeconds = differenceInSeconds(currentTime, new Date(appointment.date));
    const totalDurationSeconds = 60 * 60; // 60 minutes
    return Math.min(100, Math.max(0, (elapsedSeconds / totalDurationSeconds) * 100));
  }, [appointment.date, currentTime]);

  const metadata = useMemo(() => {
    if (!appointment.metadata) return {};
    if (typeof appointment.metadata === 'string') {
      return safeParse(appointment.metadata, {});
    }
    return appointment.metadata;
  }, [appointment.metadata]);

  const updateMetadataFields = useCallback(async (updates: Record<string, any>) => {
    const newMetadata = { ...metadata, ...updates };
    await saveField('metadata', newMetadata);
    setLastSaved(new Date());
    onUpdate();
  }, [metadata, saveField, onUpdate]);

  // Set up real-time scroll listener to track active section on scroll
  useEffect(() => {
    const scrollContainer = document.getElementById('main-scroll-container');
    if (!scrollContainer) return;

    const handleScroll = () => {
      const scrollContainerRect = scrollContainer.getBoundingClientRect();
      const threshold = scrollContainerRect.top + 120; // 120px offset from top of container

      let active = OUTLINE_ITEMS[0].id;

      for (const item of OUTLINE_ITEMS) {
        const el = document.getElementById(item.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= threshold) {
            active = item.id;
          } else {
            break; // Stop once we find a section below the threshold
          }
        }
      }
      setActiveSection(active);
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    // Run once initially to set correct active section
    handleScroll();

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    const scrollContainer = document.getElementById('main-scroll-container');
    if (el && scrollContainer) {
      const yOffset = -100; // Offset to account for sticky header
      const y = el.getBoundingClientRect().top + scrollContainer.scrollTop + yOffset;
      scrollContainer.scrollTo({ top: y, behavior: 'smooth' });
    }
  }, []);

  const toggleGuide = useCallback((title: string) => {
    setOpenGuides(prev => ({ ...prev, [title]: !prev[title] }));
  }, []);

  // Get sorted list of brain zone names for the dropdowns (excluding Cranial Nerves)
  const brainZoneOptions = useMemo(() => {
    return BRAIN_REFLEX_POINTS
      .filter(p => p.category === 'Cortical' || p.category === 'Subcortical')
      .map(p => {
        const displayName = p.name.includes(':') ? p.name.split(':')[0].trim() : p.name;
        return { id: p.id, name: displayName, category: p.category };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  // Create a unified pattern that merges priority_pattern JSON and muscle_tests table
  const unifiedPattern = useMemo(() => {
    const combined = { ...pattern };
    if (!combined.muscles) combined.muscles = {};
    
    currentMuscleTests.forEach(test => {
      combined.muscles[test.muscle_name] = test.status; // Keep exact status: 'Normotonic', 'Inhibition', 'Hypertonic', etc.
    });
    
    return combined;
  }, [pattern, currentMuscleTests]);

  // Extract all currently inhibited findings from the unified pattern
  const inhibitedFindings = useMemo(() => {
    const list: string[] = [];
    Object.entries(unifiedPattern).forEach(([category, items]: [string, any]) => {
      Object.entries(items).forEach(([name, status]) => {
        if (status === 'Inhibited' || status === 'Inhibition' || status === 'Hypertonic') {
          list.push(name);
        }
      });
    });
    return list.sort();
  }, [unifiedPattern]);

  const handleTogglePatternItem = useCallback((category: string, name: string, nextStatus: string, side?: 'L' | 'R') => {
    const fullName = side ? `${name} (${side})` : name;

    if (category === 'muscles') {
      const dbStatus = nextStatus === 'Clear' ? 'Normotonic' : nextStatus === 'Inhibited' ? 'Inhibition' : 'Hypertonic';
      const existing = currentMuscleTests.find(t => t.muscle_name === fullName);
      
      const runUpdate = async () => {
        try {
          if (existing) {
            const { error } = await supabase
              .from('muscle_tests')
              .update({ status: dbStatus })
              .eq('id', existing.id);
            if (error) throw error;
          } else {
            const { data: { user } } = await supabase.auth.getUser();
            const { error } = await supabase
              .from('muscle_tests')
              .insert({
                user_id: user?.id,
                appointment_id: appointment.id,
                muscle_name: fullName,
                status: dbStatus
              });
            if (error) throw error;
          }
          await fetchCurrentMuscleTests();
          showSuccess(`${fullName} marked as ${nextStatus}`);
        } catch (err) {
          showError("Failed to update muscle status");
        }
        setLastSaved(new Date());
        onUpdate();
      };
      runUpdate();
    } else {
      const runUpdatePattern = async () => {
        await updatePriorityPattern(category, name, nextStatus === 'Clear' ? 'Clear' : 'Inhibited', side);
        setLastSaved(new Date());
        onUpdate();
      };
      runUpdatePattern();
    }
  }, [appointment.id, currentMuscleTests, fetchCurrentMuscleTests, onUpdate, updatePriorityPattern]);

  // Group appointments for the dropdown switcher
  const groupedAppointments = useMemo(() => {
    const todayList: any[] = [];
    const upcomingList: any[] = [];
    const pastList: any[] = [];

    allAppointments.forEach(app => {
      const appDate = new Date(app.date);
      if (isToday(appDate)) {
        todayList.push(app);
      } else if (appDate > new Date()) {
        upcomingList.push(app);
      } else {
        pastList.push(app);
      }
    });

    return {
      today: todayList,
      upcoming: upcomingList,
      past: pastList.reverse().slice(0, 10) // Show last 10 past sessions
    };
  }, [allAppointments]);

  return {
    lastSaved,
    setLastSaved,
    openGuides,
    activeSection,
    loadingMuscles,
    currentTime,
    isFullScreen,
    activeTimerDuration,
    timeLeft,
    loadingAppointments,
    toggleFullScreen,
    startQuickTimer,
    stopQuickTimer,
    formatCountdown,
    overallProgressPercent,
    metadata,
    updateMetadataFields,
    scrollTo,
    toggleGuide,
    brainZoneOptions,
    unifiedPattern,
    inhibitedFindings,
    handleTogglePatternItem,
    groupedAppointments,
    fetchAllAppointments,
    fetchCurrentMuscleTests
  };
}