"use client";

import { useState, useEffect, useCallback } from "react";
import type { DayStats } from "@/types/detection";

const defaultStats: DayStats = {
  totalCustomers: 0,
  satisfied: 0,
  neutral: 0,
  unsatisfied: 0,
  avgConfidence: 0,
  recentDetections: [],
};

export function useLiveStats() {
  const [stats, setStats] = useState<DayStats>(defaultStats);
  const [isConnected, setIsConnected] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await fetch(`/api/detections?date=${today}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    // Poll every 5 seconds for live updates
    const interval = setInterval(fetchStats, 5000);
    setIsConnected(true);

    return () => {
      clearInterval(interval);
      setIsConnected(false);
    };
  }, [fetchStats]);

  return { stats, isConnected, refresh: fetchStats };
}
