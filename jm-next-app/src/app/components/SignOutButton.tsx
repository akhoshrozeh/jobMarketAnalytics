"use client"

import { signOut } from "aws-amplify/auth";
import { Button } from "@headlessui/react";

export default function SignOutButton() {
    const handleSignOut = async () => {
        await signOut();
        window.location.href = '/';
    }
    
    return (
        <Button
            className="w-full text-center font-semibold"
            onClick={handleSignOut}
        >
            Logout
        </Button>
    )
}