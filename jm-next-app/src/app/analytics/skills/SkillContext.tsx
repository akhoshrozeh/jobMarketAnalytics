"use client"
import { createContext, useContext, useState } from 'react';

type SkillContextType = {
    selectedSkill: string | null;
    setSelectedSkill: (skill: string) => void;
    skillData: any | null;
    setSkillData: (data: any) => void;
}

const SkillContext = createContext<SkillContextType | undefined>(undefined);

export function SkillProvider({ children }: { children: React.ReactNode }) {
    const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
    const [skillData, setSkillData] = useState<any | null>(null);
    console.log("selectedSkill", selectedSkill);

    return (
        <SkillContext.Provider value={{ selectedSkill, setSelectedSkill, skillData, setSkillData }}>
            {children}
        </SkillContext.Provider>
    );
}

export function useSkill() {
    const context = useContext(SkillContext);
    if (context === undefined) {
        throw new Error('useSkill must be used within a SkillProvider');
    }
    return context;
}
