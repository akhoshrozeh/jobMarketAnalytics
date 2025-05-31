'use client'

import { useCompareSkills } from '../CompareSkillsContext'
import { SalaryDistributionGraph } from "../../skills/SkillsPageGraphs"

export default function SalaryDistributionA() {
  const { skillA } = useCompareSkills()

  if (!skillA.skill || !skillA.data) {
    return (
      <div className="bg-slate-100/50 rounded-lg shadow p-4 shadow-gray-300 shadow-md border border-m-dark-green">
        <h2 className="text-xl font-semibold text-black text-center mb-4">
          💰 Salary Distribution
        </h2>
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <p className="text-gray-500">Select Skill A to view salary distribution</p>
        </div>
      </div>
    )
  }

  const salaryDistribution = skillA.data?.salaryDistributionForSkill;

  if (!salaryDistribution) {
    return (
      <div className="bg-slate-100/50 rounded-lg shadow p-4 shadow-gray-300 shadow-md border border-m-dark-green">
        <h2 className="text-xl font-semibold text-black text-center mb-4">
          💰 Salary Distribution {skillA.skill && `- ${skillA.skill}`}
        </h2>
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <p className="text-gray-500">No salary distribution data available</p>
        </div>
      </div>
    )
  }

  // Only re-render when we have data
  const key = `data-${salaryDistribution.totalJobs[0].total}`;

  return (
    <div className="bg-slate-100/50 rounded-lg shadow p-4 shadow-gray-300 shadow-md border border-m-dark-green">
      <h2 className="text-xl font-semibold text-black text-center mb-4">
        💰 Salary Distribution {skillA.skill && `- ${skillA.skill}`}
      </h2>
      <div className="text-center text-xl">
        <SalaryDistributionGraph 
          key={key}
          selectedSkill={skillA.skill} 
          totalJobs={salaryDistribution.totalJobs[0].total} 
          minSalaries={salaryDistribution.minSalaries} 
          maxSalaries={salaryDistribution.maxSalaries} 
        />
      </div>
    </div>
  )
} 