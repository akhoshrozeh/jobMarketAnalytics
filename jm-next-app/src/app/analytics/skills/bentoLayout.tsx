"use client"
import { useSkill } from "./SkillContext"

export default function BentoLayout(
    {   
        TotalJobs,
        Salary,
        Grade,
        TopJobs,
        RelatedSkills
    }:{
        TotalJobs: React.ReactNode,
        Salary: React.ReactNode,
        Grade: React.ReactNode,
        TopJobs: React.ReactNode,
        RelatedSkills: React.ReactNode
    }) {
    const { skillData, selectedSkill, isLoading } = useSkill()
    
    return (
        <>
            {isLoading && (
                <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-m-dark-green"></div>
                    <div className="text-xl font-medium text-gray-800">
                        Analyzing <span className="font-bold">{selectedSkill}</span> market insights...
                    </div>
                </div>
            )}
            <div className="container mx-auto p-4">
                {skillData ? (
                    <div className="grid grid-cols-1 lg:grid-cols-6 grid-rows-24 gap-4 text-center">
                        <div className="rounded-lg shadow p-4 shadow-gray-300 shadow-md border border-gray-200 h-full flex flex-col bg-slate-100/50">
                            <h2 className="text-lg font-semibold mb-2 text-gray-700">📊 Total Jobs</h2>
                            <div className="flex-1 flex items-center justify-center">
                                <div className="md:text-2xl lg:text-4xl font-bold">
                                    {TotalJobs}
                                </div>
                            </div>
                        </div>
                        
                        <div className="rounded-lg shadow p-4 shadow-gray-300 shadow-md border border-gray-200 lg:col-span-5 lg:row-span-1 bg-slate-100/50">
                            <h2 className="text-xl font-semibold mb-2 text-gray-700">💰 Salary Distribution</h2>
                                {Salary}
                        </div>
                        
                        <div className="rounded-lg shadow p-4 shadow-gray-300 shadow-md border border-gray-200 lg:col-span-2 bg-slate-100/50">
                            <h2 className="text-lg font-semibold mb-2 text-gray-700">🌍 Remote 📍Onsite</h2>
                            {Grade}
                        </div>
                        
                        <div className="rounded-lg shadow p-4 shadow-gray-300 shadow-md border border-gray-200 lg:col-span-3 bg-slate-100/50">
                            <h2 className="text-lg font-semibold mb-2 text-gray-700">Related Skills</h2>
                            <div className="flex items-center justify-center">
                                {RelatedSkills}
                            </div>
                        </div>
                        
                        <div className="rounded-lg shadow p-4 shadow-gray-300 shadow-md border border-gray-200 lg:col-span-3 bg-slate-100/50">
                            <h2 className="text-lg font-semibold mb-2 text-gray-700">Top Job Titles</h2>
                            {TopJobs}
                        </div>
                    </div>
                ) : (
                    <div className="mt-16 flex justify-center items-center w-full">
                        <div className="inline-flex flex justify-center items-center ring-2 ring-m-dark-green rounded-lg p-4 text-lg md:text-2xl font-semibold text-black bg-white shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-r from-white via-gray-50 to-white hover:from-gray-50 hover:via-white hover:to-gray-50">
                            ✨ ☝️ Select or search for a skill! ☝️ ✨
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}