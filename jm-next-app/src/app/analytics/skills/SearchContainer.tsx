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
    const [skillInputFocused, setSkillInputFocused] = useState(false);
    const [skillButtonFocused, setSkillButtonFocused] = useState(false);

    const isSkillFocused = skillInputFocused || skillButtonFocused;

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

        setIsLoading(true);
        const data = await fetchSkillData(skill);
        setSkillData(data);
        setSelectedSkill(skill);
        setSearchQuery(skill);
        setIsDropdownOpen(false);
        setIsLoading(false);
    };

    const handleClearSkill = () => {
        if (tier === "free") {
            setShowUpgradeModal(true);
            return;
        }
        setSelectedSkill('');
        setSearchQuery('');
        setIsDropdownOpen(false);
        setSkillData(null);
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (tier === "free") {
            setShowUpgradeModal(true);
            return;
        }
        setSearchQuery(e.target.value);
        setIsDropdownOpen(true);
    };

    const filteredSkills = skills
        .filter(skill => 
            skill._id.toString().toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => b.totalOccurences - a.totalOccurences);

    // console.log('Filtered Skills:', filteredSkills.map(skill => skill._id.toString()));

    return (
        <div className="relative w-full max-w-2xl mx-auto mb-8" onClick={handleContainerClick}>
            <div className="flex items-center">
                <div className="relative flex-1">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={handleInputChange}
                        placeholder="Search skills..."
                        className={`w-full px-4 py-2 pr-10 rounded-l-lg border-2 border-r-0 border-m-dark-green focus:outline-none ${isSkillFocused ? 'ring-2 ring-m-dark-green' : ''}`}
                        onFocus={() => {
                            if (tier !== "free") {
                                setIsDropdownOpen(true);
                                setSkillInputFocused(true);
                            }
                        }}
                        onBlur={() => setSkillInputFocused(false)}
                    />
                    {searchQuery && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleClearSkill();
                            }}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                        >
                            ✕
                        </button>
                    )}
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (tier === "free") {
                            setShowUpgradeModal(true);
                            return;
                        }
                        setIsDropdownOpen(!isDropdownOpen);
                    }}
                    onFocus={() => setSkillButtonFocused(true)}
                    onBlur={() => setSkillButtonFocused(false)}
                    className={`p-2 px-4 rounded-r-lg border-2 border-m-dark-green hover:bg-m-light-green focus:outline-none ${isSkillFocused ? 'ring-2 ring-m-dark-green' : ''}`}
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