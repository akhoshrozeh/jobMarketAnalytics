"use client"
import { useState } from 'react';
import { useSkill } from './SkillContext';

export default function SearchContainer({
    children,
    skills,
    fetchSkillData
}: {
    children: React.ReactNode
    skills: { _id: string, totalOccurences: number }[]
    fetchSkillData: (skill: string) => Promise<any>
}) {
    const { selectedSkill, setSelectedSkill, setSkillData, tier, setShowUpgradeModal, setIsLoading } = useSkill();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleContainerClick = () => {
        if (tier === "free") {
            setShowUpgradeModal(true);
            return;
        }
    };

    const handleSkillClick = async (skill: string) => {
        if (tier === "free") {
            setShowUpgradeModal(true);
            return;
        }
        setSelectedSkill(skill);
        setSearchQuery(skill);
        setIsDropdownOpen(false);
        setIsLoading(true);
        const data = await fetchSkillData(skill);
        setSkillData(data);
        setIsLoading(false);
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (tier === "free") {
            setShowUpgradeModal(true);
            return;
        }
        setSearchQuery(e.target.value);
        setSelectedSkill('');
        setIsDropdownOpen(true);
    };

    const filteredSkills = skills.filter(skill => 
        skill._id.toString().toLowerCase().includes(searchQuery.toLowerCase())
    );

    // console.log('Filtered Skills:', filteredSkills.map(skill => skill._id.toString()));

    return (
        <div className="relative w-full max-w-2xl mx-auto mb-8" onClick={handleContainerClick}>
            <div className="flex items-center">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={handleInputChange}
                    placeholder="Search skills..."
                    className="w-full px-4 py-2 rounded-lg border-2 border-m-light-green focus:outline-none focus:ring-2 focus:ring-m-dark-green focus:border-m-dark-green"
                    onFocus={() => tier !== "free" && setIsDropdownOpen(true)}
                />
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (tier === "free") {
                            setShowUpgradeModal(true);
                            return;
                        }
                        setIsDropdownOpen(!isDropdownOpen);
                    }}
                    className="ml-2 p-2 px-4 rounded-lg border-2 border-m-light-green hover:bg-m-light-green focus:outline-none focus:ring-2 focus:ring-m-dark-green focus:border-m-dark-green"
                >
                    <span className={`inline-block transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}>
                        ↓
                    </span>
                </button>
            </div>

            {isDropdownOpen && filteredSkills.length > 0 && (
                <div className="absolute w-full mt-1 bg-white border-2 border-m-light-green rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                    {filteredSkills.map((skill) => (
                        <div
                            key={skill._id}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSkillClick(skill._id);
                            }}
                            className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${
                                selectedSkill === skill._id ? 'bg-blue-50' : ''
                            }`}
                        >
                            {skill._id.toString()}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}