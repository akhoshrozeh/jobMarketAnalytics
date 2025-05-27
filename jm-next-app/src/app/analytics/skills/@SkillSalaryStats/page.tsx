"use client"
import { useSkill } from "../SkillContext";
import { formatCurrency } from "@/utils/formatCurrency";

export default function SkillSalaryStats() {
    const { skillData } = useSkill();
    const stats = skillData?.skillSalaryStats;

    if (!stats) return null;

    // Calculate jobs per skill ratio
    const jobsPerSkill = Math.round(stats.overallCount / stats.count);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
            {/* Average Salary Card */}
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-300 animate-fade-in [animation-delay:200ms] opacity-0 [animation-fill-mode:forwards]">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Average Salary</h3>
                <div className="text-3xl font-bold text-m-dark-green">
                    {formatCurrency(stats.mean)}
                </div>
                <div className="mt-2 text-sm text-gray-500">
                    Based on {stats.count.toLocaleString()} jobs
                </div>
            </div>

            {/* Market Comparison Card */}
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-300 animate-fade-in [animation-delay:400ms] opacity-0 [animation-fill-mode:forwards]">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Market Comparison</h3>
                <div className="text-3xl font-bold text-m-dark-green">
                    {formatCurrency(stats.overallMean)}
                </div>
                <div className="mt-2 text-sm text-gray-500">
                    Market average across {stats.overallCount.toLocaleString()} jobs
                </div>
            </div>

            {/* Salary Premium Card */}
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-300 animate-fade-in [animation-delay:600ms] opacity-0 [animation-fill-mode:forwards]">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Salary Premium</h3>
                <div className={`text-3xl font-bold ${stats.salaryPremium >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.salaryPremium >= 0 ? '+' : ''}{formatCurrency(stats.salaryPremium)}
                </div>
                <div className="mt-2 text-sm text-gray-500">
                    {stats.salaryPremiumPercentage >= 0 ? '+' : ''}{stats.salaryPremiumPercentage.toFixed(1)}% vs market
                </div>
            </div>

            {/* Popularity Card */}
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-300 animate-fade-in [animation-delay:800ms] opacity-0 [animation-fill-mode:forwards]">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Market Demand</h3>
                <div className="text-3xl font-bold text-m-dark-green">
                    1 in {jobsPerSkill}
                </div>
                <div className="mt-2 text-sm text-gray-500">
                    {stats.count.toLocaleString()} jobs require this skill
                </div>
            </div>
        </div>
    );
}