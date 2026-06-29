
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ShieldAlert, ArrowRight, RefreshCw, CheckCircle2, Zap, 
  Brain, ChevronDown, ChevronUp, Save, Loader2, BookOpen,
  History, Trash2, Sparkles, RotateCcw, Volume2, Mic, Headphones,
  Gauge
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { format } from "date-fns";

interface LimitingBeliefsToolProps {
  singlePage?: boolean;
  clientId?: string;
  appointmentId?: string;
}

const BELIEF_STEPS = ["A", "B", "C", "D", "E", "F"];
const STEP_PROMPTS: Record<string, string> = {
  A: "Feel yourself believing (BELIEF)... what does it feel like?",
  B: "Feel (LAST RESPONSE)... what does (LAST RESPONSE) feel like?",
  C: "What would you rather feel?",
  D: "What would (DESIRED FEELING) feel like?",
  E: "Feel (LAST RESPONSE)... what does (LAST RESPONSE) feel like?",
  F: "Do you still believe (BELIEF)?",
};

const STEP_LABELS: Record<string, string> = {
  A: "Feel the belief in your body",
  B: "Follow the sensation deeper",
  C: "Identify the desired state",
  D: "Embody the alternative",
  E: "Deepen the new feeling",
  F: "Check if the belief still holds",
};

const CHECK_QUESTIONS = [
  "Does any part of you still believe (BELIEF)?",
  "Do you feel you may believe (BELIEF) again in the future?",
  "Is there any scenario in which you would still believe (BELIEF)?",
  "Do you now know (OPPOSITE OF BELIEF)?",
];

const CORE_BELIEFS = [
  "I am not safe.",
  "I am not good enough.",
  "I am unworthy.",
  "I am alone.",
  "I am bad.",
  "Being seen is dangerous.",
  "I don't deserve to be loved.",
  "My needs are not important.",
  "I can't rest or be still.",
];

