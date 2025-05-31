import { getTier, getRoleData, getRolesClient } from '@/lib/rolePageDataAccessLayer';
import { RoleProvider } from './RoleContext'
import SearchContainer from './SearchContainer'
import BentoLayout from './bentoLayout'
import UpgradeModal from './UpgradeModal'

// Server Action for fetching role data
async function fetchRoleData(category: string, subcategory: string, tier: string) {
  'use server'
  return await getRoleData(category, subcategory, tier)
}

export default async function Layout({
  children,
  RoleSalaryStats,
  RoleSalaryDistribution,
  RoleMarketDemand

}: {
  children: React.ReactNode
  RoleSalaryStats: React.ReactNode
  RoleSalaryDistribution: React.ReactNode
  RoleMarketDemand: React.ReactNode
}) {
  // Fetch searchable roles during SSR
  const tier = await getTier();
  const roles = await getRolesClient(tier);

  return (
    <RoleProvider initialTier={tier}>
      <div>
        <h1 className="text-4xl font-bold text-center mb-6">Role Insights</h1>
        <SearchContainer roles={roles} fetchRoleData={fetchRoleData}>
          {children}
        </SearchContainer>

        <BentoLayout RoleSalaryStats={RoleSalaryStats} RoleSalaryDistribution={RoleSalaryDistribution} RoleMarketDemand={RoleMarketDemand} />
        <UpgradeModal />
      </div>
    </RoleProvider>
  )
}