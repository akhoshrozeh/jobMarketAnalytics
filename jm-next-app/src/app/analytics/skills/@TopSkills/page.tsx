import { getTopSkillsClient, getTier } from "@/lib/dataAcessLayer";

export default async function SearchResults() {
    const tier = await getTier();
    const skills = await getTopSkillsClient(tier);

    return (
        <div className="p-2 max-h-64 overflow-y-auto">
            {skills.map((skill: { _id: string; totalOccurences: number }) => (
                <div 
                    key={skill._id}
                    className="p-2 hover:bg-gray-100 cursor-pointer rounded"
                >
                    {skill._id}
                    {/* <span className="text-gray-500 ml-2">{skill.totalOc curences}</span> */}
                </div>
            ))}
        </div>
    );
}