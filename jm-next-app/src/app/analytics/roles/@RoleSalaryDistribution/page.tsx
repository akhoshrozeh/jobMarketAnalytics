"use client"
import { useRole } from "../RoleContext";
import { SalaryDistributionGraph } from "../RolesPageGraphs";

export default function SalaryDistribution() {
    const { roleData, selectedRole, selectedSubcategory } = useRole();

    // Only re-render when we have data
    if (!roleData?.salaryDistributionForRole) {
        return null;
    }

    const currentSkillData = roleData.salaryDistributionForRole;
    // Only use the data to determine when to re-render
    const key = `data-${currentSkillData.totalJobs[0].total}`;

    return (
        <div className="text-center text-xl">
            <SalaryDistributionGraph 
                key={key}
                selectedRole={selectedRole} 
                selectedSubcategory={selectedSubcategory}
                totalJobs={currentSkillData.totalJobs[0].total} 
                minSalaries={currentSkillData.minSalaries} 
                maxSalaries={currentSkillData.maxSalaries} 
            />
        </div>
    )
}