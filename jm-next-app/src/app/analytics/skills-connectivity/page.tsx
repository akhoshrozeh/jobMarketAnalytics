// import { KeywordsConnectedByJob } from "../Graphs";
// import { getKeywordsConnectedByJob, getTopSkills } from "@/lib/dataAcessLayer";


export default async function SkillsConnectivity() {

    // const sliceLen: number = 10;

    // // Execute both fetch calls in parallel
    // const [aggGroup, keywordsConnectedByJob] = await Promise.all([
    //     getTopSkills(),
    //     getKeywordsConnectedByJob()
    // ]);

    return (
        <div className="flex justify-center items-center flex-col p-8 text-black">
            {/* <h1 className="text-2xl font-bold mb-4">Relationship between Skills</h1>
            <div className="border rounded-lg pt-4 px-4 pb-2 border-m-dark-green border-2"> 
                {<KeywordsConnectedByJob nodes={aggGroup.slice(0, 20) as any} links={keywordsConnectedByJob as any}/>}
            </div> */}
            Skills Connectivity
        </div>
    );
}
