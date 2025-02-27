"use client";


import { useEffect } from "react";
import { clearAuthCookies } from "@/app/actions/clearCookies";

export default function CheckExpiredToken({isExpired}: {isExpired: boolean}) {

    useEffect(() => {
        if(isExpired) {
            console.log("Tokens expired. Clearing cookies...")
            const checkToken = async () => {
                clearAuthCookies();
            };
            checkToken();
        }
    }, [isExpired]);

    return <></>
}

