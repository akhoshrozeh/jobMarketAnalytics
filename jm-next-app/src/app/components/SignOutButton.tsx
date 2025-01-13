"use client"

import { signOut } from "aws-amplify/auth";
import { Amplify } from "aws-amplify";
import config from "../../amplify_config";
import { Button } from "@headlessui/react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthProvider";

Amplify.configure(config as any);

export default function SignOutButton() {
    const router = useRouter();
    const {setIsAuthenticated} = useAuth();

    const handleSignOut = async () => {
        await signOut();
        setIsAuthenticated(false);
        router.push("/");
    }
    return (
        <Button
            className="w-full text-left"
            onClick={handleSignOut}
        >
            Logout
        </Button>
    )
}