const LimitingBeliefsTool = ({ singlePage = false, clientId, appointmentId }: LimitingBeliefsToolProps = {}) => {
  const [belief, setBelief] = useState("");
  const [oppositeBelief, setOppositeBelief] = useState("");
  const [stepIndex, setStepIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [currentResponse, setCurrentResponse] = useState("");
  const [loopCount, setLoopCount] = useState(0);
  const [loopHistory, setLoopHistory] = useState<Array<{loopCount: number, responses: Record<string, string>}>>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [checkResults, setCheckResults] = useState<Record<number, boolean>>({});
  const [activeCheckIndex, setActiveCheckIndex] = useState(-1);
  const [isComplete, setIsComplete] = useState(false);
  const [showReference, setShowReference] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [pastSessions, setPastSessions] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [rate, setRate] = useState(() => {
    const saved = localStorage.getItem('limiting_beliefs_rate');
    return saved ? parseFloat(saved) : 0.85;
  });
  const [preferredVoiceName, setPreferredVoiceName] = useState(() => {
    return localStorage.getItem('limiting_beliefs_voice') || 'Samantha';
  });
  const [handsfree, setHandsfree] = useState(() => {
    const saved = localStorage.getItem('limiting_beliefs_handsfree');
    return saved ? JSON.parse(saved) : true;
  });
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [stepHistory, setStepHistory] = useState<Array<{stepIndex: number, loopCount: number, response: string}>>([]);
  const [loopVariant, setLoopVariant] = useState(0); // 0=original, 1-4 = which check Q triggered re-loop
  const [scenarioText, setScenarioText] = useState('');
  const [showScenarioInput, setShowScenarioInput] = useState(false);
  const recognitionRef = useRef<any>(null);
  const handsfreeRecRef = useRef<any>(null);
  const handsfreeSilenceRef = useRef<ReturnType<typeof setTimeout>>();
  const handsfreeActiveRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const stepRef = useRef(stepIndex);
  const loopRef = useRef(loopCount);
  const responsesRef = useRef(responses);
  const beliefRef = useRef(belief);
  const oppositeBeliefRef = useRef(oppositeBelief);
  const loopVariantRef = useRef(loopVariant);
  const scenarioTextRef = useRef(scenarioText);
  const handsfreeRef = useRef(handsfree);
  const startHandsfreeFnRef = useRef<() => void>(() => {});
  const ttsPausedRef = useRef(false);
  const isCheckingRef = useRef(isChecking);
  const checkResultsRef = useRef(checkResults);
  const activeCheckIdxRef = useRef(activeCheckIndex);
  const loopHistoryRef = useRef(loopHistory);
  stepRef.current = stepIndex;
  loopRef.current = loopCount;
  responsesRef.current = responses;
  loopHistoryRef.current = loopHistory;
  beliefRef.current = belief;
  oppositeBeliefRef.current = oppositeBelief;
  loopVariantRef.current = loopVariant;
  scenarioTextRef.current = scenarioText;
  handsfreeRef.current = handsfree;
  isCheckingRef.current = isChecking;
  checkResultsRef.current = checkResults;
  activeCheckIdxRef.current = activeCheckIndex;

  const currentStep = BELIEF_STEPS[stepIndex % 6];
  const lastResponse = stepIndex > 0 ? responses[`${BELIEF_STEPS[(stepIndex - 1) % 6]}`] : belief;
  const isLastStep = currentStep === "F";
  const canGoBack = stepHistory.length > 0 && !isChecking;
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = () => {
      const voices = window.speechSynthesis.getVoices();
      console.log('TTS: voices loaded count=%d full list=%O', voices.length, voices.map(v => ({ name: v.name, lang: v.lang })));
      if (voices.length === 0) return;
      const english = voices.filter(v => v.lang.startsWith('en'));
      const badNames = ['Premium', 'Enhanced', 'Moira', 'Veena', 'Tom', 'Albert', 'Junior', 'Bad', 'Cellos', 'Organ', 'Bells', 'Trinoids', 'Pipe', 'Hysterical'];
      const good = english.filter(v => !badNames.some(b => v.name.includes(b)));
      console.log('TTS: good voices=%O', good.map(v => ({ name: v.name, lang: v.lang })));
      setAvailableVoices(good);
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  // Persist hands-free preference
  useEffect(() => {
    localStorage.setItem('limiting_beliefs_handsfree', JSON.stringify(handsfree));
  }, [handsfree]);

  const cycleVoice = () => {
    if (availableVoices.length === 0) return;
    const idx = availableVoices.findIndex(v => preferredVoiceName && v.name.includes(preferredVoiceName));
    const next = availableVoices[(idx + 1) % availableVoices.length];
    setPreferredVoiceName(next.name);
    localStorage.setItem('limiting_beliefs_voice', next.name);
  };

  const speakTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const speakingRef = useRef(false);
  const speakCallIdRef = useRef(0);
  const speakScheduledRef = useRef(false);

  function speakText(text: string, label = '') {
    const callId = ++speakCallIdRef.current;
    if (!('speechSynthesis' in window)) {
      console.log('TTS: [%d] speakText NO SPEECH SYNTHESIS text="%s" label="%s"', callId, text.slice(0, 50), label);
      return;
    }
    if (speakingRef.current || speakScheduledRef.current) {
      console.log('TTS: [%d] speakText DROPPED text="%s" label="%s"', callId, text.slice(0, 50), label);
      return;
    }
    speakScheduledRef.current = true;
    // Chrome workaround: cancel + speak in same microtask drops utterance.
    // Cancel now, defer speak() to next task via setTimeout.
    window.speechSynthesis.cancel();
    console.log('TTS: [%d] speakText cancelled, scheduling speak in 30ms text="%s" label="%s"', callId, text.slice(0, 50), label);
    setTimeout(() => {
      speakScheduledRef.current = false;
      speakingRef.current = true;
      setIsSpeaking(true);
      console.log('TTS: [%d] speakText SPEAKING text="%s" label="%s" rate=%s voice=%s', callId, text.slice(0, 50), label, rate, preferredVoiceName);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.pitch = 1;
      const match = availableVoices.find(v => preferredVoiceName && v.name.includes(preferredVoiceName));
      if (match) {
        utterance.voice = match;
        console.log('TTS: [%d] assigned voice=%s', callId, match.name);
      } else {
        console.log('TTS: [%d] no voice match for "%s" — using default', callId, preferredVoiceName);
      }
      utterance.onstart = () => {
        console.log('TTS: [%d] onstart speakingRef=%o', callId, speakingRef.current);
        // Pause hands-free mic during TTS to prevent feedback loop
        if (handsfreeRef.current) {
          clearTimeout(handsfreeSilenceRef.current);
          ttsPausedRef.current = true;
          handsfreeRecRef.current?.stop();
        }
      };
      utterance.onend = () => {
        console.log('TTS: [%d] onend speakingRef=%o', callId, speakingRef.current);
        speakingRef.current = false;
        setIsSpeaking(false);
        // Resume hands-free mic after TTS ends
        if (handsfreeRef.current && handsfreeActiveRef.current) {
          ttsPausedRef.current = false;
          setTimeout(() => startHandsfreeFnRef.current(), 100);
        }
      };
      utterance.onerror = (e) => {
        console.log('TTS: [%d] onerror error=%O speakingRef=%o', callId, e, speakingRef.current);
        speakingRef.current = false;
        setIsSpeaking(false);
      };
      window.speechSynthesis.speak(utterance);
    }, 30);
  }

  // Closure-safe prompt resolver (reads from refs — safe in timeouts/effects)
  const resolveStepPrompt = (step: string, lastResponse?: string): string => {
    const b = beliefRef.current;
    const o = oppositeBeliefRef.current;
    const v = loopVariantRef.current;
    const s = scenarioTextRef.current;

    let beliefText = b;
    let oppositeText = o;

    if (v === 4) {
      beliefText = o;
      oppositeText = b;
    } else if (v === 3) {
      beliefText = b + (s ? ` in ${s}` : " in some scenario");
    } else if (v === 2) {
      beliefText = b + " in the future";
    }

    let template = STEP_PROMPTS[step];
    if (v === 4 && step === 'F') {
      template = "Do you now know (BELIEF)?";
    }

    return template
      .replace(/\(BELIEF\)/g, beliefText)
      .replace(/\(OPPOSITE OF BELIEF\)/g, oppositeText)
      .replace(/\(LAST RESPONSE\)/g, lastResponse || "...")
      .replace(/\(DESIRED FEELING\)/g, responsesRef.current["C"] || "...");
  };

  // Render-safe prompt resolver (reads state directly)
  const getCurrentPrompt = (step: string, overrideLastResponse?: string): string => {
    let beliefText = belief;
    let oppositeText = oppositeBelief;

    if (loopVariant === 4) {
      beliefText = oppositeBelief;
      oppositeText = belief;
    } else if (loopVariant === 3) {
      beliefText = belief + (scenarioText ? ` in ${scenarioText}` : " in some scenario");
    } else if (loopVariant === 2) {
      beliefText = belief + " in the future";
    }

    const stepIdx = BELIEF_STEPS.indexOf(step as typeof BELIEF_STEPS[number]);
    const prevStep = stepIdx > 0 ? BELIEF_STEPS[stepIdx - 1] : null;
    const prevResponse = prevStep ? responses[prevStep] : null;

    let template = STEP_PROMPTS[step];
    if (loopVariant === 4 && step === 'F') {
      template = "Do you now know (BELIEF)?";
    }

    return template
      .replace(/\(BELIEF\)/g, beliefText)
      .replace(/\(OPPOSITE OF BELIEF\)/g, oppositeText)
      .replace(/\(LAST RESPONSE\)/g, overrideLastResponse || prevResponse || belief)
      .replace(/\(DESIRED FEELING\)/g, responses["C"] || "...");
  };

  const currentPrompt = belief && !isChecking
    ? getCurrentPrompt(currentStep)
    : null;

  // When entering Q3 variant loop, show scenario input (only once per variant change)
  useEffect(() => {
    if (loopVariant === 3 && !scenarioText && stepIndex === 0 && !showScenarioInput) {
      setShowScenarioInput(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loopVariant, stepIndex]);

  // Auto-speak on belief typing (debounced 500ms)
  useEffect(() => {
    if (!belief || isChecking) {
      console.log('TTS: debounce SKIP belief=%s isChecking=%o', belief, isChecking);
      return;
    }
    console.log('TTS: debounce SET timeout belief="%s"', belief);
    clearTimeout(speakTimeoutRef.current);
    speakTimeoutRef.current = setTimeout(() => {
      const prompt = getCurrentPrompt(currentStep);
      console.log('TTS: debounce FIRE prompt="%s"', prompt.slice(0, 60));
      speakText(prompt, 'debounce-belief');
    }, 500);
    return () => {
      console.log('TTS: debounce CLEAR (belief changed or unmount)');
      clearTimeout(speakTimeoutRef.current);
    };
  }, [belief]);

  const stopSpeaking = () => {
    const stack = new Error().stack?.split('\n').slice(2, 5).join(' | ') || '';
    console.log('TTS: stopSpeaking called from: %s', stack);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    speakingRef.current = false;
    setIsSpeaking(false);
  };

  

  // Hands-free mode: continuous listening + silence auto-advance
  // Start/stop hands-free mic when hands-free mode toggles
  useEffect(() => {
    if (!handsfree) {
      handsfreeActiveRef.current = false;
      clearTimeout(handsfreeSilenceRef.current);
      handsfreeRecRef.current?.stop();
      return;
    }
    // Don't start mic yet — wait for a belief (handled by the belief watcher below)
  }, [handsfree]);

  // Start mic when belief appears, stop when cleared
  useEffect(() => {
    if (!handsfreeRef.current) return;
    if (!belief) {
      handsfreeActiveRef.current = false;
      clearTimeout(handsfreeSilenceRef.current);
      handsfreeRecRef.current?.stop();
      return;
    }
    if (handsfreeActiveRef.current) return; // already running
    handsfreeActiveRef.current = true;
    stopSpeaking();
    recognitionRef.current?.stop();
    setIsListening(false);

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setHandsfree(false);
      showError("Speech recognition not supported in this browser.");
      return;
    }

    const start = () => {
      if (!handsfreeActiveRef.current) return;
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        const last = event.results[event.results.length - 1];
        if (last.isFinal) {
          const text = last[0].transcript.trim();
          if (!text || !handsfreeActiveRef.current) return;
          setCurrentResponse(text);

          clearTimeout(handsfreeSilenceRef.current);
          handsfreeSilenceRef.current = setTimeout(() => {
            if (!handsfreeActiveRef.current) return;
            stopSpeaking();

            if (isCheckingRef.current) {
              // Verification check mode — user said yes/no to a check question
              const isYes = /^(yes|yeah|y|correct|true)/i.test(text);
              if (isYes || /^(no|nah|nope|not|false)/i.test(text)) {
                answerCheckQuestion(isYes);
              }
              setCurrentResponse('');
              return;
            }

            const s = stepRef.current;
            const step = BELIEF_STEPS[s % 6];

            setStepHistory(prev => [...prev, { stepIndex: s, loopCount: loopRef.current, response: '' }]);

                if (step === 'F') {
              const isNo = /^(no|nah|nope|not really|it'?s gone|shifted|cleared)/i.test(text);
              if (isNo) {
                setResponses(prev => ({ ...prev, F: text }));
                setCurrentResponse('');
                setIsChecking(true);
                setLoopVariant(0); // reset to original for fresh check
              } else {
                setCurrentResponse('');
                restartLoop(text);
                const nextPrompt = resolveStepPrompt("A", beliefRef.current);
                speakText(nextPrompt, 'handsfree-loop');
              }
            } else {
              const nextStep = BELIEF_STEPS[s + 1];
              setResponses(prev => ({ ...prev, [step]: text }));
              setCurrentResponse('');
              setStepIndex(prev => prev + 1);
              const nextPrompt = resolveStepPrompt(nextStep, text);
              speakText(nextPrompt, 'handsfree-advance');
            }
          }, 1500);
        }
      };

      rec.onerror = () => {
        if (handsfreeActiveRef.current) setTimeout(start, 500);
      };
      rec.onend = () => {
        if (ttsPausedRef.current) {
          ttsPausedRef.current = false;
          return;
        }
        if (handsfreeActiveRef.current) setTimeout(start, 500);
      };
      rec.start();
      handsfreeRecRef.current = rec;
    };

    startHandsfreeFnRef.current = start;
    start();
    return () => {
      handsfreeActiveRef.current = false;
      clearTimeout(handsfreeSilenceRef.current);
      handsfreeRecRef.current?.stop();
    };
  }, [belief]);

  const startDictation = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showError("Speech recognition not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setCurrentResponse(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
      inputRef.current?.focus();
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  useEffect(() => {
    fetchPastSessions();
  }, [clientId]);

  useEffect(() => {
    return () => {
      console.log('TTS: cleanup effect cancelling');
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      recognitionRef.current?.stop();
      handsfreeRecRef.current?.stop();
    };
  }, []);

  const restartLoop = (keepResponse?: string) => {
    const snap = responsesRef.current;
    if (Object.keys(snap).length > 0) {
      setLoopHistory(prev => [...prev, { loopCount: loopRef.current, responses: { ...snap } }]);
    }
    setLoopCount(prev => prev + 1);
    setStepIndex(0);
    setResponses(prev => {
      const next = { F: prev.F };
      if (keepResponse) next.F = keepResponse;
      return next;
    });
    scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const clearLoopResponses = () => {
    const snap = responsesRef.current;
    if (Object.keys(snap).length > 0) {
      setLoopHistory(prev => [...prev, { loopCount: loopRef.current, responses: { ...snap } }]);
    }
    setStepIndex(0);
    setResponses(prev => {
      const next: Record<string, string> = {};
      if (prev.F) next.F = prev.F;
      return next;
    });
  };

  const fetchPastSessions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase
      .from('limiting_belief_sessions')
      .select('*')
      .eq('user_id', user.id);

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data } = await query
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setPastSessions(data);
  };

  const handleNext = () => {
    if (!currentResponse.trim() && currentStep !== "F") return;
    const answerText = currentResponse;
    console.log('TTS: handleNext step=%s response="%s" handsfree=%o', currentStep, answerText, handsfree);
    stopSpeaking();
    setStepHistory(prev => [...prev, { stepIndex, loopCount, response: answerText }]);
    setResponses(prev => ({ ...prev, [currentStep]: answerText }));
    setCurrentResponse("");
    
    if (isLastStep && answerText.toLowerCase().includes("no")) {
      setIsChecking(true);
      setLoopVariant(0);
    } else if (isLastStep && !answerText.toLowerCase().includes("no")) {
      restartLoop(answerText);
    } else {
      const nextStep = BELIEF_STEPS[stepIndex + 1];
      setStepIndex(prev => prev + 1);
      const nextPrompt = getCurrentPrompt(nextStep, answerText);
      console.log('TTS: handleNext nextStep=%s nextPrompt="%s"', nextStep, nextPrompt.slice(0, 60));
      speakText(nextPrompt, 'handleNext');
    }
  };

  const handleFQuick = (answer: boolean) => {
    const val = answer ? "Yes" : "No";
    console.log('TTS: handleFQuick answer=%s handsfree=%o', val, handsfree);
    stopSpeaking();
    setStepHistory(prev => [...prev, { stepIndex, loopCount, response: val }]);
    setResponses(prev => ({ ...prev, [currentStep]: val }));
    setCurrentResponse("");
    if (!answer) {
      setIsChecking(true);
      setLoopVariant(0);
    } else {
      restartLoop(val);
    }
  };

  const goBack = () => {
    if (stepHistory.length === 0) return;
    stopSpeaking();
    const prev = stepHistory[stepHistory.length - 1];
    setStepHistory(prev => prev.slice(0, -1));
    const stepKey = BELIEF_STEPS[stepIndex % 6];
    setResponses(r => {
      const next = { ...r };
      delete next[stepKey];
      return next;
    });
    setCurrentResponse(prev.response);
    setStepIndex(prev.stepIndex);
    setLoopCount(prev.loopCount);
  };

  // Find the first unresolved check question
  // For Q1-3 (index 0-2): answered No (false) = resolved; Yes (true) = still stuck → re-ask
  // For Q4  (index 3):   answered Yes (true) = resolved; No (false) = still stuck → re-ask
  const isUnresolved = (idx: number, value: boolean | undefined) => {
    if (value === undefined) return true;               // never asked
    if (idx === 3) return value === false;               // Q4: No = still stuck
    return value === true;                                // Q1-3: Yes = still stuck
  };

  const nextCheckIndex = (results: Record<number, boolean>) => {
    for (let i = 0; i < CHECK_QUESTIONS.length; i++) {
      if (isUnresolved(i, results[i])) return i;
    }
    return -1;
  };

  const isResolvedAnswer = (idx: number, value: boolean) => {
    if (idx === 3) return value === true;  // Q4: Yes = resolved
    return value === false;                 // Q1-3: No = resolved
  };

  const answerCheckQuestion = (result: boolean) => {
    const idx = activeCheckIndex;
    if (idx < 0) return;
    stopSpeaking();
    const updated = { ...checkResults, [idx]: result };
    setCheckResults(updated);

    if (!isResolvedAnswer(idx, result)) {
      // "Still stuck" answer — this aspect persists, go through A-F loop again
      // Set variant so loop prompts reflect this question's angle
      const variant = idx + 1;
      setLoopVariant(variant);
      if (variant === 3) {
        // Q3: show scenario input
        setShowScenarioInput(true);
      }
      setIsChecking(false);
      setActiveCheckIndex(-1);
      clearLoopResponses();
      setTimeout(() => {
        const prompt = resolveStepPrompt("A", beliefRef.current);
        speakText(prompt, 'check-loop');
      }, 100);
    } else {
      // Resolved — move to next unresolved question
      const next = nextCheckIndex(updated);
      if (next >= 0) {
        setActiveCheckIndex(next);
        setTimeout(() => speakCheckQuestion(next), 100);
      } else {
        // All questions resolved — belief cleared
        setIsComplete(true);
        setActiveCheckIndex(-1);
        setIsChecking(false);
      }
    }
  };

  const speakCheckQuestion = (index: number) => {
    if (index >= CHECK_QUESTIONS.length) return;
    const prompt = CHECK_QUESTIONS[index]
      .replace(/\(BELIEF\)/g, belief)
      .replace(/\(OPPOSITE OF BELIEF\)/g, oppositeBelief);
    speakText(prompt, 'check-question');
  };

  const revertCheckAnswer = (index: number) => {
    const updated = { ...checkResults };
    delete updated[index];
    setCheckResults(updated);
    setActiveCheckIndex(index);
    setIsComplete(false);
    setIsChecking(true);
    setLoopVariant(0);
    setTimeout(() => speakCheckQuestion(index), 200);
  };

  // Enter verification check — ask first unresolved question
  useEffect(() => {
    if (isChecking && activeCheckIndex < 0) {
      const first = nextCheckIndex(checkResults);
      if (first >= 0) {
        setActiveCheckIndex(first);
        setTimeout(() => speakCheckQuestion(first), 200);
      }
    }
  }, [isChecking]);

  const allChecksClear = () => {
    if (Object.keys(checkResults).length === 0) return false;
    for (const [key, value] of Object.entries(checkResults)) {
      const idx = parseInt(key);
      if (!isResolvedAnswer(idx, value)) return false;
    }
    return true;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const payload = {
        user_id: user.id,
        client_id: clientId || null,
        appointment_id: appointmentId || null,
        problem: belief,
        limiting_belief: belief,
        positive_belief: oppositeBelief,
        dissolve_log: JSON.stringify({ responses, loopCount, history: [...loopHistory, { loopCount, responses }] }),
        check_belief_result: !allChecksClear,
        is_complete: allChecksClear,
      };

      if (sessionId) {
        await supabase.from('limiting_belief_sessions').update(payload).eq('id', sessionId);
      } else {
        const { data } = await supabase.from('limiting_belief_sessions').insert(payload).select().single();
        if (data) setSessionId(data.id);
      }
      showSuccess("Session saved");
      fetchPastSessions();
    } catch (e) {
      showError("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    stopSpeaking();
    setHandsfree(false);
    setBelief("");
    setOppositeBelief("");
    setStepIndex(0);
    setResponses({});
    setCurrentResponse("");
    setLoopCount(0);
    setLoopHistory([]);
    setIsChecking(false);
    setCheckResults({});
    setIsComplete(false);
    setSessionId(null);
    setStepHistory([]);
    setLoopVariant(0);
    setScenarioText('');
    setShowScenarioInput(false);
    clearTimeout(speakTimeoutRef.current);
  };

  const loadSession = (session: any) => {
    stopSpeaking();
    setStepHistory([]);
    const beliefText = session.limiting_belief || session.problem || "";
    setBelief(beliefText);
    setOppositeBelief(session.positive_belief || "");
    let loadedResponses: Record<string, string> = {};
    let loadedHistory: Array<{loopCount: number, responses: Record<string, string>}> = [];
    try {
      const parsed = JSON.parse(session.dissolve_log || "{}");
      if (parsed.responses) loadedResponses = parsed.responses;
      if (parsed.loopCount) setLoopCount(parsed.loopCount);
      if (parsed.history) loadedHistory = parsed.history;
    } catch {}
    setLoopHistory(loadedHistory);
    setResponses(loadedResponses);
    setSessionId(session.id);
    setIsComplete(session.is_complete);
    setIsChecking(false);
    setLoopVariant(0);
    setScenarioText('');
    setShowScenarioInput(false);
    setShowHistory(false);
    const nextStepIdx = BELIEF_STEPS.findIndex(s => !loadedResponses[s]);
    const resumeStep = nextStepIdx >= 0 ? nextStepIdx : 5;
    setStepIndex(resumeStep);
    // Speak the prompt for the step we're resuming at
    setTimeout(() => {
      const lastResponseText = resumeStep > 0 ? (loadedResponses[BELIEF_STEPS[resumeStep - 1]] || beliefText) : beliefText;
      const prompt = resolveStepPrompt(BELIEF_STEPS[resumeStep], lastResponseText);
      speakText(prompt, 'load-session');
    }, 100);
  };

  const deleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Delete this session?")) return;
    await supabase.from('limiting_belief_sessions').delete().eq('id', id);
    fetchPastSessions();
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-4">
      {/* Belief Setup */}
      <div ref={scrollRef} className="space-y-3">
        <div className="flex items-center gap-2">
          <ShieldAlert size={14} className="text-chart-destructive" />
          <h3 className="text-sm font-semibold text-foreground">Belief Shifting Protocol</h3>
          <Badge className="text-[9px] bg-muted text-muted-foreground border-border">A-F Somatic Loop</Badge>
        </div>

        <div className="space-y-2">
          <div>
            <label className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5 block">Limiting Belief</label>
            <div className="flex gap-2">
              <Input 
                placeholder='e.g. "I am not good enough"'
                value={belief}
                onChange={(e) => setBelief(e.target.value)}
                className="h-9 rounded-lg text-sm font-medium"
              />
              <Button variant="ghost" size="sm" onClick={() => setShowReference(!showReference)} className="h-9 w-9 shrink-0 rounded-lg">
                <BookOpen size={14} className="text-muted-foreground" />
              </Button>
            </div>
          </div>

          {showReference && (
            <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-2 animate-in fade-in duration-200">
              <p className="text-[10px] font-medium text-muted-foreground">Common limiting belief patterns</p>
              <div className="flex flex-wrap gap-1.5">
                {CORE_BELIEFS.map((b, i) => (
                  <button key={i} onClick={() => setBelief(b)} className={cn(
                    "text-[9px] px-1.5 py-0.5 rounded-md border transition-colors",
                    belief === b ? "border-chart-destructive bg-chart-destructive/10 text-chart-destructive font-medium" : "border-border bg-card text-muted-foreground hover:border-chart-destructive/30"
                  )}>
                    {b}
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-muted-foreground/60 leading-relaxed">A limiting belief is a state-dependent neural network formed to reduce uncertainty and protect the organism. They behave like primitive reflexes: ON or OFF.</p>
            </div>
          )}

          <div>
            <label className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5 block">Opposite / Desired Knowing</label>
            <Input 
              placeholder='e.g. "I am capable and enough"'
              value={oppositeBelief}
              onChange={(e) => setOppositeBelief(e.target.value)}
              className="h-9 rounded-lg text-sm font-medium"
            />
          </div>
        </div>
      </div>

      {/* A-F Loop Steps Preview (shown even without belief) */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <RefreshCw size={12} className={cn(belief ? "text-chart-primary" : "text-muted-foreground")} />
          <span className={cn("text-[10px] font-semibold uppercase tracking-wider", belief ? "text-chart-primary" : "text-muted-foreground")}>
            Dissolution Loop {loopCount > 0 && `(Loop ${loopCount + 1})`}
          </span>
        </div>

        <div className="grid grid-cols-6 gap-1.5">
          {BELIEF_STEPS.map((s, i) => {
            const isActive = belief && s === currentStep && !isChecking;
            const isDone = belief && !!responses[s];
            return (
              <div key={s} className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg border text-center transition-all",
                isActive ? "border-chart-destructive/30 bg-chart-destructive/5" :
                isDone ? "border-chart-emerald/30 bg-chart-emerald/5" :
                belief ? "border-border bg-card" :
                "border-dashed border-border/60 bg-muted/30 opacity-50"
              )}>
                <span className={cn(
                  "w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold",
                  isDone ? "bg-chart-emerald/20 text-chart-emerald" :
                  isActive ? "bg-chart-destructive/20 text-chart-destructive" :
                  "bg-muted text-muted-foreground"
                )}>{s}</span>
                <span className="text-[7px] leading-tight text-muted-foreground">{STEP_LABELS[s]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scenario input (Q3 variant: "in what scenario?") */}
      {showScenarioInput && (
        <Card className="border-chart-primary/30 bg-chart-primary/[0.03]">
          <CardContent className="p-3 space-y-2">
            <p className="text-xs font-medium text-foreground">What scenario still triggers this belief?</p>
            <p className="text-[10px] text-muted-foreground">Name the specific context, or leave blank and click "Generic" to use a general phrasing.</p>
            <div className="flex gap-2">
              <Input
                autoFocus
                placeholder='e.g. "at work", "with my family", "when I fail"'
                value={scenarioText}
                onChange={(e) => setScenarioText(e.target.value)}
                className="h-9 rounded-lg text-sm flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    stopSpeaking();
                    const val = e.currentTarget.value.trim();
                    setScenarioText(val);
                    setShowScenarioInput(false);
                    setTimeout(() => {
                      const prompt = getCurrentPrompt(currentStep);
                      speakText(prompt, 'scenario-set');
                    }, 50);
                  }
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  stopSpeaking();
                  setShowScenarioInput(false);
                  const prompt = getCurrentPrompt(currentStep);
                  speakText(prompt, 'scenario-set');
                }}
                className="h-9 rounded-lg text-[10px]"
              >
                Enter
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  stopSpeaking();
                  setScenarioText('');
                  setShowScenarioInput(false);
                  const prompt = getCurrentPrompt(currentStep);
                  speakText(prompt, 'scenario-set');
                }}
                className="h-9 rounded-lg text-[10px]"
              >
                Generic
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active A-F Loop Card */}
      {belief && !isChecking && (
        <div className="space-y-3">
          <Card className={cn(
            "border bg-card transition-all",
            isSpeaking && "border-chart-primary/40 shadow-sm shadow-chart-primary/5",
            handsfree && "border-chart-primary/30 bg-chart-primary/[0.02]"
          )}>
            <CardContent className="p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-foreground font-medium italic leading-relaxed flex-1">
                  "{currentPrompt}"
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => isSpeaking ? stopSpeaking() : speakText(currentPrompt || "", 'manual-button')}
                  disabled={handsfree}
                  className={cn(
                    "h-7 w-7 shrink-0 rounded-lg p-0",
                    isSpeaking ? "text-chart-primary bg-chart-primary/10" : "text-muted-foreground hover:text-foreground",
                    handsfree && "opacity-30 cursor-not-allowed"
                  )}
                  title={handsfree ? "Audio disabled in hands-free mode" : isSpeaking ? "Stop" : "Read aloud"}
                >
                  <Volume2 size={12} />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">Keep answers brief — emotion, body sensation, thought or mental image.</p>

              {currentStep === "F" ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={goBack}
                      disabled={!canGoBack}
                      className={cn(
                        "h-8 w-8 shrink-0 rounded-lg p-0",
                        canGoBack ? "text-muted-foreground hover:text-foreground" : "opacity-20 cursor-not-allowed"
                      )}
                      title={canGoBack ? "Back to previous step" : "No previous step"}
                    >
                      <ArrowRight size={14} className="rotate-180" />
                    </Button>
                    {loopVariant === 4 ? (
                      <>
                        <Button variant="outline" onClick={() => handleFQuick(false)} className="flex-1 h-8 rounded-lg border-chart-emerald text-chart-emerald font-medium text-[10px]">
                          Yes, I know it
                        </Button>
                        <Button variant="outline" onClick={() => handleFQuick(true)} className="flex-1 h-8 rounded-lg border-destructive text-destructive font-medium text-[10px]">
                          No, not yet
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="outline" onClick={() => handleFQuick(true)} className="flex-1 h-8 rounded-lg border-destructive text-destructive font-medium text-[10px]">
                          Yes, still believe it
                        </Button>
                        <Button variant="outline" onClick={() => handleFQuick(false)} className="flex-1 h-8 rounded-lg border-chart-emerald text-chart-emerald font-medium text-[10px]">
                          No, it's shifted
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={goBack}
                    disabled={!canGoBack}
                    className={cn(
                      "h-9 w-9 shrink-0 rounded-lg p-0",
                      canGoBack ? "text-muted-foreground hover:text-foreground" : "opacity-20 cursor-not-allowed"
                    )}
                    title={canGoBack ? "Back to previous step" : "No previous step"}
                  >
                    <ArrowRight size={14} className="rotate-180" />
                  </Button>
                  <Input
                    ref={inputRef}
                    value={currentResponse}
                    onChange={(e) => setCurrentResponse(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                    placeholder="Brief response..."
                    className={cn("h-9 rounded-lg text-sm font-medium flex-1", isListening && "ring-2 ring-chart-primary")}
                    autoFocus
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={startDictation}
                    disabled={handsfree}
                    className={cn(
                      "h-9 w-9 shrink-0 rounded-lg p-0",
                      isListening ? "text-chart-primary bg-chart-primary/10 animate-pulse" : "text-muted-foreground hover:text-foreground",
                      handsfree && "opacity-30 cursor-not-allowed"
                    )}
                    title={handsfree ? "Mic disabled in hands-free mode" : isListening ? "Stop dictation" : "Dictate response"}
                  >
                    <Mic size={14} />
                  </Button>
                  <Button onClick={handleNext} className="h-9 w-9 rounded-lg shrink-0">
                    <ArrowRight size={14} />
                  </Button>
                </div>
              )}

              {/* Audio settings bar */}
              <div className="flex items-center gap-3 pt-1">
                <button onClick={cycleVoice} className="flex items-center gap-1 text-[9px] text-muted-foreground hover:text-foreground px-1 py-0.5 rounded hover:bg-muted transition-colors" title="Click to change voice">
                  <Volume2 size={10} />
                  <span>{preferredVoiceName || "Default"}</span>
                </button>
                <div className="flex items-center gap-1 flex-1 max-w-[120px]">
                  <Gauge size={10} className="text-muted-foreground shrink-0" />
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.05"
                    value={rate}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setRate(v);
                      localStorage.setItem('limiting_beliefs_rate', String(v));
                    }}
                    className="w-full h-1 accent-primary cursor-pointer"
                  />
                  <span className="text-[9px] text-muted-foreground w-8 text-right tabular-nums">{rate.toFixed(2)}x</span>
                </div>
                <button
                  onClick={() => setHandsfree(h => !h)}
                  className={cn(
                    "flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded transition-colors",
                    handsfree ? "bg-chart-primary/10 text-chart-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                  title={handsfree ? "Hands-free on" : "Hands-free off"}
                >
                  <Headphones size={10} />
                  <span>Hands-free</span>
                  {handsfree && <span className="w-1.5 h-1.5 rounded-full bg-chart-primary animate-pulse ml-0.5" />}
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Loop responses log */}
          {Object.keys(responses).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {BELIEF_STEPS.map((s, i) => {
                const key = `${s}`;
                if (!responses[key]) return null;
                return (
                  <Badge key={i} variant="outline" className="text-[9px] font-normal border-border text-muted-foreground">
                    {s}: {responses[key].slice(0, 25)}{responses[key].length > 25 ? "…" : ""}
                  </Badge>
                );
              })}
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleSave} disabled={saving} className="h-7 text-[10px] rounded-lg">
              {saving ? <Loader2 size={11} className="animate-spin mr-1" /> : <Save size={11} className="mr-1" />}
              Save Progress
            </Button>
          </div>
        </div>
      )}

      {/* Verification Check - shown when checking or as preview */}
      <div id="belief-check" className={cn("space-y-3", !isChecking && !belief && "opacity-40 pointer-events-none")}>
        <div className="flex items-center gap-2">
          <CheckCircle2 size={14} className={cn(isChecking ? "text-chart-emerald" : "text-muted-foreground")} />
          <h3 className="text-sm font-semibold text-foreground">Verifying the Shift</h3>
        </div>
        {belief && (
          <p className="text-xs text-muted-foreground">
            Belief: <strong className="text-foreground">"{belief}"</strong>{" · "}
            {loopCount > 0 && <>Loops: {loopCount + 1}{" · "}</>}
            Opposite: <strong className="text-foreground">"{oppositeBelief}"</strong>
          </p>
        )}
        {!belief && (
          <p className="text-xs text-muted-foreground">Enter a belief above and work through the A-F loop to unlock verification.</p>
        )}

        <div className="space-y-2">
          {CHECK_QUESTIONS.map((q, i) => {
            const prompt = q
              .replace(/\(BELIEF\)/g, belief || "(belief)")
              .replace(/\(OPPOSITE OF BELIEF\)/g, oppositeBelief || "(opposite)");
            const result = checkResults[i];
            const isThisActive = isChecking && i === activeCheckIndex;
            const isResolved = result !== undefined && isResolvedAnswer(i, result);
            const isStuck = result !== undefined && !isResolved;
            return (
              <Card key={i} className={cn(
                "border transition-colors",
                !isChecking && !result ? "border-border/50 bg-muted/20" :
                isThisActive ? "border-primary/40 bg-accent/30" :
                isResolved ? "border-chart-emerald/30 bg-chart-emerald/5" :
                "border-destructive/30 bg-destructive/5"
              )}>
                <CardContent className="p-3 flex items-center justify-between gap-3">
                  <p className={cn("text-xs flex-1",
                    isChecking ? "text-foreground" : isResolved ? "text-chart-emerald" : "text-muted-foreground"
                  )}>{prompt}</p>
                  {isThisActive && (
                    <div className="flex gap-1.5 shrink-0">
                      {i === 3 ? (
                        <>
                          <Button variant="outline" size="sm" onClick={() => answerCheckQuestion(true)}
                            className="h-7 w-10 rounded-lg text-[10px] border-chart-emerald/40 hover:bg-chart-emerald/10">Resolved</Button>
                          <Button variant="outline" size="sm" onClick={() => answerCheckQuestion(false)}
                            className="h-7 w-10 rounded-lg text-[10px] border-destructive/40 hover:bg-destructive/10">Stuck</Button>
                        </>
                      ) : (
                        <>
                          <Button variant="outline" size="sm" onClick={() => answerCheckQuestion(true)}
                            className="h-7 w-10 rounded-lg text-[10px] border-destructive/40 hover:bg-destructive/10">Stuck</Button>
                          <Button variant="outline" size="sm" onClick={() => answerCheckQuestion(false)}
                            className="h-7 w-10 rounded-lg text-[10px] border-chart-emerald/40 hover:bg-chart-emerald/10">Resolved</Button>
                        </>
                      )}
                    </div>
                  )}
                  {!isThisActive && result !== undefined && (
                    <button
                      onClick={() => revertCheckAnswer(i)}
                      className={cn("text-[10px] font-medium shrink-0 cursor-pointer hover:underline",
                        isResolved ? "text-chart-emerald" : "text-destructive"
                      )}
                      title="Click to re-open this question"
                    >
                      {isResolved ? "✓ Resolved" : "✗ Re-check"}
                    </button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {allChecksClear() && (
          <div className="p-4 rounded-xl bg-chart-emerald/5 border border-chart-emerald/20 text-center space-y-2">
            <CheckCircle2 size={20} className="text-chart-emerald mx-auto" />
            <div>
              <p className="text-sm font-semibold text-foreground">Belief Cleared</p>
              <p className="text-xs text-muted-foreground">"{belief}" has been integrated. Double-check with indicator muscle or body dowsing.</p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={handleSave} disabled={saving} className="rounded-lg h-8 text-[10px]">
                {saving ? <Loader2 size={11} className="animate-spin mr-1" /> : <Save size={11} className="mr-1" />}
                Save Session
              </Button>
              <Button onClick={handleReset} variant="ghost" className="rounded-lg h-8 text-[10px]">
                <RotateCcw size={11} className="mr-1" /> New Belief
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* History */}
      <div>
        <button onClick={() => setShowHistory(!showHistory)} className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground">
          <History size={11} />
          Past Sessions ({pastSessions.length})
          {showHistory ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </button>
        {showHistory && (
          <div className="mt-2 space-y-0.5 max-h-40 overflow-y-auto">
            {pastSessions.map(s => (
              <div key={s.id} onClick={() => loadSession(s)} className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer text-left">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{s.limiting_belief || s.problem}</p>
                  <p className="text-[9px] text-muted-foreground">{format(new Date(s.created_at), 'MMM d, h:mm a')}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {s.is_complete && <Badge className="bg-chart-emerald/10 text-chart-emerald text-[8px]">Cleared</Badge>}
                  <button onClick={(e) => deleteSession(e, s.id)} className="p-1 hover:bg-muted rounded">
                    <Trash2 size={10} className="text-muted-foreground" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LimitingBeliefsTool;
