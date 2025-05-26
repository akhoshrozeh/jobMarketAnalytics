"use client"
import { useSkill } from "../SkillContext";

export default function TotalJobs() {
    const { skillData } = useSkill();
    return (
        <div>
            <p>{skillData?.skillGrade.grade}</p>
        </div>
    )
}