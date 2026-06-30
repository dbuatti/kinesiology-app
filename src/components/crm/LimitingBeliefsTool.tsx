import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, RefreshCw, Loader2, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useVoiceRecording } from '@/hooks/use-voice-recording';

const LimitingBeliefsTool = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [beliefId, setBeliefId] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);
  
  const handsfreeRecRef = useRef<any>(null);
  const handsfreeSilenceRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const handsfreeActiveRef = useRef(false);
  const speakTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speakingRef = useRef(false);
  const { isRecording: isVoiceRecording, startRecording, stopRecording, getTranscript } = useVoiceRecording();

  const stopHandsfreeRecording = useCallback(async () => {
    handsfreeActiveRef.current = false;
    if (handsfreeSilenceRef.current) {
      clearInterval(handsfreeSilenceRef.current);
      handsfreeSilenceRef.current = null;
    }
    if (handsfreeRecRef.current) {
      clearInterval(handsfreeRecRef.current);
      handsfreeRecRef.current = null;
    }
    setIsRecording(false);
    await stopRecording();
    const transcriptText = await getTranscript();
    setTranscript(transcriptText);
    if (transcriptText.trim()) {
      setIsProcessing(true);
      try {
        const { data } = await supabase
          .from('limiting_belief_sessions')
          .insert({
            problem: transcriptText,
            felt_sense: '',
            limiting_belief: '',
            positive_belief: '',
            dissolve_log: [],
            check_belief_result: false,
            check_problem_result: false,
            integration_awareness: '',
            integration_action: '',
            is_complete: false,
            current_step: 1,
          })
          .select()
          .single();
        if (data) {
          setBeliefId(data.id);
          setShowResults(true);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsProcessing(false);
      }
    }
  }, [stopRecording, getTranscript]);

  const startHandsfreeRecording = useCallback(async () => {
    if (isRecording || isProcessing) return;
    setIsRecording(true);
    setRecordingTime(0);
    setTranscript('');
    setBeliefId(null);
    setShowResults(false);
    setIsPlaying(false);
    setAudioUrl(null);
    await startRecording();
    handsfreeActiveRef.current = true;
    
    const interval = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    handsfreeRecRef.current = interval;

    handsfreeSilenceRef.current = setInterval(() => {
      if (!isVoiceRecording && handsfreeActiveRef.current) {
        stopHandsfreeRecording();
      }
    }, 3000);
  }, [isRecording, isProcessing, startRecording, isVoiceRecording, stopHandsfreeRecording]);

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      await stopHandsfreeRecording();
    } else {
      await startHandsfreeRecording();
    }
  }, [isRecording, startHandsfreeRecording, stopHandsfreeRecording]);

  const handleSpeak = useCallback((text: string) => {
    if (speakingRef.current) return;
    speakingRef.current = true;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => {
      speakingRef.current = false;
    };
    speechSynthesis.speak(utterance);
    speakTimeoutRef.current = setTimeout(() => {
      speakingRef.current = false;
    }, 3000);
  }, []);

  const handlePlayAudio = useCallback(async () => {
    if (!audioUrl || isPlaying) return;
    setIsPlaying(true);
    const audio = new Audio(audioUrl);
    audio.onended = () => setIsPlaying(false);
    audio.play();
  }, [audioUrl, isPlaying]);

  const handleStopAudio = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleReset = useCallback(() => {
    setIsRecording(false);
    setRecordingTime(0);
    setTranscript('');
    setBeliefId(null);
    setShowResults(false);
    setIsPlaying(false);
    setAudioUrl(null);
    if (handsfreeSilenceRef.current) {
      clearInterval(handsfreeSilenceRef.current);
      handsfreeSilenceRef.current = null;
    }
    if (handsfreeRecRef.current) {
      clearInterval(handsfreeRecRef.current);
      handsfreeRecRef.current = null;
    }
    handsfreeActiveRef.current = false;
    speakingRef.current = false;
    if (speakTimeoutRef.current) {
      clearTimeout(speakTimeoutRef.current);
      speakTimeoutRef.current = null;
    }
    speechSynthesis.cancel();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Limiting Beliefs Tool</h2>
        <Button variant="outline" size="icon" onClick={handleReset}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      <div className="border rounded-lg p-4">
        <div className="flex items-center space-x-3 mb-4">
          <div className="h-8 w-8 rounded-lg bg-chart-primary/20 flex items-center justify-center">
            {isRecording ? (
              <MicOff className="h-4 w-4 text-chart-destructive" onClick={toggleRecording} />
            ) : (
              <Mic className="h-4 w-4 text-chart-primary" onClick={toggleRecording} />
            )}
          </div>
          <div>
            <p className="font-medium">{isRecording ? 'Listening...' : 'Click to speak about your limiting belief'}</p>
            {isRecording && (
              <p className="text-sm text-chart-muted">
                {recordingTime}s • Speak freely about what's holding you back
              </p>
            )}
          </div>
        </div>
        {isRecording && (
          <div className="mb-4">
            <div className="w-full bg-chart-muted rounded-full h-2.5">
              <div
                className="bg-chart-primary h-2.5 rounded-full transition-all"
                style={{ width: Math.min(recordingTime / 60 * 100, 100) + '%' }}
              ></div>
            </div>
            <p className="text-xs text-chart-muted mt-1">
              Max 60 seconds
            </p>
          </div>
        )}
        {!isRecording && !isProcessing && transcript && !showResults && (
          <div className="mb-4">
            <p className="font-medium mb-2">Transcript:</p>
            <p className="text-chart-muted">{transcript}</p>
            <Button onClick={() => {
              setIsProcessing(true);
              setTimeout(() => {
                setIsProcessing(false);
                setShowResults(true);
              }, 1500);
            }} className="w-full">
              Process Belief
            </Button>
          </div>
        )}
        {isProcessing && (
          <div className="text-center py-4">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p className="mt-2 text-sm">Processing your belief...</p>
          </div>
        )}
        {showResults && beliefId && (
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Identified Limiting Belief</h3>
              <p className="text-chart-muted">{transcript}</p>
            </div>
            <div className="space-y-2">
              <Button
                onClick={() => {
                  setSpeaking(true);
                  handleSpeak(`Your limiting belief is: ${transcript}. Let's work on transforming this belief.`);
                }}
                className="w-full"
              >
                Hear Belief
              </Button>
              <Button
                onClick={() => {}}
                className="w-full"
              >
                Work on This Belief
              </Button>
            </div>
          </div>
        )}
        {showResults && !beliefId && (
          <p className="text-chart-muted">No limiting belief detected. Please try again.</p>
        )}
      </div>
    </div>
  );
};

export default LimitingBeliefsTool;