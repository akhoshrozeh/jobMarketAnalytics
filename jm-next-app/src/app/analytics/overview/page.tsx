import TopSkillsPage from "../top-skills/page"
export default function Overview() {
    return (
        <div className="container mx-auto p-4 ">
            <h1 className="text-2xl font-bold mb-6">Job Market Overview</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Top row */}
                <div className="bg-white rounded-lg shadow p-4 md:col-span-2 border border-black">
                    <h2 className="text-lg font-semibold mb-2">Job Trends</h2>
                    <p className="text-gray-600">Chart showing job posting trends over time</p>
                    {/* Add chart component here */}
                </div>
                
                <div className="bg-white rounded-lg shadow p-4 border border-black">
                    <h2 className="text-lg font-semibold mb-2">Top Skills</h2>
                    <p className="text-gray-600">Most in-demand skills</p>
                    {/* Add skills list component here */}
                </div>
                
                {/* Middle row */}
                <div className="bg-white rounded-lg shadow p-4 border border-black">
                    <h2 className="text-lg font-semibold mb-2">Average Salary</h2>
                    <p className="text-gray-600">$85,000</p>
                    {/* Add salary component here */}
                </div>
                
                <div className="bg-white rounded-lg shadow p-4 border border-black">
                    <h2 className="text-lg font-semibold mb-2">Job Locations</h2>
                    <p className="text-gray-600">Top hiring cities</p>
                    {/* Add locations component here */}
                </div>
                
                <div className="bg-white rounded-lg shadow p-4 border border-black">
                    <h2 className="text-lg font-semibold mb-2">Experience Level</h2>
                    <p className="text-gray-600">Distribution by experience</p>
                    {/* Add experience chart here */}
                </div>
                
                {/* Bottom row */}
                <div className="bg-white rounded-lg shadow p-4 border border-black md:col-span-2">
                    <h2 className="text-lg font-semibold mb-2">Industry Breakdown</h2>
                    <p className="text-gray-600">Job distribution across industries</p>
                    {/* Add industry breakdown component here */}
                    <TopSkillsPage searchParams={{ query: "" }} />
                </div>
            </div>
        </div>
    )
}