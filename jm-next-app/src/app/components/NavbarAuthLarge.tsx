import Link from "next/link"
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react"
// import Image from "next/image"
// import { BellIcon } from '@heroicons/react/24/outline'
import SignOutButton from "./SignOutButton"
import {Cog6ToothIcon} from "@heroicons/react/24/outline"


export default async function NavbarAuthLarge({isLoggedIn, tier}: {isLoggedIn: boolean | string, tier: string}) {

  return (
      <div>
        {isLoggedIn ? (
          <div className="hidden sm:ml-6 sm:block">
          <div className="flex items-center">
            {/* <button
              type="button"
              className="relative rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
            >
              <span className="absolute -inset-1.5" />
              <span className="sr-only">View notifications</span>
              <BellIcon aria-hidden="true" className="size-6" />
            </button> */}
          

              {/* Profile dropdown */}
              <div>
                {tier}
              </div>
              <Menu as="div" className="relative ml-3">
                <div>
                  <MenuButton className="relative flex ">
                    <span className="absolute -inset-1.5" />
                    <span className="sr-only">Open user menu</span>
                    <Cog6ToothIcon aria-hidden="true" className="h-6 w-6" />
                    {/* <Image
                      alt=""
                      src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/BrownSpiderMonkey_%28edit2%29.jpg/1920px-BrownSpiderMonkey_%28edit2%29.jpg"
                      className="size-8 rounded-full"
                      height={32}
                      width={32}
                    /> */}
                  </MenuButton>
                </div>
                <MenuItems
                  transition
                  className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-black border-2 border-emerald-500 py-1 shadow-lg ring-1 ring-black/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
                >
                  <MenuItem>
                    <Link
                      href="#profile"
                      className="block px-4 py-2 text-sm text-white data-[focus]:bg-emerald-500/80 data-[focus]:outline-none"
                    >
                      Profile
                    </Link>
                  </MenuItem>
                  <MenuItem>
                    <Link
                      href="#settings"
                      className="block px-4 py-2 text-sm text-white data-[focus]:bg-emerald-500/80 data-[focus]:outline-none"
                    >
                      Settings
                    </Link>
                  </MenuItem>
                    <MenuItem as="div" className="block px-4 py-2 text-sm text-white data-[focus]:bg-emerald-500/80 data-[focus]:outline-none">
                  <SignOutButton />
                  </MenuItem>
                </MenuItems>
              </Menu>
          </div>
        </div>

        ) : (
          <div className="hidden sm:block">
          <Link href="/login" className="rounded-md px-3 py-2 text-md font-bold text-white/90 bg-emerald-500/90">
              Login
          </Link>
          </div>
        )}
      </div>
    );
}