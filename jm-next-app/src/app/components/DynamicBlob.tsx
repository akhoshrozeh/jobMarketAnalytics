"use client"

import { useEffect, useState } from "react";

export default function DynamicBlob() {

    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

    useEffect(() => {
        
        const handleMouseMove = (e: MouseEvent) => {
          // Get mouse position as percentage of window size
          const x = e.clientX / window.innerWidth
          const y = e.clientY / window.innerHeight
          setMousePosition({ x, y })
        }
    
        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
      }, [])


    return (
        <>
        <div
        aria-hidden="true"
        className="fixed left-[calc(50%-4rem)] top-10 -z-10 transform-gpu blur-3xl sm:left-[calc(50%-18rem)] lg:left-48 lg:top-[calc(50%-30rem)] xl:left-[calc(50%-24rem)]"
        >
        
        <div
          style={{
              clipPath:
              'polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)',
              transform: `translate(${-mousePosition.x * 100}px, ${-mousePosition.y * 100}px)`,
              transition: 'transform 0.2s ease-out',
            }}
            className="aspect-[1108/632] w-[69.25rem] bg-gradient-to-r from-[#80caff] to-[#4f46e5] opacity-20">

          </div>
                </div>


        </>
    )
}
        