import TopSkills from "./TopSkills"
import AverageSalary from "./AverageSalary"
import TotalJobs from "./TotalJobs"
export default function Overview() {
    return (
        <div className="container mx-auto p-4 ">
            <h1 className="text-2xl font-bold mb-6">Job Market Overview</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 text-center bg-white/50">
                {/* Top row */}
                <div className=" rounded-lg shadow p-4 md:col-span-2 border border-black md:col-span-4">
                    <h2 className="text-lg font-semibold mb-2 text-center">Job Trends</h2>
                    <p className="text-gray-600">Chart showing job posting trends over time</p>
                    {/* Add chart component here */}
                </div>
                
                <div className=" rounded-lg shadow p-4 border border-black">
                    <h2 className="text-xl font-semibold mb-2">Total Jobs Analyzed</h2>
                    <TotalJobs/>
                </div>
                
                {/* Middle row */}
                <div className=" rounded-lg shadow p-4 border border-black">
                    <h2 className="text-lg font-semibold mb-2">Average Salaries</h2>
                    <AverageSalary/>
                </div>
                
                <div className=" rounded-lg shadow p-4 border border-black">
                    <h2 className="text-lg font-semibold mb-2">Job Locations</h2>
                    <p className="text-gray-600">Top hiring cities</p>
                    {/* Add locations component here */}
                </div>
                
                <div className=" rounded-lg shadow p-4 border border-black">
                    <h2 className="text-lg font-semibold mb-2">Experience Level</h2>
                    <p className="text-gray-600">Distribution by experience</p>
                    {/* Add experience chart here */}
                </div>
                
                {/* Bottom row */}
                <div className=" rounded-lg shadow p-4 border border-black md:col-span-5">
                    <h2 className="text-lg font-semibold mb-2">Top Skills</h2>
                    <p className="text-gray-600">Job distribution across industries</p>
                    <TopSkills/>
                </div>
            </div>
        </div>
    )
}