import { getTopLocations } from "@/lib/dataAcessLayer";
import { JobLocationMap } from "../Graphs";

export default async function TopLocations() {
    // hard coding long lat
    const points = {
        "New York, NY, US": {"latitude": 40.7128, "longitude": -74.0060 },
        "Seattle, WA, US": {"latitude": 47.6062, "longitude": -122.3321 },
        "San Francisco, CA, US": { "latitude": 37.7749, "longitude": -122.4194 },
        "Sunnyvale, CA, US": { "latitude": 37.3688, "longitude": -122.0363 },
        "San Jose, CA, US": { "latitude": 37.3382, "longitude": -121.8863 },
        "Austin, TX": { "latitude": 30.2672, "longitude": -97.7431 },
        "Mountain View, CA, US": { "latitude": 37.3861, "longitude": -122.0839 },
        "Los Angeles, CA, US": { "latitude": 34.0522, "longitude": -118.2437 },
        "Austin, TX, US": { "latitude": 30.2672, "longitude": -97.7431 },
        "San Diego, CA, US": { "latitude": 32.7157, "longitude": -117.1611 },
        "San Francisco, CA": { "latitude": 37.7749, "longitude": -122.4194 },
        "Chicago, IL, US": { "latitude": 41.8781, "longitude": -87.6298 },
        "Cupertino, CA, US": { "latitude": 37.3220, "longitude": -122.0322 },
        "Santa Clara, CA, US": { "latitude": 37.3541, "longitude": -121.9552 },
        "Palo Alto, CA, US": { "latitude": 37.4419, "longitude": -122.1430 },
        "Redmond, WA, US": { "latitude": 47.6739, "longitude": -122.1215 },
        "Boston, MA, US": { "latitude": 42.3601, "longitude": -71.0589 },
        "Irvine, CA, US": { "latitude": 33.6846, "longitude": -117.8265 },
        "Bellevue, WA, US": { "latitude": 47.6101, "longitude": -122.2015 },
        "Jersey City, NJ, US": { "latitude": 40.7178, "longitude": -74.0431 },
        "New York, NY": { "latitude": 40.7128, "longitude": -74.0060 },
        "San Francisco Bay Area, CA, US": { "latitude": 37.7749, "longitude": -122.4194 },
        "United States": { "latitude": 37.0902, "longitude": -95.7129 },
        "El Segundo, CA, US": { "latitude": 33.9192, "longitude": -118.4165 },
        "Fremont, CA, US": { "latitude": 37.5483, "longitude": -121.9886 },
        "San Mateo, CA, US": { "latitude": 37.5630, "longitude": -122.3255 },
        "Redwood City, CA, US": { "latitude": 37.4852, "longitude": -122.2364 },
        "San Jose, CA": {"latitude": 37.3382, "longitude": -121.8863 },
        "Menlo Park, CA, US": {"latitude": 37.4521, "longitude": -122.1796 },
        "Milpitas, CA, US": {"latitude": 37.4323, "longitude": -121.8996 },
        "Costa Mesa, CA, US": {"latitude": 33.6411, "longitude": -117.9187 },
        "Kirkland, WA, US": {"latitude": 47.6769, "longitude": -122.2060 },
        "Sunnyvale, CA": {"latitude": 37.3688, "longitude": -122.0363 },
        "Oakland, CA, US": {"latitude": 37.8044, "longitude": -122.2711 },
        "Washington, DC": {"latitude": 38.9072, "longitude": -77.0369 },
        "Pleasanton, CA, US": {"latitude": 37.6624, "longitude": -121.8747 },
        "Brooklyn, NY, US": {"latitude": 40.6782, "longitude": -73.9442 },
        "Newark, NJ, US": {"latitude": 40.7357, "longitude": -74.1724 },
        "Cambridge, MA, US": {"latitude": 42.3736, "longitude": -71.1097 },
        "San Diego, CA": {"latitude": 32.7157, "longitude": -117.1611 },
        "Foster City, CA, US": {"latitude": 37.5585, "longitude": -122.2711 },
        "Parsippany-Troy Hills, NJ, US": {"latitude": 40.8579, "longitude": -74.4250 },
        "Ontario, CA, US": {"latitude": 34.0633, "longitude": -117.6509 },
        "Santa Monica, CA, US": {"latitude": 34.0195, "longitude": -118.4912 },
    }

       
      

    // Helper function to get coordinates by location name
    const getCoordinates = (locationName: string) => {
    return points[locationName as keyof typeof points] || null;
    };

  
    const topLocations = await getTopLocations();

    // Map the API data to include coordinates
    const locationsWithCoordinates = topLocations.map(loc => ({
        location: loc.location,
        count: loc.count,
        latitude: getCoordinates(loc.location)?.latitude || 0,
        longitude: getCoordinates(loc.location)?.longitude || 0
    }));

    return (
        <div>
            {/* {topLocations.map((location) => (
                <div key={location.location}>
                    {location.location}
                    {location.count}
                    {getCoordinates(location.location)?.lateitude}
                </div>
            ))} */}
            <JobLocationMap locations={locationsWithCoordinates} />
        </div>
    )
}
