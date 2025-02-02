"use client"

import { useEffect } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import Link from "next/link";

export default function Confirmation() {
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (!urlParams.has('refreshed')) {
            const refreshAndReload = async () => {
                try {
                    await fetchAuthSession({ forceRefresh: true });
                    window.location.search = '?refreshed=true';
                } catch (error) {
                    console.error('Error refreshing session:', error);
                }
            };
            refreshAndReload();
        }
    }, []);
    
    return (
        <div className="mx-16">
            <h1 className="flex flex-col justify-center text-center mt-32 
              text-lg    
              md:text-xl  
              lg:text-2xl 
              xl:text-3xl 
              2xl:text-4xl"> 
                Thank you for purchasing a membership to JobTrendr!
            </h1>
           
            <Link 
              href="/metrics/top-skills" 
              className="flex flex-col justify-center text-center mt-16 
                text-base   
                md:text-lg  
                lg:text-xl  
                max-w-sm md:max-w-md mx-auto "
            >
                <button className="bg-emerald-500/80 hover:bg-emerald-500 text-white px-4 py-2 rounded-md
                  text-sm     
                  md:text-base 
                  lg:text-lg"> 
                    Get Started
                </button>
            </Link>
            
        </div>
    );
}