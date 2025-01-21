"use client"

export default function Search() {
    return (
        <div className="flex flex-col items-center justify-center">
            <label htmlFor="search" className="ml-px block pl-4 text-lg font-medium text-white">
                Search a keyword or job title to gather specific insights
            </label>
            <div className="mt-2 w-full px-4 max-w-2xl">
                <input
                    id="search"
                    name="search"
                    type="text"
                    placeholder="Search"
                    className="block w-full rounded-full bg-inherit px-6 py-3 text-lg text-white outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                />
            </div>
        </div>
    )
}