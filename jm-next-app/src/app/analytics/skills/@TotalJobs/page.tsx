"use client"
import { useSkill } from "../SkillContext";

export default function TotalJobs() {
    const { skillData } = useSkill();
    return (
        <div>
            <p>{skillData?.totalJobsForSkill}</p>
        </div>
    )
}