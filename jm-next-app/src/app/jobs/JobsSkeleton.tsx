import React from 'react';
import JobFilter from './JobFilter';

function LoadingSkeleton() {
    return (
      <ul role="list" className="divide-y divide-gray-100">
        {[...Array(10)].map((_, index) => (
          <li key={index} className="flex items-center justify-between gap-x-6 py-5 animate-pulse">
            <div className="min-w-128">
              <div className="flex items-start gap-x-3">
                <div className="h-4 bg-gray-300 rounded sm:w-96 w-48" ></div>
              </div>
              <div className="h-3 bg-gray-300 rounded w-3/4 mt-2"></div>
              <div className="flex flex-wrap gap-2 my-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-3 bg-gray-300 rounded w-1/6"></div>
                ))}
              </div>
              <div className="mt-1 flex items-center gap-x-2 text-sm/5">
                <div className="h-3 bg-gray-300 rounded w-1/3"></div>
                <svg viewBox="0 0 2 2" className="size-0.5 fill-current">
                  <circle r={1} cx={1} cy={1} />
                </svg>
                <div className="h-3 bg-gray-300 rounded w-1/3"></div>
              </div>
            </div>
            <div className="flex flex-none items-center gap-x-4">
              <div className="h-8 bg-gray-300 rounded w-16"></div>
              {/* <div className="h-8 bg-gray-300 rounded w-10"></div> */}
            </div>
          </li>
        ))}
      </ul>
    );
  }

export default function JobSkeleton() {
    return (
        <div>
            <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
          <div className="border-b border-gray-200 pb-10">
            <h1 className="text-4xl font-bold tracking-tight text-white">Job Postings</h1>
            <p className="mt-4 text-base text-gray-300">
              Checkout the latest job postings from the biggest job boards.
            </p>
          </div>

          <div className="pt-12 lg:grid lg:grid-cols-3 lg:gap-x-8 xl:grid-cols-4">
            <JobFilter/>
            <div className="lg:col-span-2 xl:col-span-3">
                {LoadingSkeleton()}

            </div>

            </div>

            </main>


        </div>
    );
}