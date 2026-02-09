"use client";

import { useState, useEffect } from 'react';

interface RecentClient {
  id: string;
  name: string;
}

const STORAGE_KEY = 'antigravity_recent_clients';
const MAX_RECENT = 5;

export function useRecentClients() {
  const [recentClients, setRecentClients] = useState<RecentClient[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setRecentClients(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse recent clients", e);
      }
    }
  }, []);

  const addRecentClient = (client: RecentClient) => {
    setRecentClients(prev => {
      const filtered = prev.filter(c => c.id !== client.id);
      const updated = [client, ...filtered].slice(0, MAX_RECENT);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const clearRecent = () => {
    localStorage.removeItem(STORAGE_KEY);
    setRecentClients([]);
  };

  return { recentClients, addRecentClient, clearRecent };
}