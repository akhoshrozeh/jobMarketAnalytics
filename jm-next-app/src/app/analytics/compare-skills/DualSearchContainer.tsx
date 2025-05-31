'use client'

import React, { useState } from 'react'
import { useCompareSkills } from './CompareSkillsContext'

interface Skill {
  _id: string
  totalOccurences: number
}

interface DualSearchContainerProps {
  skills: Skill[]
  fetchSkillData: (skill: string) => Promise<any>
  children: React.ReactNode
}

// Individual Search Component for each side
function SkillSearch({ 
  side, 
  skills, 
  fetchSkillData, 
  placeholder 
}: { 
  side: 'A' | 'B'
  skills: Skill[]
  fetchSkillData: (skill: string) => Promise<any>
  placeholder: string
}) {
  const context = useCompareSkills()
  const skillData = side === 'A' ? context.skillA : context.skillB
  const setSkill = side === 'A' ? context.setSkillA : context.setSkillB
  const setLoading = side === 'A' ? context.setSkillALoading : context.setSkillBLoading
  const setError = side === 'A' ? context.setSkillAError : context.setSkillBError
  const { initialTier, setShowUpgradeModal } = context

  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [skillInputFocused, setSkillInputFocused] = useState(false)
  const [skillButtonFocused, setSkillButtonFocused] = useState(false)

  const isSkillFocused = skillInputFocused || skillButtonFocused

  const handleContainerClick = () => {
    if (initialTier === "free") {
      setShowUpgradeModal(true)
      return
    }
  }

  const handleSkillClick = async (skillName: string) => {
    if (initialTier === "free") {
      setShowUpgradeModal(true)
      return
    }
    
    // Clear any existing error first
    setError(null)
    
    // Set loading state before the fetch
    setLoading(true)
    
    // Update UI state
    setSearchQuery(skillName)
    setIsDropdownOpen(false)
    
    try {
      const data = await fetchSkillData(skillName)
      
      // Only update if we're still mounted and this request is still relevant
      setSkill(skillName, data)
    } catch (error) {
      console.error(`${side}: Error loading skill:`, error)
      setError(`Failed to fetch data for ${skillName}`)
    } finally {
      // Always clear loading state
      setLoading(false)
    }
  }

  const handleClearSkill = () => {
    if (initialTier === "free") {
      setShowUpgradeModal(true)
      return
    }
    setSearchQuery('')
    setIsDropdownOpen(false)
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (initialTier === "free") {
      setShowUpgradeModal(true)
      return
    }
    setSearchQuery(e.target.value)
    setIsDropdownOpen(true)
  }

  const filteredSkills = skills
    .filter(skill => 
      skill._id.toString().toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => (b.totalOccurences || 0) - (a.totalOccurences || 0))


  return (
    <div className="flex-1">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {placeholder}
        </label>
        
       
        <div className="relative w-full" onClick={handleContainerClick}>
          <div className="flex items-center">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={handleInputChange}
                placeholder="Search skills..."
                className={`w-full px-4 py-2 pr-10 rounded-l-lg border-2 border-r-0 ${skillData.loading ? 'border-blue-400' : 'border-m-dark-green'} focus:outline-none ${isSkillFocused ? 'ring-2 ring-m-dark-green' : ''}`}
                onFocus={() => {
                  if (initialTier !== "free") {
                    setIsDropdownOpen(true)
                    setSkillInputFocused(true)
                  }
                }}
                onBlur={() => setSkillInputFocused(false)}
                disabled={skillData.loading}
              />
              {skillData.loading && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              )}
              {searchQuery && !skillData.loading && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleClearSkill()
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (initialTier === "free") {
                  setShowUpgradeModal(true)
                  return
                }
                setIsDropdownOpen(!isDropdownOpen)
              }}
              onFocus={() => setSkillButtonFocused(true)}
              onBlur={() => setSkillButtonFocused(false)}
              className={`p-2 px-4 rounded-r-lg border-2 ${skillData.loading ? 'border-blue-400 bg-blue-50' : 'border-m-dark-green hover:bg-m-light-green'} focus:outline-none ${isSkillFocused ? 'ring-2 ring-m-dark-green' : ''}`}
              disabled={skillData.loading}
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
                  key={`${side}-${skill._id.toString()}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSkillClick(skill._id.toString())
                  }}
                  className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${
                    skillData.skill === skill._id.toString() ? 'bg-blue-50' : ''
                  }`}
                >
                  {skill._id.toString()}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {skillData.loading && (
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-700 flex items-center font-medium">
              <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-600 mr-3"></span>
              Loading {searchQuery} analytics...
            </div>
          </div>
        )}
        
        {skillData.error && (
          <p className="mt-2 text-sm text-red-600">{skillData.error}</p>
        )}
        
        {skillData.skill && !skillData.loading && !skillData.error && (
          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700 flex items-center">
              <span className="mr-2">✓</span>
              {skillData.skill} data loaded successfully
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function DualSearchContainer({ skills, fetchSkillData, children }: DualSearchContainerProps) {
  
  return (
    <div className="mb-8">
      {/* Dual Search Interface */}
      <div className="flex flex-col lg:flex-row gap-6 mb-6">
        <SkillSearch 
          key="skill-search-a"
          side="A" 
          skills={skills} 
          fetchSkillData={fetchSkillData}
          placeholder="Skill A"
        />
        
        <div className="hidden lg:flex items-center justify-center px-4">
          <div className="text-2xl font-bold text-gray-400">VS</div>
        </div>
        
        <SkillSearch 
          key="skill-search-b"
          side="B" 
          skills={skills} 
          fetchSkillData={fetchSkillData}
          placeholder="Skill B"
        />
      </div>
      
      {/* Children (comparison interface) */}
      {children}
    </div>
  )
} 