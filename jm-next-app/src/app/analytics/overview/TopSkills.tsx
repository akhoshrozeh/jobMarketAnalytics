import "server-only"
import { KeywordsCounted } from "../Graphs";


interface TopSkillsProps {
  blurLabels?: boolean; // Make this optional
  topSkills?: { _id: string; totalOccurrences: number }[];
}

export default async function TopSkills({ blurLabels = false,   topSkills }: TopSkillsProps) {
  return (
    <>
      {topSkills && (
        <KeywordsCounted
          data={topSkills as { _id: string; totalOccurrences: number }[]}
          blurLabels={blurLabels}  // Forward to the chart
        />
      )}
    </>
  );
}