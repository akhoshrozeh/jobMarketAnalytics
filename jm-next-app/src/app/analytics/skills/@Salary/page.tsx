"use client"
import { useSkill } from "../SkillContext";
import { SalaryDistributionGraph } from "../SkillsPageGraphs";

export default function TotalJobs() {
    const { skillData } = useSkill();
    console.log("skillData", skillData)
    return (
        <div className="text-center text-xl">
            <SalaryDistributionGraph minSalaries={skillData?.averageSalaryForSkill.minSalaries} maxSalaries={skillData?.averageSalaryForSkill.maxSalaries} />
        </div>
    )
}