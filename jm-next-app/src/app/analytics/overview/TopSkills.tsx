import "server-only"
import { TopSkillsGraph } from "../Graphs";


interface TopSkillsProps {
  blurLabels?: boolean; // Make this optional
  topSkills?: { _id: string; totalOccurrences: number }[];
  totalJobs: number;
}

export default async function TopSkills({ blurLabels = false,   topSkills, totalJobs }: TopSkillsProps) {
  return (
    <>
      {topSkills && (
        <TopSkillsGraph
          data={topSkills as { _id: string; totalOccurrences: number }[]}
          totalJobs={totalJobs}
          blurLabels={blurLabels}  // Forward to the chart
        />
      )}
    </>
  );
}