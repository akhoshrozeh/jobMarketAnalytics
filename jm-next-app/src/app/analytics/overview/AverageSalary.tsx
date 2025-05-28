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
        const duration = 1500;
        const frames = 60;
        const frameTime = duration / frames;
        let elapsed = 0;

        const timer = setInterval(() => {
            elapsed += frameTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3);

            setMinCount(Math.floor(avgMinSalary * easeProgress));
            setMaxCount(Math.floor(avgMaxSalary * easeProgress));
            
            if (progress >= 1) {
                clearInterval(timer);
            }
        }, 1000 / frames);

        return () => clearInterval(timer);
    }, [avgMinSalary, avgMaxSalary]);

    return (
        <div className="flex flex-col items-center justify-center gap-y-2 w-full">
            <div className="flex items-center justify-center gap-x-2">
                <span className="text-xl sm:text-2xl">🔺</span>
                <span className="text-2xl sm:text-3xl font-bold text-gray-800">
                    {formatter.format(maxCount)}
                </span>
            </div>
            <div className="flex items-center justify-center gap-x-2">
                <span className="text-xl sm:text-2xl">🔻</span>
                <span className="text-2xl sm:text-3xl font-bold text-gray-800">
                    {formatter.format(minCount)}
                </span>
            </div>
        </div>
    );
}