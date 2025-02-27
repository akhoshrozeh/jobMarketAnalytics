"use client"
import { createContext, useContext, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
interface SearchContextType {
  query: string;
  setQuery: (query: string) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSetQuery = (newQuery: string) => {
    console.log('Search query updated:', newQuery);
    const currentPath = window.location.pathname;
    router.push(`${currentPath}?query=${newQuery}`);
    setQuery(newQuery);
  };
  
  return (
    <SearchContext.Provider value={{ query, setQuery: handleSetQuery }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
}