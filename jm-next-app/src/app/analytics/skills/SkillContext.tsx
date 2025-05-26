"use client"
import { createContext, useContext, useState } from 'react';

type SkillContextType = {
    selectedSkill: string | null;
    setSelectedSkill: (skill: string) => void;
    skillData: any | null;
    setSkillData: (data: any) => void;
    tier: string;
    setTier: (tier: string) => void;
    showUpgradeModal: boolean;
    setShowUpgradeModal: (show: boolean) => void;
}

const SkillContext = createContext<SkillContextType | undefined>(undefined);

type SkillProviderProps = {
    children: React.ReactNode;
    initialTier: string;
}

export function SkillProvider({ children, initialTier }: SkillProviderProps) {
    const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
    const [skillData, setSkillData] = useState<any | null>(null);
    const [tier, setTier] = useState<string>(initialTier);
    const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);

    const handleSkillSelect = (skill: string) => {
        if (tier === "free") {
            setShowUpgradeModal(true);
        } else {
            setSelectedSkill(skill);
        }
    };

    return (
        <SkillContext.Provider value={{ 
            selectedSkill, 
            setSelectedSkill: handleSkillSelect, 
            skillData, 
            setSkillData,
            tier,
            setTier,
            showUpgradeModal,
            setShowUpgradeModal
        }}>
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
