"use client"
import { JobLocationMap } from "@/app/analytics/Graphs";
import { useRole } from "../RoleContext";

export default function RoleLocations() {
    const { roleData } = useRole();
    
    // Add safety checks for locations data
    if (!roleData?.locations) {
        return null;
    }

    return (
        <div className="h-full">
            <JobLocationMap locations={roleData.locations} />
        </div>
    )
}
