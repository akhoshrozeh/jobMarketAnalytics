"use client"

import { signOut } from "aws-amplify/auth";
import { Amplify } from "aws-amplify";
import config from "../../amplify_config";
import { Button } from "@headlessui/react";
import { useRouter } from "next/navigation";


Amplify.configure(config as any, {
    ssr: true
});

export default function SignOutButton() {
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut();
        window.location.href = '/';

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