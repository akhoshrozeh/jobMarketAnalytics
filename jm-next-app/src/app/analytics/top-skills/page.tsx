import "server-only"
import { KeywordsCounted } from "../Graphs";
import { getKeywordsCounted } from "@/lib/dataAcessLayer";

export default async function TopSkillsPage({
  searchParams,
}: {
  searchParams: { query?: string }
}) {
  const sliceLen: number = 50;
  const query = searchParams.query || ""; // Get query from URL params

  // Pass query to data access layer
  const topSkills = await getKeywordsCounted(query);

  return (
    <div className="flex justify-center items-center flex-col p-8 text-black">
      <h1 className="text-2xl font-bold mb-4">Top {sliceLen} Skills</h1>
      <h2>{query}</h2>
      <div className="border rounded-lg pt-4 px-4 pb-2 border-m-dark-green border-2 bg-white shadow shadow-7xl shadow-m-dark-green"> 
        {topSkills && <KeywordsCounted data={topSkills.slice(0, sliceLen)}/>}
      </div>
    </div>
  );
}