import { getTopSkillsClient, getTier, getSkillData } from '@/lib/dataAcessLayer';
import { CompareSkillsProvider } from './CompareSkillsContext'
import DualSearchContainer from './DualSearchContainer'
import CompareBentoLayout from './CompareBentoLayout'
import UpgradeModal from './UpgradeModal'

// Server Action for fetching skill data
async function fetchSkillData(skill: string) {
  'use server'
  return await getSkillData(skill)
}

export default async function Layout({
  children,
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
}: {
  children: React.ReactNode
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
}) {
  // Fetch searchable skills during SSR
  const tier = await getTier();
  console.log('Compare Skills - Tier:', tier);
  const skills = tier === "free" ? [] : await getTopSkillsClient(tier);
  console.log('Compare Skills - Skills count:', skills.length);

  return (
    <CompareSkillsProvider initialTier={tier}>
      <div>
        <h1 className="text-4xl font-bold text-center mb-6">Compare Skills</h1>
        <DualSearchContainer skills={skills} fetchSkillData={fetchSkillData}>
          {children}
        </DualSearchContainer>

        <CompareBentoLayout 
          MarketDemandA={MarketDemandA}
          MarketDemandB={MarketDemandB}
          SalaryDistributionA={SalaryDistributionA}
          SalaryDistributionB={SalaryDistributionB}
          TopJobsA={TopJobsA}
          TopJobsB={TopJobsB}
          RelatedSkillsA={RelatedSkillsA}
          RelatedSkillsB={RelatedSkillsB}
          SkillSalaryStatsA={SkillSalaryStatsA}
          SkillSalaryStatsB={SkillSalaryStatsB}
        />
        <UpgradeModal />
      </div>
    </CompareSkillsProvider>
  )
} 