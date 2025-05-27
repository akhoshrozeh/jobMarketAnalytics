import { getTopSkillsClient, getTier, getSkillData } from '@/lib/dataAcessLayer';
import { SkillProvider } from './SkillContext'
import SearchContainer from './SearchContainer'
import BentoLayout from './bentoLayout'
import UpgradeModal from './UpgradeModal'

// Server Action for fetching skill data
async function fetchSkillData(skill: string) {
  'use server'
  return await getSkillData(skill)
}

export default async function Layout({
  children,
  TopSkills,
  TotalJobs,
  SalaryDistribution,
  Grade,
  TopJobs,
  RelatedSkills
}: {
  children: React.ReactNode
  TopSkills: React.ReactNode
  TotalJobs: React.ReactNode
  SalaryDistribution: React.ReactNode
  Grade: React.ReactNode
  TopJobs: React.ReactNode
  RelatedSkills: React.ReactNode
}) {
  // Fetch searchable skills during SSR
  const tier = await getTier();
  const skills = tier === "free" ? [] : await getTopSkillsClient(tier);

  return (
    <SkillProvider initialTier={tier}>
      <div>
        <h1 className="text-3xl font-bold text-center mb-6">Skills Research</h1>
        <SearchContainer skills={skills} fetchSkillData={fetchSkillData}>
          {TopSkills}
        </SearchContainer>

        <BentoLayout TotalJobs={TotalJobs} SalaryDistribution={SalaryDistribution} Grade={Grade} TopJobs={TopJobs} RelatedSkills={RelatedSkills} />
        <UpgradeModal />
      </div>
    </SkillProvider>
  )
}