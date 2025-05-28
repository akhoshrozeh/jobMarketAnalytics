'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Dialog, DialogBackdrop, DialogPanel, TransitionChild } from '@headlessui/react'
import {
  Bars3Icon,
  ShareIcon,
  XMarkIcon,
  GlobeAmericasIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  SparklesIcon,
  BriefcaseIcon,
  WrenchScrewdriverIcon,
  Square2StackIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'


const navigation = [
  { name: 'Market Overview', href: '/analytics/overview', icon: GlobeAmericasIcon, current: true, tier: 'free' },
  { name: 'Skills', href: '/analytics/skills', icon: WrenchScrewdriverIcon, current: false, tier: 'free' },
  { name: 'Roles', href: '/analytics/roles', icon: BriefcaseIcon, current: false, tier: 'free' },
  { name: 'Compare', href: '/analytics/compare', icon: Square2StackIcon, current: false, tier: 'free' },
  { name: 'Skill Relationships', href: '/analytics/skills-connectivity', icon: ShareIcon, current: false, tier: 'basic' },
]

const requestsNav = { 
  name: 'Requests', 
  href: 'https://insigh.to/b/jobtrendr', 
  icon: ChatBubbleOvalLeftEllipsisIcon, 
  current: false, 
  tier: 'free' 
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}







export default function Sidebar({children, tier}: {children: React.ReactNode, tier: 'free' | 'basic' | 'premium'}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeRequiredTier, setUpgradeRequiredTier] = useState<null | 'free' | 'basic' | 'premium'>(null)
  const pathname = usePathname()

  useEffect(() => {
    console.log(pathname)
  }, [pathname])

  const hasAccess = (requiredTier: string) => {
    const tierLevels = { free: 0, basic: 1, premium: 2 }
    return tierLevels[tier] >= tierLevels[requiredTier as keyof typeof tierLevels]
  }

  return (
    <>
      <div>
        <Dialog open={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} className="relative z-50">
          <DialogBackdrop className="fixed inset-0 bg-black/50" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <DialogPanel className="w-full max-w-md rounded-xl bg-black p-6 border-2 border-emc">
              <h3 className="text-lg font-semibold text-white">Upgrade Required</h3>
              <p className="mt-4 text-gray-300">
                {upgradeRequiredTier
                  ? `You need to upgrade your plan to the ${upgradeRequiredTier} tier to access this feature.`
                  : 'You need to upgrade your plan to access this feature.'}
              </p>
              <div className="mt-6 flex justify-end gap-4">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <Link
                  href="/pricing"
                  onClick={() => setShowUpgradeModal(false)}
                  className="px-4 py-2 bg-emc text-black rounded-md hover:bg-emerald-400"
                >
                  Upgrade Plan
                </Link>
              </div>
            </DialogPanel>
          </div>
        </Dialog>

        <Dialog open={sidebarOpen} onClose={setSidebarOpen} className="relative z-50">
          <DialogBackdrop
            transition
            className="fixed inset-0 bg-black/5 transition-opacity duration-300 ease-linear data-[closed]:opacity-0 backdrop-blur-sm"
          />

          <div className="fixed inset-0 flex">
            <DialogPanel
              transition
              className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-[closed]:-translate-x-full"
            >
              
              {/* Sidebar component, swap this element with another sidebar if you like */}
              <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-black px-6 pb-2 border-t-4 border-r-4 border-b-4  mb-4 rounded-tr-lg rounded-br-lg border-m-dark-green mt-16">
                <div className="flex h-16 shrink-0 items-center text-white font-semibold text-lg relative">
                    <button type="button" onClick={() => setSidebarOpen(false)} className="absolute left-0 -m-2.5 p-2.5">
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon aria-hidden="true" className="size-6 text-gray-400 bg-black rounded-3xl hover:text-white" />
                    </button>
                    <div className="w-full text-center">Analytics Dashboard</div>
                </div>
                <nav className="flex flex-1 flex-col">
                  <ul role="list" className="flex flex-1 flex-col gap-y-4">
                    <li>
                      <ul role="list" className="-mx-2 space-y-1">
                        {navigation.map((item) => (
                          <li key={item.name}>
                            {!hasAccess(item.tier) ? (
                              <button
                                onClick={() => {
                                  setUpgradeRequiredTier(item.tier as 'free' | 'basic' | 'premium')
                                  setShowUpgradeModal(true)
                                }}
                                className={classNames(
                                  'text-gray-400 hover:text-gray-300 group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold w-full'
                                )}
                              >
                                <item.icon aria-hidden="true" className="size-6 shrink-0" />
                                {item.name}
                                <SparklesIcon className="size-4 ml-auto mt-0.5 text-gray-400" />
                              </button>
                            ) : (
                              <Link
                                href={`${item.href}`}
                                onClick={() => setSidebarOpen(false)}
                                className={classNames(
                                  pathname === item.href
                                    ? 'bg-emc/50 hover:bg-emc/70 text-white'
                                    : 'text-gray-200 hover:bg-emc/70 hover:text-white',
                                  'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold',
                                )}
                              >
                                <item.icon aria-hidden="true" className="size-6 shrink-0" />
                                {item.name}
                              </Link>
                            )}
                          </li>
                        ))}
                      </ul>
                    </li>
                    
                    {/* Separator and requests item */}
                    <li className="border-t border-m-dark-green pt-4">
                      <ul role="list" className="-mx-2">
                        {!hasAccess(requestsNav.tier) ? (
                          <button
                            onClick={() => {
                              setUpgradeRequiredTier(requestsNav.tier as 'free' | 'basic' | 'premium')
                              setShowUpgradeModal(true)
                            }}
                            className={classNames(
                              'text-gray-400 hover:text-gray-300 group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold w-full'
                            )}
                          >
                            <requestsNav.icon aria-hidden="true" className="size-6 shrink-0" />
                            {requestsNav.name}
                            <SparklesIcon className="size-4 ml-auto mt-0.5 text-gray-400" />
                          </button>
                        ) : (
                          <Link
                            href={requestsNav.href}
                            onClick={() => setSidebarOpen(false)}
                            className={classNames(
                              pathname === requestsNav.href
                                ? 'bg-emc/50 hover:bg-emc/70 text-white'
                                : 'text-gray-200 hover:bg-emc/70 hover:text-white',
                              'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold'
                            )}
                          >
                            <requestsNav.icon aria-hidden="true" className="size-6 shrink-0" />
                            {requestsNav.name}
                          </Link>
                        )}
                      </ul>
                    </li>
                  </ul>
                </nav>
              </div>
            </DialogPanel>
          </div>
        </Dialog>

       

        <div className="top-0 z-10 flex items-center px-4 py-4 sm:px-6">
          <div className="flex items-center gap-x-4 min-w-fit">
            <button type="button" onClick={() => setSidebarOpen(!sidebarOpen)} className="-m-2.5 p-2.5 text-gray-400">
              <span className="sr-only">Open sidebar</span>
              <Bars3Icon aria-hidden="true" className="size-8 text-black hover:text-emerald-500 hover:bg-emerald-500/20 rounded-md p-1 border-2 border-m-dark-green" />
            </button>
            <div className="hidden xl:block text-lg font-semibold text-black">Analytics Dashboard</div>
          </div>
          {/* <div className="flex-1 flex justify-center sm:px-16 px-8">
            {tier === 'premium' ? <SearchBar /> : <DisplayOnlySearchBar />}

          </div> */}
        </div>

        {/* <main className="py-10 lg:pl-72"> */}
        <main>
          <div className="px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </>
  )
}
