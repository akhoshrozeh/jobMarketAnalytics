'use client'

import React from 'react'
import { useCompareSkills } from './CompareSkillsContext'

interface CompareBentoLayoutProps {
  MarketDemandA: React.ReactNode
  MarketDemandB: React.ReactNode
  SalaryDistributionA: React.ReactNode
  SalaryDistributionB: React.ReactNode
  TopJobsA: React.ReactNode
  TopJobsB: React.ReactNode
  RelatedSkillsA: React.ReactNode
  RelatedSkillsB: React.ReactNode
  SkillSalaryStatsA: React.ReactNode
  SkillSalaryStatsB: React.ReactNode
}

interface ComponentPairProps {
  componentA: React.ReactNode
  componentB: React.ReactNode
  titleA: string
  titleB: string
  skillNameA: string
  skillNameB: string
}

function ComponentPair({ componentA, componentB, titleA, titleB, skillNameA, skillNameB }: ComponentPairProps) {
  return (
    <>
      {/* Desktop: Side by side */}
      <div className="hidden lg:grid lg:grid-cols-2 lg:gap-6 mb-6">
        <div>
          {componentA}
        </div>
        <div>
          {componentB}
        </div>
      </div>

      {/* Mobile: Stacked alternating */}
      <div className="lg:hidden space-y-4 mb-6">
        <div>
          {componentA}
        </div>
        <div>
          {componentB}
        </div>
      </div>
    </>
  )
}

export default function CompareBentoLayout({
  MarketDemandA,
  MarketDemandB,
  SalaryDistributionA,
  SalaryDistributionB,
  TopJobsA,
  TopJobsB,
  RelatedSkillsA,
  RelatedSkillsB,
  SkillSalaryStatsA,
  SkillSalaryStatsB
}: CompareBentoLayoutProps) {
  const { skillA, skillB } = useCompareSkills()

  // Show message if no skills selected
  if (!skillA.skill && !skillB.skill) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold text-gray-600 mb-2">
          Select skills to compare
        </h3>
        <p className="text-gray-500">
          Choose skills from the dropdowns above to start comparing their analytics
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Salary Stats */}
      <ComponentPair
        componentA={SkillSalaryStatsA}
        componentB={SkillSalaryStatsB}
        titleA="📈 Salary Stats"
        titleB="📈 Salary Stats"
        skillNameA={skillA.skill}
        skillNameB={skillB.skill}
      />

      {/* Market Demand */}
      <ComponentPair
        componentA={MarketDemandA}
        componentB={MarketDemandB}
        titleA="📊 Market Demand"
        titleB="📊 Market Demand"
        skillNameA={skillA.skill}
        skillNameB={skillB.skill}
      />

      {/* Salary Distribution */}
      <ComponentPair
        componentA={SalaryDistributionA}
        componentB={SalaryDistributionB}
        titleA="💰 Salary Distribution"
        titleB="💰 Salary Distribution"
        skillNameA={skillA.skill}
        skillNameB={skillB.skill}
      />

      {/* Top Jobs */}
      <ComponentPair
        componentA={TopJobsA}
        componentB={TopJobsB}
        titleA="👔 Top Jobs"
        titleB="👔 Top Jobs"
        skillNameA={skillA.skill}
        skillNameB={skillB.skill}
      />

      {/* Related Skills */}
      <ComponentPair
        componentA={RelatedSkillsA}
        componentB={RelatedSkillsB}
        titleA="🔗 Related Skills"
        titleB="🔗 Related Skills"
        skillNameA={skillA.skill}
        skillNameB={skillB.skill}
      />
    </div>
  )
} 