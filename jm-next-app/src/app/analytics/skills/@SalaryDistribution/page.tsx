"use client"
import { useSkill } from "../SkillContext";
import { SalaryDistributionGraph } from "../SkillsPageGraphs";

export default function SalaryDistribution() {
    const { skillData, selectedSkill } = useSkill();
    console.log("skillData", skillData)
    return (
        <div className="text-center text-xl">
            <SalaryDistributionGraph selectedSkill={selectedSkill as string} totalJobs={skillData?.salaryDistributionForSkill.totalJobs[0].total} minSalaries={skillData?.salaryDistributionForSkill.minSalaries} maxSalaries={skillData?.salaryDistributionForSkill.maxSalaries} />
        </div>
    )
}