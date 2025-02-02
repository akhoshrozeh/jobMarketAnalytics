import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import NavbarAuthLarge from './NavbarAuthLarge'
import NavBarAuthSmall from './NavBarAuthSmall'
// import { existsIdToken } from '@/utils/existsToken'
import { verifyIdToken } from '../../utils/verifyToken'


export default async function Navbar() {

  const tokenPayload = await verifyIdToken();
  const tier = tokenPayload?.["custom:tier"] as string || "free";
  console.log(tier);
  const isLoggedIn = tokenPayload ? true : false;

  return (
    <Disclosure as="nav" className="bg-black border-b-2 border-emerald-500">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-20">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <div className="shrink-0 text-emerald-500 font-bold text-2xl">
              Job<span className="text-emc">Trendr</span>
            </div>
            <div className="hidden sm:ml-6 sm:block">
              <div className="flex space-x-4">
                {/* Current: "bg-gray-900 text-white", Default: "text-gray-300 hover:bg-gray-700 hover:text-white" */}
                <Link 
                  href="/" 
                  className="rounded-md px-3 py-2 text-md font-bold text-white hover:bg-gray-700 hover:text-white"
                >
                  Home
                </Link>
                <Link
                  href="/metrics/top-skills"
                  className="rounded-md px-3 py-2 text-md font-bold text-white hover:bg-gray-700 hover:text-white"
                >
                  Metrics
                </Link>
                <Link
                  href="/jobs"
                  className="rounded-md px-3 py-2 text-md font-bold text-white hover:bg-gray-700 hover:text-white"
                >
                  Jobs
                </Link>
                <Link
                  href="/pricing"
                  className="rounded-md px-3 py-2 text-md font-bold text-white hover:bg-gray-700 hover:text-white"
                >
                  Pricing
                </Link>
              </div>
            </div>
          </div>



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
            href="/metrics/top-skills"
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

                <NavBarAuthSmall isLoggedIn={isLoggedIn} tier={tier}/>


            {/* </div> */}
          </div>
        </div>
      </DisclosurePanel>
    </Disclosure>
  )
}