"use client"
import { useSkill } from "../SkillContext";

export default function Ranking() {
    const { skillData } = useSkill();
    return (
        <div>
            <p>{skillData?.skillGrade.ranking}</p>
        </div>
    )
}