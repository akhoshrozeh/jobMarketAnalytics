import JobFilter from './JobFilter'
import JobPostings from './JobPostings'
import { Resource } from "sst";

const APIEndpoint = Resource.APIEndpoint.value;

async function getJobs() {
    try {
        const response = await fetch(`${APIEndpoint}/get-jobs`, {
            headers: {
            'Accept': 'application/json',
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response}`);
        }

        return response.json();


    } catch (error) {
        console.error("Error fetching jobs: ", error)
        return [];
    }
}

export default async function Jobs() {
    let jobs = [];
    jobs = await getJobs();

    
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
                <JobPostings jobs={jobs}/>

            </div>

            </div>

            </main>


        </div>
        
    );
  }