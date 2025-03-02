import TopSkills from "./TopSkills"
import AverageSalary from "./AverageSalary"
import TotalJobs from "./TotalJobs"
import RemoteVsOnsite from "./RemoteVsOnsite"

export default function Overview() {
    return (
        <div className="container md:mx-auto p-4">
            <div className="flex justify-center items-center">
                <h1 className="text-3xl font-bold mb-6 text-center">Job Market Overview</h1>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-6 grid-rows-24 gap-4 text-center ">
                {/* Top Skills - Takes full width on first row */}
                
                {/* Second row - smaller components side by side */}
                <div className="rounded-lg shadow p-4 border border-black h-full flex flex-col bg-white/50">
                    <h2 className="text-lg font-semibold mb-2 text-gray-700">📊 Total Jobs Analyzed</h2>
                    <div className="flex-1 flex items-center justify-center">
                        <div className="md:text-2xl lg:text-4xl font-bold">
                            <TotalJobs/>
                        </div>
                    </div>
                </div>
                
                <div className="rounded-lg shadow p-4 border border-black md:row-span-1 bg-white/50">
                    <h2 className="text-lg font-semibold mb-2 text-gray-700 ">💰 Average Salaries</h2>
                    <div className="text-md lg:text-xl xl:text-2xl">
                        <AverageSalary/>
                    </div>
                </div>
                <div className="rounded-lg shadow p-4 border border-black md:col-span-4 md:row-span-2 bg-white/50">
                    <h2 className="text-xl font-semibold mb-2">🛠️✨ Top Skills</h2>
                    <TopSkills/>
                </div>
                
                <div className="rounded-lg shadow p-4 border border-black md:col-span-2 bg-white/50">
                    <h2 className="text-lg font-semibold mb-2 text-gray-700">🌍 Remote 📍Onsite</h2>
                    <RemoteVsOnsite/>
                </div>
                
                <div className="rounded-lg shadow p-4 border border-black bg-white/50">
                    <h2 className="text-lg font-semibold mb-2 text-gray-700">Job Locations</h2>
                    {/* Add locations component here */}
                </div>
                
                {/* Job Trends - Takes full width on third row */}
                <div className="rounded-lg shadow p-4 border border-black md:col-span-4 bg-white/50">
                    <h2 className="text-lg font-semibold mb-2 text-center text-gray-700">Job Trends</h2>
                    <p className="text-gray-600">Chart showing job posting trends over time</p>
                    {/* Add chart component here */}
                </div>
            </div>
        </div>
    )
}
