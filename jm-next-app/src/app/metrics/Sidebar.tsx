'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Dialog, DialogBackdrop, DialogPanel, TransitionChild } from '@headlessui/react'
import {
  Bars3Icon,
  ShareIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ChartBarIcon,
  LockClosedIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import Image from 'next/image'


const navigation = [
  { name: 'Top Skills', href: '/metrics/top-skills', icon: ChartBarIcon, current: true, tier: 'free' },
  { name: 'Skill Relationships', href: '/metrics/skills-connectivity', icon: ShareIcon, current: false, tier: 'basic' },
  { name: 'Search', href: '/metrics/search', icon: MagnifyingGlassIcon, current: false, tier: 'premium' },
]

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
              <TransitionChild>
                <div className="absolute left-full top-0 flex w-16 justify-center pt-5 duration-300 ease-in-out data-[closed]:opacity-0 mt-8">
                  <button type="button" onClick={() => setSidebarOpen(false)} className="-m-2.5 p-2.5">
                    <span className="sr-only">Close sidebar</span>
                    <XMarkIcon aria-hidden="true" className="size-10 text-white bg-black rounded-3xl border-2 border-emc" />
                  </button>
                </div>
              </TransitionChild>
              {/* Sidebar component, swap this element with another sidebar if you like */}
              <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-black px-6 pb-2 border-t-2 border-r-2 border-b-2  rounded-tr-xl rounded-br-xl border-emerald-500 mt-16">
                <div className="flex h-16 shrink-0 items-center">
                    Analytics Menu
                </div>
                <nav className="flex flex-1 flex-col">
                  <ul role="list" className="flex flex-1 flex-col gap-y-7">
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
                                  'text-gray-600 hover:text-gray-400 group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold w-full'
                                )}
                              >
                                <item.icon aria-hidden="true" className="size-6 shrink-0" />
                                {item.name}
                                <SparklesIcon className="size-4 ml-auto mt-0.5 text-gray-400" />
                              </button>
                            ) : (
                              <Link
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={classNames(
                                  pathname === item.href
                                    ? 'bg-emc/50 hover:bg-emc/70 text-white'
                                    : 'text-gray-400 hover:bg-emc/70 hover:text-white',
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
                
                  </ul>
                </nav>
              </div>
            </DialogPanel>
          </div>
        </Dialog>

       

        <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-inherit  px-4 py-4 shadow-sm sm:px-6">
          <button type="button" onClick={() => setSidebarOpen(true)} className="-m-2.5 p-2.5 text-gray-400">
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon aria-hidden="true" className="size-6 text-emc animate-pulse" />
          </button>
          <div className="flex-1 text-lg font-semibold text-white">Analytics Dashboard</div>
          
        </div>

        {/* <main className="py-10 lg:pl-72"> */}
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </>
  )
}
