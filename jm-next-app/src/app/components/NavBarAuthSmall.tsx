import { DisclosureButton, DisclosurePanel } from "@headlessui/react"
import { BellIcon } from '@heroicons/react/24/outline'
import SignOutButton from "./SignOutButton"


export default async function NavBarAuthSmall({isLoggedIn, tier}: {isLoggedIn: boolean | string, tier: string}) {

    return (
        <div>
            {isLoggedIn ? (
            <div>
               
                <div className="space-y-1 px-2">
                    <DisclosurePanel
                    as="div"
                    
                    className="block rounded-md px-1 py-2 text-base font-medium text-black"
                    >
                    {tier.charAt(0).toUpperCase() + tier.slice(1)}
                    </DisclosurePanel>
                    
                    <DisclosureButton
                    as="div"
                    
                    className="block rounded-md px-1 py-2 text-whitefont-medium text-black"
                    >
                    <SignOutButton />
                    </DisclosureButton>
                </div>
            </div>
            ) : (
                <div className="px-2 flex justify-center">
                    <DisclosureButton
                    as="a"
                    href="/login"
                    className="inline-block rounded-md px-3 py-2 text-md font-medium text-black bg-emerald-500 hover:bg-emerald-500/70 hover:text-gray-800"
                    >
                        Login
                    </DisclosureButton>
                </div>
            )}


        </div>
    )
}