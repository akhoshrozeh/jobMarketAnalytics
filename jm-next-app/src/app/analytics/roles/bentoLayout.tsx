"use client"
import { useRole } from "./RoleContext"

export default function BentoLayout({
    RoleSalaryStats,
    RoleSalaryDistribution,
    RoleMarketDemand,
    RoleTopSkills,
    RoleLocations
    }: {
    RoleSalaryStats: React.ReactNode
    RoleSalaryDistribution: React.ReactNode
    RoleMarketDemand: React.ReactNode
    RoleTopSkills: React.ReactNode
    RoleLocations: React.ReactNode
}) {
    const { roleData, selectedRole, selectedSubcategory, isLoading, tier } = useRole()
    console.log("roleData", roleData)
    
    return (
        <>
            {isLoading && (
                <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-m-dark-green"></div>
                    <div className="text-xl font-medium text-gray-800 animate-pulse">
                        Analyzing {selectedRole} market insights...
                    </div>
                </div>
            )}
            <div className="container mx-auto p-4">
                {roleData ? (
                    <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 text-center">
                        
                        <div className="rounded-lg shadow p-4 shadow-gray-300 shadow-md border border-gray-200 lg:col-span-2 lg:row-span-1 bg-slate-100/50">
                            <h2 className="text-xl font-semibold mb-2 text-black">📈 Salary Stats</h2>
                            <div className="flex items-center justify-center">
                                {RoleSalaryStats}
                            </div>
                        </div>
                        
                        <div className="rounded-lg shadow p-4 shadow-gray-300 shadow-md border border-gray-200 lg:col-span-4 lg:row-span-2 bg-slate-100/50">
                            <h2 className="text-xl font-semibold mb-2 text-black">💰 Salary Distribution</h2>
                            {RoleSalaryDistribution}
                        </div>
                        
                        
                        <div className="rounded-lg shadow p-4 shadow-gray-300 shadow-md border border-gray-200 flex flex-col bg-slate-100/50 lg:col-span-2 lg:row-span-1">
                            <h2 className="text-xl font-semibold mb-2 text-black">📊 Market Demand</h2>
                            <div className="flex-1">
                                {RoleMarketDemand}
                            </div>
                        </div>
                        
                        <div className="rounded-lg shadow p-4 shadow-gray-300 shadow-md border border-gray-200 lg:col-span-3 lg:row-span-1 bg-slate-100/50">
                            <h2 className="text-xl font-semibold mb-2 text-black">
                                🔗 Top Skills For {selectedSubcategory !== "All" && selectedSubcategory !== "Other" ? selectedSubcategory : selectedRole}
                            </h2>
                            <div className="flex items-center justify-center">
                                {RoleTopSkills}
                            </div>
                        </div>


                        
                        <div className="rounded-lg shadow p-4 shadow-gray-300 shadow-md border border-gray-200 lg:col-span-3 lg:row-span-1 bg-slate-100/50">
                            <h2 className="text-xl font-semibold mb-2 text-black">📍Role Locations</h2>
                            {RoleLocations}
                        </div>
                    </div>
                ) : (
                    <div className="mt-4 max-w-4xl mx-auto px-4">
                        <div className="text-center mb-16 animate-fade-in [animation-delay:200ms] opacity-0 [animation-fill-mode:forwards]">
                            <h2 className="text-3xl font-bold text-gray-800 mb-6">Discover Your Skill&apos;s Market Value</h2>
                            <p className="text-xl text-gray-600">
                                Make data-driven decisions about your career path with comprehensive skill analytics
                            </p>
                        </div>

                        <div className="space-y-12">
                            <div className="flex items-start gap-6 animate-fade-in [animation-delay:400ms] opacity-0 [animation-fill-mode:forwards]">
                                <div className="text-3xl">📊</div>
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Real-time Job Market Data</h3>
                                    <p className="text-gray-600">
                                        Get instant insights into job demand, salary ranges, and market trends for any tech skill. 
                                        Track opportunities across different regions and industries.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-6 animate-fade-in [animation-delay:600ms] opacity-0 [animation-fill-mode:forwards]">
                                <div className="text-3xl">💰</div>
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Salary Intelligence</h3>
                                    <p className="text-gray-600">
                                        Understand exactly what your skills are worth. Compare salary ranges from entry-level to senior positions, 
                                        and see how experience and location affect compensation.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-6 animate-fade-in [animation-delay:800ms] opacity-0 [animation-fill-mode:forwards]">
                                <div className="text-3xl">🎯</div>
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Career Path Planning</h3>
                                    <p className="text-gray-600">
                                        Discover related skills and job titles that complement your expertise. Build a competitive skill set 
                                        that opens more opportunities and accelerates your career growth.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-6 animate-fade-in [animation-delay:1000ms] opacity-0 [animation-fill-mode:forwards]">
                                <div className="text-3xl">🌍</div>
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Location & Remote Insights</h3>
                                    <p className="text-gray-600">
                                        Find out where your skills are most in demand. Explore remote work opportunities and understand 
                                        how location affects job availability and compensation.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {tier !== "premium" && (
                            <div className="mt-16 text-center animate-fade-in [animation-delay:1200ms] opacity-0 [animation-fill-mode:forwards]">
                                <div className="inline-block bg-gradient-to-r from-m-dark-green to-green-600 text-white px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                                    <h3 className="text-2xl font-bold mb-3">Upgrade to Premium</h3>
                                    <p className="text-lg text-white/90 mb-4">
                                        Get unlimited access to detailed skill analytics and personalized insights
                                    </p>
                                    <ul className="text-left text-white/90 space-y-2 mb-4">
                                        <li className="flex items-center gap-2">
                                            <span>✓</span> Comprehensive salary data
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span>✓</span> Detailed market trends
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span>✓</span> Career path recommendations
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    )
}