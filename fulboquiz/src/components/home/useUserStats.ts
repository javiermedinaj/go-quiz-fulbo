import { useState, useEffect } from 'react';

interface UserStats {
  totalQuizzes: number;
  averageScore: number;
  bestStreak: number;
}

export const useUserStats = () => {
  const [stats, setStats] = useState<UserStats>({
    totalQuizzes: 0,
    averageScore: 0,
    bestStreak: 0
  });

  useEffect(() => {
    const savedStats = localStorage.getItem('futbolquiz-stats');
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }
  }, []);

  return stats;
};
