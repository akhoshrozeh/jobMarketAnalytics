import "server-only"
import { KeywordsCounted } from "../Graphs";
import { getKeywordsCounted } from "@/lib/dataAcessLayer";

export default async function TopSkillsPage({
  searchParams,
}: {
  searchParams: { query?: string }
}) {
  const sliceLen: number = 20;
  const query = searchParams.query || ""; // Get query from URL params

  // Pass query to data access layer
  const topSkills = await getKeywordsCounted(query);

  return (
    <>
      {topSkills && <KeywordsCounted data={topSkills.slice(0, sliceLen)}/>}
    </>
  );
}