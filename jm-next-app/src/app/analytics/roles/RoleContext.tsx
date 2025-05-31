"use client"
import { createContext, useContext, useState, ReactNode } from 'react';

type RoleContextType = {
    selectedRole: string;
    setSelectedRole: (role: string) => void;
    selectedSubcategory: string;
    setSelectedSubcategory: (subcategory: string) => void;
    roleData: any;
    setRoleData: (data: any) => void;
    tier: string;
    setTier: (tier: string) => void;
    showUpgradeModal: boolean;
    setShowUpgradeModal: (show: boolean) => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
};

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children, initialTier }: { children: ReactNode, initialTier: string }) {
    const [selectedRole, setSelectedRole] = useState('');
    const [selectedSubcategory, setSelectedSubcategory] = useState('');
    const [roleData, setRoleData] = useState(null);
    const [tier, setTier] = useState(initialTier);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    return (
        <RoleContext.Provider value={{
            selectedRole,
            setSelectedRole,
            selectedSubcategory,
            setSelectedSubcategory,
            roleData,
            setRoleData,
            tier,
            setTier,
            showUpgradeModal,
            setShowUpgradeModal,
            isLoading,
            setIsLoading
        }}>
            {children}
        </RoleContext.Provider>
    );
}

export function useRole() {
    const context = useContext(RoleContext);
    if (context === undefined) {
        throw new Error('useRole must be used within a RoleProvider');
    }
    return context;
}
