import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { EllipsisVerticalIcon } from '@heroicons/react/20/solid'
import { JobPost } from '@/types/JobPostType'

const statuses = {
  Complete: 'text-green-700 bg-green-50 ring-green-600/20',
  'In progress': 'text-gray-600 bg-gray-50 ring-gray-500/10',
  Archived: 'text-yellow-800 bg-yellow-50 ring-yellow-600/20',
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  }
  if (diffDays <= 7) {
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  }
  
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

export default async function JobPostings({ jobs }: { jobs: Array<JobPost> }) {
  return (
    <ul role="list" className="divide-y divide-gray-100">
      {jobs.map((job) => (
        <li key={job._id} className="flex items-center justify-between gap-x-6 py-5">
          <div className="min-w-0">
            <div className="flex items-start gap-x-3">
              <p className="text-md font-semibold text-white">{job.title}</p>
              {/* <p
                className=
                  'mt-0.5 whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset text-green-700 bg-green-50 ring-green-600/20'
                
              >
                {job.company} */}
              {/* </p> */}
            </div>
            <div className="text-sm text-white">{job.company}</div>

            <div className="flex flex-wrap gap-2 my-2">
              {job.extracted_keywords && job.extracted_keywords.slice(0, 5).map((keyword) => (
                <p key={keyword} className="text-green-700 bg-green-50 rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ring-green-600/20">{keyword}</p>
              ))} 
            
            </div> 

            <div className="mt-1 flex items-center gap-x-2 text-sm/5">
              <p className="whitespace-nowrap">
                <time dateTime={job.date_posted}>{formatDate(job.date_posted)}</time>
              </p>
              <svg viewBox="0 0 2 2" className="size-0.5 fill-current">
                <circle r={1} cx={1} cy={1} />
              </svg>
              {/* <p className="truncate">{job.company}</p> */}
            </div>
          </div>
          <div className="flex flex-none items-center gap-x-4">
            <a
              href={job.job_url}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden rounded-md px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-indigo-500 sm:block"
            >
              View job<span className="sr-only"></span>
            </a>
            <Menu as="div" className="relative flex-none">
              <MenuButton className="-m-2.5 block p-2.5 text-gray-500 hover:text-white">
                <span className="sr-only">Open options</span>
                <EllipsisVerticalIcon aria-hidden="true" className="size-5" />
              </MenuButton>
              <MenuItems
                transition
                className="absolute right-0 z-10 mt-2 w-32 origin-top-right rounded-md bg-gray-900 py-2 shadow-lg ring-1 ring-gray-900/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
              >
                <MenuItem>
                  <a
                    href="#"
                    className="block px-3 py-1 text-sm/6 text-white data-[focus]:bg-gray-50 data-[focus]:outline-none"
                  >
                    Edit<span className="sr-only"></span>
                  </a>
                </MenuItem>
                <MenuItem>
                  <a
                    href="#"
                    className="block px-3 py-1 text-sm/6 text-white data-[focus]:bg-gray-50 data-[focus]:outline-none"
                  >
                    Move<span className="sr-only"></span>
                  </a>
                </MenuItem>
                <MenuItem>
                  <a
                    href="#"
                    className="block px-3 py-1 text-sm/6 text-white data-[focus]:bg-gray-50 data-[focus]:outline-none"
                  >
                    Delete<span className="sr-only"></span>
                  </a>
                </MenuItem>
              </MenuItems>
            </Menu>
          </div>
        </li>
      ))}
    </ul>
  )
}
