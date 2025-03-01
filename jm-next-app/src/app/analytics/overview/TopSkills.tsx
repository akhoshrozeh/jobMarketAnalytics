import "server-only"
import { KeywordsCounted } from "../Graphs";
import { getTopSkills } from "@/lib/dataAcessLayer";

export default async function TopSkills() {
  
  const topSkills = await getTopSkills();

  return (
    <>
      {topSkills && <KeywordsCounted data={topSkills as { _id: string; totalOccurrences: number; }[]}/>}
    </>
  );
}