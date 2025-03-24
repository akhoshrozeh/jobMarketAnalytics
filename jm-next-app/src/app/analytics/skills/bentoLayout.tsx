"use client"
import { useSkill } from "./SkillContext"
export default function BentoLayout(
    {   
        TotalJobs,
        Salary
    }:{
        TotalJobs: React.ReactNode,
        Salary: React.ReactNode
    }) {
    const { skillData, selectedSkill } = useSkill()
    
    return (
        skillData ? (
        <div className="container mx-auto p-4">
                
                <div className="grid grid-cols-1 lg:grid-cols-6 grid-rows-24 gap-4 text-center ">

                    <div className="rounded-lg shadow p-4 shadow-gray-300 shadow-md border border-gray-200 h-full flex flex-col bg-slate-100/50">
                        <h2 className="text-lg font-semibold mb-2 text-gray-700">📊 Total Jobs</h2>
                        <div className="flex-1 flex items-center justify-center">
                            <div className="md:text-2xl lg:text-4xl font-bold">
                                {TotalJobs}
                            </div>
                        </div>
                    </div>
                    
                    <div className="rounded-lg shadow p-4 shadow-gray-300 shadow-md border border-gray-200 lg:row-span-1 bg-slate-100/50">
                        <h2 className="text-lg font-semibold mb-2 text-gray-700 ">💰 Average Salary</h2>
                        <div className="text-md lg:text-xl xl:text-2xl">
                            {Salary}
                        </div>
                    </div>
                    <div className="rounded-lg shadow p-4 shadow-gray-300 shadow-md border border-gray-200 lg:col-span-4 lg:row-span-2 bg-slate-100/50">
                        <h2 className="text-xl font-semibold mb-2 text-gray-700">🛠️✨ Top Skills</h2>

                    </div>
                    
                    <div className="rounded-lg shadow p-4 shadow-gray-300 shadow-md border border-gray-200 lg:col-span-2 bg-slate-100/50">
                        <h2 className="text-lg font-semibold mb-2 text-gray-700">🌍 Remote 📍Onsite</h2>

                    </div>
                    
                    <div className="rounded-lg shadow p-4 shadow-gray-300 shadow-md border border-gray-200 lg:col-span-3 bg-slate-100/50">
                        <h2 className="text-lg font-semibold mb-2 text-gray-700">Top Locations</h2>
                        <div className="flex items-center justify-center">

                        </div>
                    </div>
                    
                    <div className="rounded-lg shadow p-4 shadow-gray-300 shadow-md border border-gray-200 lg:col-span-3 bg-slate-100/50">
                        <h2 className="text-lg font-semibold mb-2 text-gray-700">Top Job Titles</h2>

                    </div>

                    
                    
                </div>
        </div>) : (
            <div className="text-center text-lg md:text-2xl font-semibold text-black">
                ☝️ Select or search for a skill! ☝️
            </div>
        )
    )
}