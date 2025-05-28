"use client"
import { useSkill } from "../SkillContext";
import { createPortal } from "react-dom";
import { useState, useEffect, useRef } from "react";

interface Skill {
    keyword: string;
    count: number;
    percentage: string;
}

export default function RelatedSkills() {
    const { skillData, selectedSkill } = useSkill();
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

    return (
        <div className="p-4 w-full mx-8">
            <div className="max-h-[600px] overflow-y-auto rounded-xl border border-gray-200 shadow-sm bg-white/60 relative">
                <div className="divide-y divide-gray-100">
                    {skillData?.relatedSkills
                        .map((skill: any, index: number) => {
                            const percentage = ((skill.count / skillData.marketDemand.count) * 100).toFixed(1);
                            return { ...skill, percentage };
                        })
                        .filter((skill: Skill) => parseFloat(skill.percentage) > 0.0)
                        .map((skill: Skill, index: number) => (
                            <div
                                key={skill.keyword}
                                ref={(el) => { rowRefs.current[index] = el }}
                                onMouseEnter={() => setHoveredIndex(index)}
                                onMouseLeave={() => setHoveredIndex(null)}
                                className="px-2 py-4 hover:bg-m-dark-green/10 transition-all duration-200 flex items-center group animate-fade-in relative"
                                style={{ animationDelay: `${index * 0}ms` }}
                            >
                                <span className="w-8 text-gray-400 font-medium text-sm sm:text-base group-hover:text-m-dark-green transition-colors duration-200">#{index + 1}</span>
                                <span className="font-bold text-gray-800 flex-grow text-sm sm:text-base group-hover:text-m-dark-green transition-colors duration-200">{skill.keyword}</span>
                                <span className="text-xs sm:text-sm text-gray-400 group-hover:text-gray-600 transition-colors duration-200">
                                    {skill.percentage}% match
                                </span>
                                {hoveredIndex === index && rowRefs.current[index] &&
                                    createPortal(
                                        <div
                                            className="absolute z-50 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap shadow-lg"
                                            style={{
                                                position: 'fixed',
                                                top: rowRefs.current[index]?.getBoundingClientRect().top - 40,
                                                left: rowRefs.current[index]?.getBoundingClientRect().left + rowRefs.current[index]?.getBoundingClientRect().width / 2,
                                                transform: 'translateX(-50%)'
                                            }}
                                        >
                                            {skill.percentage}% of jobs that require <strong>{selectedSkill}</strong> also mention <strong>{skill.keyword}</strong>
                                            <div className="absolute left-1/2 -translate-x-1/2 bottom-[-4px] w-2 h-2 bg-gray-900 rotate-45"></div>
                                        </div>,
                                        document.body
                                    )
                                }
                            </div>
                        ))}
                </div>
            </div>
        </div>
    )
}
