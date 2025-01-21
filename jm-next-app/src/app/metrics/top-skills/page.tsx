import { Resource } from "sst";
import { KeywordsCounted } from "../Graphs";


const APIEndpoint = Resource.APIEndpoint.value;


async function getKeywordsCounted() {
  try {
    const response = await fetch(`${APIEndpoint}/get-keywords-counted`, {
      headers: {
        'Accept': 'application/json',
      },

    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response}`);
    }

    return response.json();
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
}

export default async function TopSkillsPage() {

    const sliceLen: number = 50;

    // Execute both fetch calls in parallel
    const topSkills = await getKeywordsCounted();


    return (
        <div className="flex justify-center items-center flex-col p-8 text-white">
            <h1 className="text-2xl font-bold mb-4">Top {sliceLen} Skills</h1>
            <div className="border rounded-lg pt-4 px-4 pb-2"> 
                {topSkills && <KeywordsCounted data={topSkills.slice(0, sliceLen)}/>}
            </div>
            
        </div>
    );
}