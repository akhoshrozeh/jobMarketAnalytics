"use client"
import { createContext, useEffect, useState, useContext } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { Amplify } from "aws-amplify";
import config from '../amplify_config'

Amplify.configure(config as any)

// export const AuthContext = createContext({})

type AuthContextType = {
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
}

export const AuthContext = createContext<AuthContextType | any | undefined>(undefined);


export const AuthProvider = ({
    children,
  }: {
    children: React.ReactNode
  }) => {
    console.log("AuthProvider rendered");
    const [session, setSession] = useState("LOADING");
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const getSession = async () => {
      try {
        console.log("getting session");
        const session = await fetchAuthSession();
        setSession(session as any);
        console.log("session set", session);
        setIsAuthenticated(true);

      } catch (error) {
        console.log("Error fetching session:", error);
        return null;
      }
    }

    useEffect(() => {
      console.log("getting session in use effect");
        getSession();
    }, []);


    return (
      <AuthContext.Provider value={{ session, isAuthenticated, setIsAuthenticated }}>
        {children}
      </AuthContext.Provider>
    )
  }

  export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
      throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
  }