import { JobLocationMap } from "../Graphs";

export default async function TopLocations({topLocationsData}: {topLocationsData: {location: string, count: number, location_coords: number[]}[]}) {
    return (
        <div className="flex items-center justify-center h-[600px]">
            <JobLocationMap locations={topLocationsData} />
        </div>
    )
}
