import { Resource } from "sst";
import KeywordsCounted from "./KeywordsCounted";

const APIEndpoint = Resource.APIEndpoint.value;

async function getKeywordsCounted() {
  try {
    const response = await fetch(`${APIEndpoint}/get-keywords-counted`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 21600 },
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

    const aggGroup = await getKeywordsCounted();
    const sliceLen: number = 50;
    console.log(aggGroup)

  

    return (
        <div className="flex justify-center items-center flex-col p-8 text-white">
        <h1 className="text-2xl font-bold mb-4">Top {sliceLen} Skills</h1>
        <div className="border rounded-lg pt-4 px-4 pb-2"> {aggGroup && <KeywordsCounted data={aggGroup.slice(0, sliceLen)}/>}
        </div>
        </div>
    );
}