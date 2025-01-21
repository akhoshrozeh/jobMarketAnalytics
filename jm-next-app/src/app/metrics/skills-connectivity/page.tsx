import { Resource } from "sst";
import { KeywordsConnectedByJob } from "../Graphs";

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
      return null;
    }
  }
  

async function getKeywordsConnectedByJob() {
    try {
        const response = await fetch(`${APIEndpoint}/get-keywords-connected-by-job`, {
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            const text = await response.text();
            console.log('Response body:', text);
            throw new Error(`Failed to fetch: ${response.status} ${text}`);
        }
        return response.json();

    } catch (error) {
        console.error("Error:", error);
        return null;
    }
}

export default async function Metrics() {



    const sliceLen: number = 50;

    // Execute both fetch calls in parallel
    const [aggGroup, keywordsConnectedByJob] = await Promise.all([
        getKeywordsCounted(),
        getKeywordsConnectedByJob()
    ]);

    return (
        <div className="flex justify-center items-center flex-col p-8 text-white">
            <h1 className="text-2xl font-bold mb-4">Relationship between Skills</h1>
            <div className="border rounded-lg pt-4 px-4 pb-2"> 
                {<KeywordsConnectedByJob nodes={aggGroup.slice(0, 20)} links={keywordsConnectedByJob}/>}
            </div>
        </div>
    );
}
