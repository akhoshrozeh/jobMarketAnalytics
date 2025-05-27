"use client"
import { useSkill } from "../SkillContext";

export default function RelatedSkills() {
    const { skillData, selectedSkill } = useSkill();
    
    return (
        <div className="p-4">
            <div className="max-h-[400px] overflow-y-auto rounded-lg border border-gray-200 shadow-sm">
                <div className="divide-y divide-gray-200">
                    {skillData?.relatedSkills.map((skill: any, index: number) => {
                        const percentage = ((skill.count / skillData.totalJobsForSkill) * 100).toFixed(1);
                        return (
                            <div 
                                key={skill.keyword}
                                className="p-3 hover:bg-gray-50 transition-colors duration-150 flex items-center"
                            >
                                <span className="w-8 text-gray-500 font-medium text-sm sm:text-base">#{index + 1}</span>
                                <span className="font-medium text-gray-900 flex-grow text-sm sm:text-base">{skill.keyword}</span>
                                <span className="text-xs sm:text-sm text-gray-500">
                                    {percentage}% match
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    )
}