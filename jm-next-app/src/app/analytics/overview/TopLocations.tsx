import { JobLocationMap } from "../Graphs";

export default async function TopLocations({topLocationsData}: {topLocationsData: {location: string, count: number, location_coords: number[]}[]}) {
    return (
        <div className="h-full">
            <JobLocationMap locations={topLocationsData} />
        </div>
    )
}
