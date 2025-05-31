import { getTier, getRoleData, getRolesClient } from '@/lib/rolePageDataAccessLayer';
import { RoleProvider } from '../roles/RoleContext'
import SearchContainer from '../roles/SearchContainer'
import BentoLayout from '../roles/bentoLayout'
import UpgradeModal from '../roles/UpgradeModal'

// Server Action for fetching role data
async function fetchRoleData(category: string, subcategory: string, tier: string) {
  'use server'
  return await getRoleData(category, subcategory, tier)
}

export default async function Layout({
  children,
  RoleSalaryStats,
  RoleSalaryDistribution,
  RoleMarketDemand,
  RoleTopSkills,
  RoleLocations

}: {
  children: React.ReactNode
  RoleSalaryStats: React.ReactNode
  RoleSalaryDistribution: React.ReactNode
  RoleMarketDemand: React.ReactNode
  RoleTopSkills: React.ReactNode
  RoleLocations: React.ReactNode
}) {
  // Fetch searchable roles during SSR
  const tier = await getTier();
  const roles = await getRolesClient(tier);

  return (
    <RoleProvider initialTier={tier}>
      <div>
        <h1 className="text-4xl font-bold text-center mb-6">Compare Roles</h1>
        <SearchContainer roles={roles} fetchRoleData={fetchRoleData}>
          {children}
        </SearchContainer>

        <BentoLayout RoleSalaryStats={RoleSalaryStats} RoleSalaryDistribution={RoleSalaryDistribution} RoleMarketDemand={RoleMarketDemand} RoleTopSkills={RoleTopSkills} RoleLocations={RoleLocations} />
        <UpgradeModal />
      </div>
    </RoleProvider>
  )
} 