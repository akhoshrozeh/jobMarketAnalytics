'use client'

import { useCompareSkills } from '../CompareSkillsContext'

export default function MarketDemandA() {
  const { skillA } = useCompareSkills()

  if (!skillA.skill || !skillA.data) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-500">Select Skill A to view market demand</p>
      </div>
    )
  }

  const marketDemand = skillA.data?.marketDemand;

  if (!marketDemand) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-500">No market demand data available</p>
      </div>
    )
  }

  // Calculate jobs per skill ratio
  const jobsPerSkill = Math.round(marketDemand.totalJobs / marketDemand.count);

  return (
    <div className="bg-slate-100/50 rounded-lg shadow p-4 shadow-gray-300 shadow-md border border-m-dark-green">
      <h2 className="text-xl font-semibold text-black text-center mb-4">
        📊 Market Demand {skillA.skill && `- ${skillA.skill}`}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Market Share Card */}
        <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-300 animate-fade-in [animation-delay:200ms] opacity-0 [animation-fill-mode:forwards] text-center">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Market Share</h3>
          <div className="text-3xl font-bold text-m-dark-green">
            {marketDemand.popularityScore.toFixed(1)}%
          </div>
          <div className="mt-2 text-sm text-gray-500">
            of all jobs require this skill
          </div>
        </div>

        {/* Job Count Card */}
        <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-300 animate-fade-in [animation-delay:400ms] opacity-0 [animation-fill-mode:forwards] text-center">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Job Count</h3>
          <div className="text-3xl font-bold text-m-dark-green">
            {marketDemand.count.toLocaleString()}
          </div>
          <div className="mt-2 text-sm text-gray-500">
            out of {marketDemand.totalJobs.toLocaleString()} total jobs
          </div>
        </div>

        {/* Market Demand Card */}
        <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-300 animate-fade-in [animation-delay:600ms] opacity-0 [animation-fill-mode:forwards] text-center">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Market Demand</h3>
          <div className="text-3xl font-bold text-m-dark-green">
            1 in {jobsPerSkill}
          </div>
          <div className="mt-2 text-sm text-gray-500">
            jobs require this skill
          </div>
        </div>

        {/* Popularity Rank Card */}
        <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-300 animate-fade-in [animation-delay:800ms] opacity-0 [animation-fill-mode:forwards] text-center">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Popularity Rank</h3>
          <div className="text-3xl font-bold text-m-dark-green">
            {marketDemand.popularityRank}
          </div>
          <div className="mt-2 text-sm text-gray-500">
            skill in demand
          </div>
        </div>
      </div>
    </div>
  )
} 