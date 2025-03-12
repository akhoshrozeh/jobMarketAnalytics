import "server-only"

import { TopJobTitlesGraph } from "../Graphs";
import { buildJobTitleTree } from "@/lib/buildJobTitleTree";

export interface JobTitle {
    title: string;
    count: number;
}

export interface TreeNode {
    name: string;
    value?: number;
    children?: TreeNode[];
}

export default async function TopJobTitles({topJobTitlesData}: {topJobTitlesData: JobTitle[]}) {
    const treeData = buildJobTitleTree(topJobTitlesData);
    
    return (
        <div>
            <TopJobTitlesGraph data={treeData as TreeNode} />
        </div>
    );
}