import { Resource } from "sst";
import AggregatedGroup from "./AggregatedGrouped";

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
    const sliceLen: number = 50;
    console.log(aggGroup)

  

    return (
        <div className="flex justify-center items-center flex-col p-8 text-white">
        <h1 className="text-2xl font-bold mb-4">Top {sliceLen} Skills</h1>
        <div className="border rounded-lg pt-4 px-4 pb-2"> {aggGroup && <AggregatedGroup data={aggGroup.slice(0, sliceLen)}/>}
        </div>
        </div>
    );
}