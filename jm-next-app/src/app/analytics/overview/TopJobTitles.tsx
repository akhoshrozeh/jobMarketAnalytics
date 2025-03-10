import "server-only"

import TopJobTitlesGraph from "../Graphs";

export default async function TopJobTitles({topJobTitlesData}: {topJobTitlesData: {title: string, count: number}[]}) {

    const topJobTitles = topJobTitlesData.map(item => ({
        title: item.title,
        count: item.count
    }));
    
    return (
        <div>
            <TopJobTitlesGraph data={topJobTitles} />
        </div>
    );
}