'use client';
import { useState, useEffect } from 'react';

export default function AverageSalary({ avgMinSalary, avgMaxSalary }: { avgMinSalary: number, avgMaxSalary: number }) {
    const [minCount, setMinCount] = useState(0);
    const [maxCount, setMaxCount] = useState(0);

    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });

    useEffect(() => {
        const duration = 1500; // 2 seconds total
        const frames = 60; // 60 fps
        const frameTime = duration / frames;
        let elapsed = 0;

        const timer = setInterval(() => {
            elapsed += frameTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out

            setMinCount(Math.floor(avgMinSalary * easeProgress));
            setMaxCount(Math.floor(avgMaxSalary * easeProgress));
            
            if (progress >= 1) {
                clearInterval(timer);
            }
        }, 1000 / frames);

        return () => clearInterval(timer);
    }, [avgMinSalary, avgMaxSalary]);

    // TODO: format $ for mobile; there's a gap in the text
    return (
        <div className="flex flex-col items-center justify-center gap-x-4 font-bold">
            <div className="flex flex-row items-center justify-center gap-x-4 w-full">
                <div className="flex items-center">
                    <span className="w-6">🔺$</span>
                    <span className="min-w-[111px] text-right">{maxCount.toLocaleString()}</span>
                </div>
            </div>
            <div className="flex flex-row items-center justify-center gap-x-4 w-full">
                <div className="flex items-center">
                    <span className="w-6">🔻$</span>
                    <span className="min-w-[114px] text-right">{minCount.toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
}