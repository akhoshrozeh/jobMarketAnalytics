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
                    Tier: {tier}
                    </DisclosurePanel>

                    <DisclosureButton
                    as="a"
                    href="#"
                    className="block rounded-md px-1 py-2 text-base font-medium text-black"
                    >
                    Profile
                    </DisclosureButton>
                    

                    <DisclosureButton
                    as="div"
                    
                    className="block rounded-md px-1 py-2 text-whitefont-medium text-black"
                    >
                    <SignOutButton />
                    </DisclosureButton>
                </div>
            </div>
            ) : (
                <div>
                    <DisclosureButton
                    as="a"
                    href="/login"
                    className="block rounded-md px-1 py-2 text-base font-medium text-black"
                    >
                        <span className="relative inline-block group">
                            Login
                            <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-0 h-0.5 bg-m-dark-green transition-all duration-300 group-hover:w-full" />
                        </span>
                    </DisclosureButton>
                </div>
            )}


        </div>
    )
}