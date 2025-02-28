import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import NavbarAuthLarge from './NavbarAuthLarge'
import NavBarAuthSmall from './NavBarAuthSmall'
import { verifyIdToken } from '../../utils/verifyToken'
import CheckExpiredToken from './CheckExpiredToken'

export default async function Navbar() {

  const verificationResult = await verifyIdToken();
  let tier = "free";
  let isLoggedIn = false;
  
  if (verificationResult.expired) {
    // Token is expired - we'll handle this with CheckExpiredToken component
    tier = "expired";
  } else if (verificationResult.payload) {
    // Valid token with payload
    isLoggedIn = true;
    tier = verificationResult.payload?.["custom:tier"] as string || "free";
  }



  

  return (
    <Disclosure as="nav" className="border-b-2 border-m-dark-green">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-20">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center justify-between flex-1">
            <div className="shrink-0 text-m-light-green font-bold text-2xl bg-black p-2 rounded-xl">
              Job<span className="text-emerald-500">Trendr</span>
            </div>
            <div className="hidden md:block text-black flex-1">
              <div className="flex space-x-8 justify-center">
                {/* Current: "bg-gray-900 text-white", Default: "text-gray-300 hover:bg-gray-700 hover:text-white" */}
                <Link 
                  href="/" 
                  className="rounded-xl px-2 py-2  text-md font-medium text-black hover:bg-m-light-green hover:text-black"
                >
                  Home
                </Link>
                <Link
                  href="/analytics/overview"
                  className="rounded-xl px-2 py-2 text-md font-medium text-black hover:bg-m-light-green hover:text-black"
                >
                  Analytics
                </Link>
                <Link
                  href="/pricing"
                  className="rounded-xl px-2 py-2 text-md font-medium text-black hover:bg-m-light-green hover:text-black"
                >
                  Pricing
                </Link>
              </div>
            </div>
          </div>

          <CheckExpiredToken isExpired={verificationResult.expired} />



            <NavbarAuthLarge isLoggedIn={isLoggedIn} tier={tier} />



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
            className="block rounded-md px-3 py-2 text-base font-medium text-white hover:bg-gray-700 hover:text-white"
          >
            Home
          </DisclosureButton>
          <DisclosureButton
            as="a"
            href="/analytics/overview"
            className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            Analytics
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

                <NavBarAuthSmall isLoggedIn={isLoggedIn} tier={tier}/>


            {/* </div> */}
          </div>
        </div>
      </DisclosurePanel>
    </Disclosure>
  )
}