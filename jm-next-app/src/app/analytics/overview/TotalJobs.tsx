'use client';
import { useState, useEffect } from 'react';

export default function TotalJobs({ totalJobs }: { totalJobs: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 1500; // 2 seconds
    const frames = 60; // 60 fps
    const frameTime = duration / frames;
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += frameTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
      
      setCount(Math.floor(totalJobs * easeProgress));
      
      if (progress >= 1) {
        clearInterval(timer);
      }
    }, 1000 / frames);

    return () => clearInterval(timer);
  }, [totalJobs]);

  return <>{count.toLocaleString()}</>;
}