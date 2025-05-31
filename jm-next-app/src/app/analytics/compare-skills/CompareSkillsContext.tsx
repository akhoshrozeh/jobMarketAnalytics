'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface SkillData {
  skill: string
  data: any // Replace with your actual skill data type
  loading: boolean
  error: string | null
}

interface CompareSkillsContextType {
  skillA: SkillData
  skillB: SkillData
  setSkillA: (skill: string, data: any) => void
  setSkillB: (skill: string, data: any) => void
  setSkillALoading: (loading: boolean) => void
  setSkillBLoading: (loading: boolean) => void
  setSkillAError: (error: string | null) => void
  setSkillBError: (error: string | null) => void
  initialTier: string
  showUpgradeModal: boolean
  setShowUpgradeModal: (show: boolean) => void
}

const CompareSkillsContext = createContext<CompareSkillsContextType | undefined>(undefined)

export function useCompareSkills() {
  const context = useContext(CompareSkillsContext)
  if (context === undefined) {
    throw new Error('useCompareSkills must be used within a CompareSkillsProvider')
  }
  return context
}

interface CompareSkillsProviderProps {
  children: ReactNode
  initialTier: string
}

export function CompareSkillsProvider({ children, initialTier }: CompareSkillsProviderProps) {
  const [skillA, setSkillAState] = useState<SkillData>({
    skill: '',
    data: null,
    loading: false,
    error: null
  })

  const [skillB, setSkillBState] = useState<SkillData>({
    skill: '',
    data: null,
    loading: false,
    error: null
  })

  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const setSkillA = (skill: string, data: any) => {
    setSkillAState(prev => ({ ...prev, skill, data, loading: false, error: null }))
  }

  const setSkillB = (skill: string, data: any) => {
    setSkillBState(prev => ({ ...prev, skill, data, loading: false, error: null }))
  }

  const setSkillALoading = (loading: boolean) => {
    setSkillAState(prev => ({ ...prev, loading }))
  }

  const setSkillBLoading = (loading: boolean) => {
    setSkillBState(prev => ({ ...prev, loading }))
  }

  const setSkillAError = (error: string | null) => {
    setSkillAState(prev => ({ ...prev, error, loading: false }))
  }

  const setSkillBError = (error: string | null) => {
    setSkillBState(prev => ({ ...prev, error, loading: false }))
  }

  return (
    <CompareSkillsContext.Provider value={{
      skillA,
      skillB,
      setSkillA,
      setSkillB,
      setSkillALoading,
      setSkillBLoading,
      setSkillAError,
      setSkillBError,
      initialTier,
      showUpgradeModal,
      setShowUpgradeModal
    }}>
      {children}
    </CompareSkillsContext.Provider>
  )
} 