import { useState, useCallback } from 'react';

export const useVoiceRecording = () => {
  const [isRecording, setIsRecording] = useState(false);

  const startRecording = useCallback(async () => {
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback(async () => {
    setIsRecording(false);
  }, []);

  const getTranscript = useCallback(async () => {
    return "Sample transcript text";
  }, []);

  return { isRecording, startRecording, stopRecording, getTranscript };
};