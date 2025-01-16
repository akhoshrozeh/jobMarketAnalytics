import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems, Button } from '@headlessui/react'
import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import Image from 'next/image'
import NavbarAuthLarge from './NavbarAuthLarge'
import { signOut } from 'aws-amplify/auth'
import SignOutButton from './SignOutButton'
import NavBarAuthSmall from './NavBarAuthSmall'
import { cookies } from 'next/headers'

export default async function Navbar() {
  console.log("Navbar in the server");
  const cookieStore = await cookies()
  console.log("cookieStore:", cookieStore);

  return (
    <Disclosure as="nav" className="bg-gray-900 border-b border-indigo-500">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-20">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <div className="shrink-0">
              <img
                alt="Your Company"
                src="https://tailwindui.com/plus/img/logos/mark.svg?color=indigo&shade=500"
                className="h-8 w-auto"
              />
            </div>
            <div className="hidden sm:ml-6 sm:block">
              <div className="flex space-x-4">
                {/* Current: "bg-gray-900 text-white", Default: "text-gray-300 hover:bg-gray-700 hover:text-white" */}
                <Link href="/" className="rounded-md bg-gray-900 px-3 py-2 text-md font-bold text-white">
                  Home
                </Link>
                <Link
                  href="/metrics"
                  className="rounded-md px-3 py-2 text-md font-bold text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  Metrics
                </Link>
                <Link
                  href="/jobs"
                  className="rounded-md px-3 py-2 text-md font-bold text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  Jobs
                </Link>
                <Link
                  href="/pricing"
                  className="rounded-md px-3 py-2 text-md font-bold text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  Pricing
                </Link>
              </div>
            </div>
          </div>



            <NavbarAuthLarge />



          {/* Mobile menu */}
          <div className="-mr-2 flex sm:hidden">
            {/* Mobile menu button */}
            <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
              <span className="absolute -inset-0.5" />
              <span className="sr-only">Open main menu</span>
              <Bars3Icon aria-hidden="true" className="block size-6 group-data-[open]:hidden" />
              <XMarkIcon aria-hidden="true" className="hidden size-6 group-data-[open]:block" />
            </DisclosureButton>
          </div>
        </div>
      </div>
      
      <DisclosurePanel className="sm:hidden">
        <div className="space-y-1 px-2 pb-3 pt-2">
          {/* Current: "bg-gray-900 text-white", Default: "text-gray-300 hover:bg-gray-700 hover:text-white" */}
          <DisclosureButton
            as="a"
            href="/"
            className="block rounded-md bg-gray-900 px-3 py-2 text-base font-medium text-white"
          >
            Home
          </DisclosureButton>
          <DisclosureButton
            as="a"
            href="/metrics"
            className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            Metrics
          </DisclosureButton>
          <DisclosureButton
            as="a"
            href="/jobs"
            className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            Jobs
          </DisclosureButton>
          <DisclosureButton
            as="a"
            href="/pricing"
            className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            Pricing
          </DisclosureButton>
        </div>
        <div className="border-t border-gray-700 pt-2">
          <div className="space-y-1 px-2 pb-3">
            {/* <div className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"> */}

                <NavBarAuthSmall/>


            {/* </div> */}
          </div>
        </div>
      </DisclosurePanel>
    </Disclosure>
  )
}