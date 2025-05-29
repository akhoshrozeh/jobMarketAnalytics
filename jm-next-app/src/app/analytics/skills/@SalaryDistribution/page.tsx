"use client"
import { useSkill } from "../SkillContext";
import { SalaryDistributionGraph } from "../SkillsPageGraphs";

export default function SalaryDistribution() {
    const { skillData, selectedSkill } = useSkill();

    // Only re-render when we have data
    if (!skillData?.salaryDistributionForSkill) {
        return null;
    }

    const currentSkillData = skillData.salaryDistributionForSkill;
    // Only use the data to determine when to re-render
    const key = `data-${currentSkillData.totalJobs[0].total}`;

    return (
        <div className="text-center text-xl">
            <SalaryDistributionGraph 
                key={key}
                selectedSkill={selectedSkill} 
                totalJobs={currentSkillData.totalJobs[0].total} 
                minSalaries={currentSkillData.minSalaries} 
                maxSalaries={currentSkillData.maxSalaries} 
            />
        </div>
    )
}