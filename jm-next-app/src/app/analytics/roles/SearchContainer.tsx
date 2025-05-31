"use client"
import { useState } from 'react';
import { useRole } from './RoleContext';


export type CategoryData = {
  [generalCategory: string]: {
    totalCount: number;
    subcategories: {
      [subcategory: string]: number;
    }
  }
}

export default function SearchContainer({
    children,
    roles,
    fetchRoleData
}: {
    children: React.ReactNode
    roles: CategoryData | null
    fetchRoleData: (category: string, subcategory: string, tier: string) => Promise<any>
}) {
    const { selectedRole, setSelectedRole, selectedSubcategory, setSelectedSubcategory, setRoleData, tier, setShowUpgradeModal, setIsLoading } = useRole();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isSubcategoryDropdownOpen, setIsSubcategoryDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [subcategorySearchQuery, setSubcategorySearchQuery] = useState('');
    const [roleInputFocused, setRoleInputFocused] = useState(false);
    const [roleButtonFocused, setRoleButtonFocused] = useState(false);
    const [subcategoryInputFocused, setSubcategoryInputFocused] = useState(false);
    const [subcategoryButtonFocused, setSubcategoryButtonFocused] = useState(false);

    const isRoleFocused = roleInputFocused || roleButtonFocused;
    const isSubcategoryFocused = subcategoryInputFocused || subcategoryButtonFocused;

    const handleContainerClick = () => {
        if (tier === "free") {
            setShowUpgradeModal(true);
            return;
        }
    };

    const handleRoleClick = async (role: string) => {
        if (tier === "free") {
            setShowUpgradeModal(true);
            return;
        }

        setSelectedRole(role);
        setSearchQuery(role);
        setIsDropdownOpen(false);
        
        // Set default subcategory based on role
        if (role === "Other") {
            setSelectedSubcategory('All');
            setSubcategorySearchQuery('All');
            // Fetch data for "Other - All" immediately
            setIsLoading(true);
            const data = await fetchRoleData(role, 'All', tier);
            setRoleData(data);
            setIsLoading(false);
        } else {
            setSelectedSubcategory(''); // Reset subcategory when role changes
            setSubcategorySearchQuery('');
        }
        setIsSubcategoryDropdownOpen(false);
    };

    const handleSubcategoryClick = async (subcategory: string) => {
        if (tier === "free") {
            setShowUpgradeModal(true);
            return;
        }

        setIsLoading(true);
        const data = await fetchRoleData(selectedRole, subcategory, tier);
        setRoleData(data);
        setSelectedSubcategory(subcategory);
        setSubcategorySearchQuery(subcategory);
        setIsSubcategoryDropdownOpen(false);
        setIsLoading(false);
    };

    const handleSubcategoryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (tier === "free") {
            setShowUpgradeModal(true);
            return;
        }
        setSubcategorySearchQuery(e.target.value);
        setIsSubcategoryDropdownOpen(true);
    };

    const handleClearRole = () => {
        if (tier === "free") {
            setShowUpgradeModal(true);
            return;
        }
        // Only clear the input field, don't clear selectedRole context
        setSearchQuery('');
        setIsDropdownOpen(false);
        // Also clear subcategory input when role input is cleared
        setSubcategorySearchQuery('');
        setIsSubcategoryDropdownOpen(false);
        // Don't clear selectedRole, selectedSubcategory, or roleData - keep analytics on screen
    };

    const handleClearSubcategory = () => {
        if (tier === "free") {
            setShowUpgradeModal(true);
            return;
        }
        // Only clear the input field, don't clear selectedSubcategory context
        setSubcategorySearchQuery('');
        setIsSubcategoryDropdownOpen(false);
        // Don't clear selectedSubcategory or roleData - keep analytics on screen
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (tier === "free") {
            setShowUpgradeModal(true);
            return;
        }
        setSearchQuery(e.target.value);
        setIsDropdownOpen(true);
    };

    const filteredRoles = Object.keys(roles || {})
        .filter(role => 
            role.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => (roles?.[b]?.totalCount || 0) - (roles?.[a]?.totalCount || 0)); // Sort by totalCount descending

    const filteredSubcategories = selectedRole && roles?.[selectedRole]?.subcategories 
        ? ['All', ...Object.keys(roles[selectedRole].subcategories)]
            .filter(subcategory => 
                subcategory.toLowerCase().includes(subcategorySearchQuery.toLowerCase())
            )
            .sort((a, b) => {
                // Keep 'All' at the top
                if (a === 'All') return -1;
                if (b === 'All') return 1;
                // Sort other subcategories by their count descending
                const countA = roles[selectedRole].subcategories[a] || 0;
                const countB = roles[selectedRole].subcategories[b] || 0;
                return countB - countA;
            })
        : [];

    return (
        <div className="relative w-full max-w-2xl mx-auto mb-8" onClick={handleContainerClick}>
            <div className="flex items-center space-x-4">
                {/* Role dropdown */}
                <div className="flex-1">
                    <div className="flex items-center">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={handleInputChange}
                                placeholder="Search roles..."
                                className={`w-full px-4 py-2 pr-10 rounded-l-lg border-2 border-r-0 border-m-dark-green focus:outline-none ${isRoleFocused ? 'ring-2 ring-m-dark-green' : ''}`}
                                onFocus={() => {
                                    if (tier !== "free") {
                                        setIsDropdownOpen(true);
                                        setRoleInputFocused(true);
                                    }
                                }}
                                onBlur={() => setRoleInputFocused(false)}
                            />
                            {searchQuery && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleClearRole();
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
                            onFocus={() => setRoleButtonFocused(true)}
                            onBlur={() => setRoleButtonFocused(false)}
                            className={`p-2 px-4 rounded-r-lg border-2 border-m-dark-green hover:bg-m-light-green focus:outline-none ${isRoleFocused ? 'ring-2 ring-m-dark-green' : ''}`}
                        >
                            <span className={`inline-block transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}>
                                ↓
                            </span>
                        </button>
                    </div>

                    {isDropdownOpen && filteredRoles.length > 0 && (
                        <div className="absolute w-1/2 mt-1 bg-white border-2 border-m-light-green rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                            {filteredRoles.map((role) => (
                                <div
                                    key={role}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRoleClick(role);
                                    }}
                                    className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${
                                        selectedRole === role ? 'bg-blue-50' : ''
                                    }`}
                                >
                                    {role}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Subcategory dropdown */}
                <div className="flex-1">
                    <div className="flex items-center">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={subcategorySearchQuery}
                                onChange={handleSubcategoryInputChange}
                                placeholder={selectedRole ? "Search subcategories..." : "Select a role first"}
                                disabled={!selectedRole}
                                className={`w-full px-4 py-2 pr-10 rounded-l-lg border-2 border-r-0 border-m-dark-green focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed ${isSubcategoryFocused ? 'ring-2 ring-m-dark-green' : ''}`}
                                onFocus={() => {
                                    if (tier !== "free" && selectedRole) {
                                        setIsSubcategoryDropdownOpen(true);
                                        setSubcategoryInputFocused(true);
                                    }
                                }}
                                onBlur={() => setSubcategoryInputFocused(false)}
                            />
                            {subcategorySearchQuery && selectedRole && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleClearSubcategory();
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
                                if (selectedRole) {
                                    setIsSubcategoryDropdownOpen(!isSubcategoryDropdownOpen);
                                }
                            }}
                            onFocus={() => setSubcategoryButtonFocused(true)}
                            onBlur={() => setSubcategoryButtonFocused(false)}
                            disabled={!selectedRole}
                            className={`p-2 px-4 rounded-r-lg border-2 border-m-dark-green hover:bg-m-light-green focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed ${isSubcategoryFocused ? 'ring-2 ring-m-dark-green' : ''}`}
                        >
                            <span className={`inline-block transition-transform duration-200 ${isSubcategoryDropdownOpen ? 'rotate-180' : ''}`}>
                                ↓
                            </span>
                        </button>
                    </div>

                    {isSubcategoryDropdownOpen && filteredSubcategories.length > 0 && (
                        <div className="absolute w-1/2 right-0 mt-1 bg-white border-2 border-m-light-green rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                            {filteredSubcategories.map((subcategory) => (
                                <div
                                    key={subcategory}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSubcategoryClick(subcategory);
                                    }}
                                    className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${
                                        selectedSubcategory === subcategory ? 'bg-blue-50' : ''
                                    }`}
                                >
                                    {subcategory}
                                    <span className="text-gray-500 text-sm ml-2">
                                        {subcategory === 'All' 
                                            ? `(${roles?.[selectedRole]?.totalCount || 0})`
                                            : `(${roles?.[selectedRole]?.subcategories[subcategory] || 0})`
                                        }
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}