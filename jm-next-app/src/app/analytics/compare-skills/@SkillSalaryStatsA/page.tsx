'use client'

import { useCompareSkills } from '../CompareSkillsContext'
import { formatCurrency } from "@/utils/formatCurrency"

export default function SkillSalaryStatsA() {
  const { skillA } = useCompareSkills()

  if (!skillA.skill || !skillA.data) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-500">Select Skill A to view salary stats</p>
      </div>
    )
  }

  const stats = skillA.data?.skillSalaryStats;
  const marketSalaryAverage = skillA.data?.marketSalaryAverage?.[0];
  const marketTotalJobs = skillA.data?.marketTotalJobs;

  if (!stats || !marketSalaryAverage) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-500">No salary stats data available</p>
      </div>
    )
  }

  // Calculate salary premium
  const salaryPremium = stats.overallAvgSalary - marketSalaryAverage.overallAvgSalary;
  const salaryPremiumPercentage = (salaryPremium / marketSalaryAverage.overallAvgSalary) * 100;

  return (
    <div className="flex flex-col gap-3 w-full bg-slate-100/50 rounded-lg shadow p-4 shadow-gray-300 shadow-md border border-m-dark-green">
      <h2 className="text-xl font-semibold text-black text-center mb-4">
        📈 Salary Stats {skillA.skill && `- ${skillA.skill}`}
      </h2>
      {/* Average Salary Card */}
      <div className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow duration-300 animate-fade-in [animation-delay:200ms] opacity-0 [animation-fill-mode:forwards] text-center">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Average Salary</h3>
        <div className="text-3xl font-bold text-m-dark-green">
          {formatCurrency(stats.overallAvgSalary)}
        </div>
        <div className="mt-1 text-sm font-bold flex justify-center items-center gap-2">
          <span className="text-gray-700">Avg Min:</span> 
          <span className="text-m-dark-green/85">{formatCurrency(stats.avgMinSalary)}</span> 
          <span className="text-gray-400">|</span> 
          <span className="text-gray-700">Avg Max:</span> 
          <span className="text-m-dark-green/85">{formatCurrency(stats.avgMaxSalary)}</span>
        </div>
        <div className="mt-2 text-sm text-gray-500">
          Based on {stats.jobCount.toLocaleString()} jobs
        </div>
      </div>

      {/* Market Comparison Card */}
      <div className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow duration-300 animate-fade-in [animation-delay:400ms] opacity-0 [animation-fill-mode:forwards] text-center">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Market Comparison</h3>
        <div className="text-3xl font-bold text-m-dark-green">
          {formatCurrency(marketSalaryAverage.overallAvgSalary)}
        </div>
        
        <div className="mt-1 text-sm font-bold flex justify-center items-center gap-2">
          <span className="text-gray-700">Avg Min:</span> 
          <span className="text-m-dark-green/85">{formatCurrency(marketSalaryAverage.avgMinSalary)}</span> 
          <span className="text-gray-400">|</span> 
          <span className="text-gray-700">Avg Max:</span> 
          <span className="text-m-dark-green/85">{formatCurrency(marketSalaryAverage.avgMaxSalary)}</span>
        </div>

        <div className="mt-2 text-sm text-gray-500">
          Market average across {marketTotalJobs.toLocaleString()} jobs
        </div>
      </div>

      {/* Salary Premium Card */}
      <div className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow duration-300 animate-fade-in [animation-delay:600ms] opacity-0 [animation-fill-mode:forwards] text-center">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Salary Premium</h3>
        <div className={`text-3xl font-bold ${salaryPremium >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {salaryPremium >= 0 ? '+' : ''}{formatCurrency(salaryPremium)}
        </div>
        <div className="mt-2 text-sm text-gray-500">
          {salaryPremiumPercentage >= 0 ? '+' : ''}{salaryPremiumPercentage.toFixed(1)}% vs market
        </div>
      </div>
    </div>
  )
} 