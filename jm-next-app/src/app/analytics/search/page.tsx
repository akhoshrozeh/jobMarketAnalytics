"use client"

export default function Search() {
    return (
        <div className="flex flex-col items-center justify-center">
            <label htmlFor="search" className="ml-px block pl-4 text-lg font-medium text-black">
                Search a keyword or job title to gather specific insights
            </label>
            <div className="mt-2 w-full px-4 max-w-2xl">
                <input
                    id="search"
                    name="search"
                    type="text"
                    placeholder="Search"
                    className="block w-full rounded-full bg-inherit px-6 py-3 text-lg text-black outline outline-1 -outline-offset-1 outline-black placeholder:text-gray-800 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-emerald-600"
                />
            </div>
        </div>
    )
}