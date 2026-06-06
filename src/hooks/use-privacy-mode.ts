
import { useState, useEffect } from 'react';
import { toast } from "sonner";

const STORAGE_KEY = 'antigravity_privacy_mode';

export function usePrivacyMode() {
  const [isPrivate, setIsPrivate] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved !== null ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(isPrivate));
    
    // Add a global class to the body for CSS-based blurring
    if (isPrivate) {
      document.body.classList.add('privacy-mode-active');
    } else {
      document.body.classList.remove('privacy-mode-active');
    }
  }, [isPrivate]);

  const togglePrivacy = () => {
    const newState = !isPrivate;
    setIsPrivate(newState);
    
    if (newState) {
      toast.success("Privacy Mode Enabled", {
        description: "Sensitive client data is now blurred.",
        duration: 3000,
      });
    } else {
      toast.info("Privacy Mode Disabled", {
        description: "Client data is now visible.",
        duration: 3000,
      });
    }
  };

  return { isPrivate, togglePrivacy };
}