import "server-only"
import { getTopJobTitles } from "@/lib/dataAcessLayer"
import TopJobTitlesGraph from "../Graphs";

export default async function TopJobTitles() {
    const rawData = await getTopJobTitles();
    const topJobTitles = rawData.map(item => ({
        title: item.title,
        count: item.count
    }));
    
    return (
        <div>
            <TopJobTitlesGraph data={topJobTitles} />
        </div>
    );
}