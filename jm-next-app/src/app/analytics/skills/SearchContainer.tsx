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
    const { selectedSkill, setSelectedSkill, setSkillData } = useSkill();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');


    const handleSkillClick = async (skill: string) => {
        setSelectedSkill(skill);
        setSearchQuery(skill);
        setIsDropdownOpen(false);
        const data = await fetchSkillData(skill);
        setSkillData(data);
    };
    

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setSelectedSkill('');
        setIsDropdownOpen(true);
        console.log("searchQuery", searchQuery);
    };

    const filteredSkills = skills.filter(skill => 
        skill._id.toString().toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="relative w-full max-w-2xl mx-auto mb-8">
            <div className="flex items-center">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={handleInputChange}
                    placeholder="Search skills..."
                    className="w-full px-4 py-2 rounded-lg border border-m-light-green focus:outline-none focus:ring-2 focus:ring-m-light-green focus:border-transparent"
                    onFocus={() => setIsDropdownOpen(true)}
                />
                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="ml-2 p-2 px-4 rounded-lg border-2 border-m-dark-green hover:bg-m-light-green"
                >
                    {isDropdownOpen ? '↑' : '↓'}
                </button>
            </div>

            {isDropdownOpen && filteredSkills.length > 0 && (
                <div className="absolute w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                    {filteredSkills.map((skill) => (
                        <div
                            key={skill._id}
                            onClick={() => handleSkillClick(skill._id)}
                            className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${
                                selectedSkill === skill._id ? 'bg-blue-50' : ''
                            }`}
                        >
                            {skill._id}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}