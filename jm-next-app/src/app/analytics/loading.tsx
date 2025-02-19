'use client';
import { useState, useEffect } from 'react';

export default function Loading() {
    const [dots, setDots] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '' : prev + '.');
        }, 500);

        return () => clearInterval(interval);
    }, []);

    return <div>
        <div className="flex justify-center items-center flex-col p-8 text-black">
            <h1 className="sm:text-2xl text-xl font-bold mb-4 mt-32">
                Loading Analytics<span className="inline-block w-[3ch]">{dots}</span>
            </h1>
        </div>
    </div>
}