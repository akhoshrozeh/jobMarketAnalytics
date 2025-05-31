'use client'

import { useCompareSkills } from '../CompareSkillsContext'
import { TopJobTitlesGraph } from "../../Graphs"
import { buildJobTitleTree } from "@/lib/buildJobTitleTree"

export interface JobTitle {
  title: string;
  count: number;
}

export interface TreeNode {
  name: string;
  value?: number;
  children?: TreeNode[];
}

export default function TopJobsA() {
  const { skillA } = useCompareSkills()

  if (!skillA.skill || !skillA.data) {
    return (
      <div className="bg-slate-100/50 rounded-lg shadow p-4 shadow-gray-300 shadow-md border border-m-dark-green">
        <h2 className="text-xl font-semibold text-black text-center mb-4">
          👔 Top Jobs
        </h2>
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <p className="text-gray-500">Select Skill A to view top jobs</p>
        </div>
      </div>
    )
  }

  const topJobs = skillA.data?.topJobs;

  if (!topJobs) {
    return (
      <div className="bg-slate-100/50 rounded-lg shadow p-4 shadow-gray-300 shadow-md border border-m-dark-green">
        <h2 className="text-xl font-semibold text-black text-center mb-4">
          👔 Top Jobs {skillA.skill && `- ${skillA.skill}`}
        </h2>
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <p className="text-gray-500">No top jobs data available</p>
        </div>
      </div>
    )
  }

  const treeData = buildJobTitleTree(topJobs);

  return (
    <div className="bg-slate-100/50 rounded-lg shadow p-4 shadow-gray-300 shadow-md border border-m-dark-green">
      <h2 className="text-xl font-semibold text-black text-center mb-4">
        👔 Top Jobs {skillA.skill && `- ${skillA.skill}`}
      </h2>
      <div>
        <TopJobTitlesGraph data={treeData as TreeNode} />
      </div>
    </div>
  )
} 