import { Resource } from "sst";
import AggregatedGroup from "../components/AggregatedGrouped";

const APIEndpoint = Resource.APIEndpoint.value;

async function getAggregatedGrouped() {
  try {
    const response = await fetch(`${APIEndpoint}/avg-occ`, {
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response}`);
    }

    return response.json();
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
}

export default async function Metrics() {

    const aggGroup = await getAggregatedGrouped();
    console.log(aggGroup)

  

    return (
        <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Keyword Frequencies</h1>
        <h2>Top {aggGroup && aggGroup.length} Skills</h2>
        <div> {aggGroup && <AggregatedGroup data={aggGroup.slice(0, 50)}/>}

        </div>
        </div>
    );
}