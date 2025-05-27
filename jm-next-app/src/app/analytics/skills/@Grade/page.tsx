"use client"
import { useSkill } from "../SkillContext";

export default function Grade() {
    const { skillData } = useSkill();
    return (
        <div>
            <p>{skillData?.skillGrade.grade}</p>
        </div>
    )
}