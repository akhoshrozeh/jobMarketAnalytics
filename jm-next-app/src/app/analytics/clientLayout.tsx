'use client'

import Sidebar from "./Sidebar"
import { SearchProvider } from './context/SearchContext'


export default function ClientLayout({
  children,
  tier
}: {
  children: React.ReactNode
  tier: 'free' | 'basic' | 'premium'
}) {
  return (
    <SearchProvider>
      <div>
        <Sidebar tier={tier}>
          {children}
        </Sidebar>
      </div>
    </SearchProvider>
  )
}
