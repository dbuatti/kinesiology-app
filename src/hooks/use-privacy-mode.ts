"use client";

import { useState, useEffect } from 'react';

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

  const togglePrivacy = () => setIsPrivate(!isPrivate);

  return { isPrivate, togglePrivacy };
}