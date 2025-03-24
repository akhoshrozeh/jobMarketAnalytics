"use client"
import { useSkill } from "../SkillContext";

export default function TotalJobs() {
    const { skillData } = useSkill();
    console.log("skillData", skillData)
    return (
        <div className="text-center text-xl">
            {/* <div>Min: ${Math.floor(skillData?.averageSalaryForSkill.avgMinSalary).toLocaleString()}</div> */}
            {/* <div>Max: ${Math.floor(skillData?.averageSalaryForSkill.avgMaxSalary).toLocaleString()}</div> */}
        </div>
    )
}