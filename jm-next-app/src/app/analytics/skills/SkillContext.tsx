"use client"
import { createContext, useContext, useState, ReactNode } from 'react';

type SkillContextType = {
    selectedSkill: string;
    setSelectedSkill: (skill: string) => void;
    skillData: any;
    setSkillData: (data: any) => void;
    tier: string;
    setTier: (tier: string) => void;
    showUpgradeModal: boolean;
    setShowUpgradeModal: (show: boolean) => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
};

const SkillContext = createContext<SkillContextType | undefined>(undefined);

export function SkillProvider({ children, initialTier }: { children: ReactNode, initialTier: string }) {
    const [selectedSkill, setSelectedSkill] = useState('');
    const [skillData, setSkillData] = useState(null);
    const [tier, setTier] = useState(initialTier);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    return (
        <SkillContext.Provider value={{
            selectedSkill,
            setSelectedSkill,
            skillData,
            setSkillData,
            tier,
            setTier,
            showUpgradeModal,
            setShowUpgradeModal,
            isLoading,
            setIsLoading,   

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
