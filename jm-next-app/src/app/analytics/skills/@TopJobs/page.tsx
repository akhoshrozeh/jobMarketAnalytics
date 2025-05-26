"use client"

import { TopJobTitlesGraph } from "../../Graphs";
import { buildJobTitleTree } from "@/lib/buildJobTitleTree";
import { useSkill } from "../SkillContext";


export interface JobTitle {
    title: string;
    count: number;
}

export interface TreeNode {
    name: string;
    value?: number;
    children?: TreeNode[];
}

export default function TopJobs() {
    const { skillData } = useSkill();
    console.log("skillData top Jobs", skillData?.topJobs)
    const treeData = buildJobTitleTree(skillData?.topJobs);
    console.log("treeData", treeData)
    
    return (
        <div>
            <TopJobTitlesGraph data={treeData as TreeNode} />
        </div>
    );
}