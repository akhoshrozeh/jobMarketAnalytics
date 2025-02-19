import { ChevronRightIcon } from '@heroicons/react/20/solid'
import Image from 'next/image'
import { cookies } from 'next/headers'
import Pricing from './pricing/page'



export default async function Home() {

  return (
    <div className="relative isolate">
      <div className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-32 lg:flex lg:px-8 lg:py-40">
        <div className="mx-auto max-w-2xl shrink-0 lg:mx-0 lg:pt-8">
          <Image
            alt="Your Company"
            src="https://tailwindui.com/plus/img/logos/mark.svg?color=emerald&shade=500"
            className="h-11"
            width={100}
            height={100}
          />
          <div className="mt-24 sm:mt-32 lg:mt-16">
            <a href="#" className="inline-flex space-x-6">
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm/6 font-semibold text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                What&apos;s new
              </span>
              <span className="inline-flex items-center space-x-2 text-sm/6 font-medium text-black">
                <span>Just shipped v1.0</span>
                <ChevronRightIcon aria-hidden="true" className="size-5 text-gray-500" />
              </span>
            </a>
          </div>
          <h1 className="mt-10 text-pretty text-5xl font-semibold tracking-tight text-black sm:text-7xl">
            Stay ahead of the competition. 
          </h1>
          <p className="mt-8 text-pretty text-lg font-medium text-black sm:text-xl/8">
            JobTrendr gives you real-time insights into the job market and keeps you ahead of the curve.
          </p>
          <div className="mt-10 flex items-center gap-x-6">
            <a
              href="#"
              className="rounded-md bg-emerald-500 px-3.5 py-2.5 text-sm font-semibold text-black shadow-sm hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
            >
              Get started
            </a>
            <a href="#" className="text-sm/6 font-semibold text-black">
              Learn more <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
        <div className="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:ml-10 lg:mr-0 lg:mt-0 lg:max-w-none lg:flex-none xl:ml-32">
          <div className="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
            {/* <Image
              alt="App screenshot"
              src="https://tailwindui.com/plus/img/component-images/dark-project-app-screenshot.png"
              width={2432}
              height={1442}
              className="w-[76rem] rounded-md bg-white/5 shadow-2xl ring-1 ring-white/10 overflow-x-hidden"
            /> */}
          </div>
        </div>
      </div>
      <div className="border-t-2 border-emerald-500">
        <Pricing />
      </div>
    </div>
  )
}
