import { Disclosure, DisclosureButton, DisclosurePanel, Transition } from '@headlessui/react'
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
              <Link href="/" className="hover:opacity-80 transition-opacity">
                Job<span className="text-emerald-500">Trendr</span>
              </Link>
            </div>
            <div className="hidden md:block text-black flex-1">
              <div className="flex space-x-8 justify-center">
                <Link 
                  href="/" 
                  className="relative px-2 py-2 text-md font-medium text-black group " 
                >
                  Home
                  <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-0 h-0.5 bg-m-dark-green transition-all duration-300 group-hover:w-full" />
                </Link>
                <Link
                  href="/analytics/overview"
                  className="relative px-2 py-2 text-md font-medium text-black group"
                >
                  Analytics
                  <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-0 h-0.5 bg-m-dark-green transition-all duration-300 group-hover:w-full" />
                </Link>
                <Link
                  href="/pricing"
                  className="relative px-2 py-2 text-md font-medium text-black group"
                >
                  Pricing
                  <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-0 h-0.5 bg-m-dark-green transition-all duration-300 group-hover:w-full" />
                </Link>
              </div>
            </div>
          </div>

          <CheckExpiredToken isExpired={verificationResult.expired} />



            <NavbarAuthLarge isLoggedIn={isLoggedIn} tier={tier} />



          {/* Mobile menu */}
          <div className="-mr-2 flex md:hidden">
            {/* Mobile menu button */}
            <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-800 hover:bg-m-dark-green hover:text-white focus:outline-m-light-green focus:ring-2 focus:ring-inset focus:ring-m-dark-green">
              <span className="absolute -inset-0.5" />
              <span className="sr-only">Open main menu</span>
              <Bars3Icon aria-hidden="true" className="block size-6 group-data-[open]:hidden" />
              <XMarkIcon aria-hidden="true" className="hidden size-6 group-data-[open]:block" />
            </DisclosureButton>
          </div>
        </div>
      </div>
      
      <Transition
        enter="transition duration-200 ease-out"
        enterFrom="transform scale-95 opacity-0"
        enterTo="transform scale-100 opacity-100"
        leave="transition duration-150 ease-in"
        leaveFrom="transform scale-100 opacity-100"
        leaveTo="transform scale-95 opacity-0"
      >
        <DisclosurePanel className="md:hidden absolute w-full bg-white shadow-lg z-50 rounded-lg border-2 border-m-dark-green">
          <div className="space-y-2 px-4 py-3">
            <DisclosureButton
              as="a"
              href="/"
              className="block w-full px-3 py-2.5 text-base font-medium text-black hover:bg-m-dark-green/10 rounded-lg transition-colors duration-200 text-center"
            >
              <span className="relative inline-block group">
                Home
                <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-0 h-0.5 bg-m-dark-green transition-all duration-300 group-hover:w-full" />
              </span>
            </DisclosureButton>
            <DisclosureButton
              as="a"
              href="/analytics/overview"
              className="block w-full px-3 py-2.5 text-base font-medium text-black hover:bg-m-dark-green/10 rounded-lg transition-colors duration-200 text-center"
            >
              <span className="relative inline-block group">
                Analytics
                <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-0 h-0.5 bg-m-dark-green transition-all duration-300 group-hover:w-full" />
              </span>
            </DisclosureButton>
            <DisclosureButton
              as="a"
              href="/pricing"
              className="block w-full px-3 py-2.5 text-base font-medium text-black hover:bg-m-dark-green/10 rounded-lg transition-colors duration-200 text-center"
            >
              <span className="relative inline-block group">
                Pricing
                <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-0 h-0.5 bg-m-dark-green transition-all duration-300 group-hover:w-full" />
              </span>
            </DisclosureButton>
          </div>
          <div className="border-t border-gray-200 pt-2">
            <div className="px-4 pb-3">
              <NavBarAuthSmall isLoggedIn={isLoggedIn} tier={tier}/>
            </div>
          </div>
        </DisclosurePanel>
      </Transition>
    </Disclosure>
  )
}