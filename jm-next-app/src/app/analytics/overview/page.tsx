import { verifyIdToken } from "@/utils/verifyToken"
import { getOverviewData } from "@/lib/dataAcessLayer"
import TotalJobs from "./TotalJobs" 
import AverageSalary from "./AverageSalary"
import TopSkills from "./TopSkills"
import RemoteVsOnsite from "./RemoteVsOnsite"
import TopJobTitles from "./TopJobTitles"
import TopLocations from "./TopLocations"

export default async function Overview() {
    const tier = await verifyIdToken(); 
    const overviewData = await getOverviewData();

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-center items-center">
                <h1 className="text-3xl font-bold mb-6 text-center">Job Market Overview</h1>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-6 grid-rows-24 gap-4 text-center ">
                {/* Top Skills - Takes full width on first row */}
                
                {/* Second row - smaller components side by side */}
                <div className="rounded-lg shadow p-4 shadow-gray-300 shadow-md border border-gray-200 h-full flex flex-col bg-slate-100/50">
                    <h2 className="text-lg font-semibold mb-2 text-gray-700">📊 Total Jobs Analyzed</h2>
                    <div className="flex-1 flex items-center justify-center">
                        <div className="md:text-2xl lg:text-4xl font-bold">
                            <TotalJobs totalJobs={overviewData?.totalJobs || 0}/>
                        </div>
                    </div>
                </div>
                
                <div className="rounded-lg shadow p-4 shadow-gray-300 shadow-md border border-gray-200 lg:row-span-1 bg-slate-100/50">
                    <h2 className="text-lg font-semibold mb-2 text-gray-700 ">💰 Average Salaries</h2>
                    <div className="text-md lg:text-xl xl:text-2xl">
                        <AverageSalary avgMinSalary={overviewData?.averageSalary[0]?.avgMinSalary || 0} avgMaxSalary={overviewData?.averageSalary[0]?.avgMaxSalary || 0}/>
                    </div>
                </div>
                <div className="rounded-lg shadow p-4 shadow-gray-300 shadow-md border border-gray-200 lg:col-span-4 lg:row-span-2 bg-slate-100/50">
                    <h2 className="text-xl font-semibold mb-2 text-gray-700">🛠️✨ Top Skills</h2>
                    <TopSkills blurLabels={!tier.valid} topSkills={overviewData?.topSkills} totalJobs={overviewData?.totalJobs || 0}/>
                </div>
                
                <div className="rounded-lg shadow p-4 shadow-gray-300 shadow-md border border-gray-200 lg:col-span-2 bg-slate-100/50">
                    <h2 className="text-lg font-semibold mb-2 text-gray-700">🌍 Remote 📍Onsite</h2>
                    <RemoteVsOnsite remoteVsOnsiteJobs={overviewData?.remoteVsOnsiteJobs as { total: number; remote: number; nonRemote: number; }[]}/>
                </div>
                
                <div className="rounded-lg shadow p-4 shadow-gray-300 shadow-md border border-gray-200 lg:col-span-3 bg-slate-100/50">
                    <h2 className="text-lg font-semibold mb-2 text-gray-700">Top Locations</h2>
                    <div className="flex items-center justify-center">
                        <TopLocations topLocationsData={overviewData?.topLocations as {location: string, count: number, location_coords: number[]}[]}/>
                    </div>
                </div>
                
                <div className="rounded-lg shadow p-4 shadow-gray-300 shadow-md border border-gray-200 lg:col-span-3 bg-slate-100/50">
                    <h2 className="text-lg font-semibold mb-2 text-gray-700">Top Job Titles</h2>
                    <TopJobTitles topJobTitlesData={overviewData?.topJobTitles as {title: string, count: number}[]}/>
                </div>

                
                
            </div>
        </div>
    )
}
