"use client"
import { AuthContext } from "@/context/AuthProvider"
import { useContext } from "react"
import Link from "next/link"
import { Menu, MenuButton, MenuItem, MenuItems, DisclosureButton} from "@headlessui/react"
import Image from "next/image"
import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/react/24/outline'
import SignOutButton from "./SignOutButton"

interface AuthContextType {
    tokens?: {
      signInDetails?: {
        loginId?: string;
      };
      idToken?: {
        payload?: {
          sub?: string;
        };
      };
    };
  }


export default function NavBarAuthSmall() {
    const sessionObj = useContext<AuthContextType>(AuthContext);
    console.log("session in navbar:", sessionObj);

    return (


        <div>
            {sessionObj.tokens?.signInDetails?.loginId ? (
            <div>
                <div className="flex items-center px-5">
                    <div className="shrink-0">
                    {/* <img
                        alt=""
                        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                        className="size-10 rounded-full"
                        /> */}
                    </div>
                    <div className="ml-3">
                    <div className="text-base font-medium text-white">{sessionObj.tokens?.signInDetails?.loginId}</div>
                    <div className="text-sm font-medium text-gray-400">{sessionObj.tokens?.idToken?.payload?.sub}</div>
                    </div>
                    <button
                    type="button"
                    className="relative ml-auto shrink-0 rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                    >
                    <span className="absolute -inset-1.5" />
                    <span className="sr-only">View notifications</span>
                    <BellIcon aria-hidden="true" className="size-6" />
                    </button>
                </div>
                <div className="mt-3 space-y-1 px-2">
                    <DisclosureButton
                    as="a"
                    href="#"
                    className="block rounded-md px-3 py-2 text-base font-medium text-gray-400 hover:bg-gray-700 hover:text-white"
                    >
                    Your Profile
                    </DisclosureButton>
                    <DisclosureButton
                    as="a"
                    href="#"
                    className="block rounded-md px-3 py-2 text-base font-medium text-gray-400 hover:bg-gray-700 hover:text-white"
                    >
                    Settings
                    </DisclosureButton>
                    <DisclosureButton
                    as="div"
                    
                    className="block rounded-md px-3 py-2 text-whitefont-medium text-gray-400 hover:bg-gray-700 hover:text-white"
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
                    className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                        Login   
                    </DisclosureButton>
                </div>
            )}


        </div>
    )
}